import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getBusyAppointments, getClinicBySlug, getHolidays, getWorkingHours } from "@/lib/clinic";
import { bookingReference } from "@/lib/format";
import { hasura } from "@/lib/hasura";
import { computeSlots } from "@/lib/slots";
import { notifyAppointmentCreated } from "@/lib/notify";
import { fromZonedTime } from "date-fns-tz";

const schema = z.object({
  serviceId: z.string().min(8),
  doctorId: z.string().min(8),
  start: z.string(),
  name: z.string().min(2).max(80),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number."),
  email: z.string().email().optional().or(z.literal("")),
  isExisting: z.boolean().optional(),
  notes: z.string().max(400).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) return NextResponse.json({ error: "Clinic not found." }, { status: 404 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid booking." }, { status: 400 });
  }

  const { serviceId, doctorId, start, name, mobile, email, isExisting, notes } = parsed.data;
  const service = clinic.services.find((s) => s.id === serviceId);
  const doctor = clinic.doctors.find((d) => d.id === doctorId);
  const location = clinic.locations.find((l) => l.is_primary) ?? clinic.locations[0];
  if (!service || !doctor || !location) {
    return NextResponse.json({ error: "Unable to place this booking." }, { status: 400 });
  }

  if (!doctor.doctor_services.some((ds) => ds.service.id === serviceId)) {
    return NextResponse.json({ error: "This doctor does not offer that service." }, { status: 400 });
  }

  const startDate = new Date(start);
  const dateYmd = new Intl.DateTimeFormat("en-CA", {
    timeZone: clinic.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(startDate);

  const hours = await getWorkingHours(clinic.id, doctorId);
  const holidays = await getHolidays(clinic.id, doctorId, dateYmd, dateYmd);
  const dayStart = fromZonedTime(`${dateYmd}T00:00:00`, clinic.timezone);
  const dayEnd = fromZonedTime(`${dateYmd}T23:59:59`, clinic.timezone);
  const busy = await getBusyAppointments(doctorId, dayStart.toISOString(), dayEnd.toISOString());
  const slots = computeSlots({
    dateYmd,
    timeZone: clinic.timezone,
    durationMinutes: service.duration_minutes,
    bufferMinutes: clinic.booking_buffer_minutes,
    hours,
    busy,
    holidays,
  });

  const matched = slots.find((s) => s.start === startDate.toISOString());
  if (!matched) {
    return NextResponse.json(
      { error: "That slot is no longer available. Choose another time." },
      { status: 409 },
    );
  }

  const status = "pending";
  const reference = bookingReference();

  try {
    const data = await hasura<{
      insert_patients_one: { id: string };
      insert_appointments_one: {
        id: string;
        booking_reference: string;
        status: string;
        starts_at: string;
        ends_at: string;
      };
    }>(
      `mutation UpsertPatient(
        $clinicId: uuid!
        $name: String!
        $mobile: String!
        $email: String
        $existing: Boolean!
      ) {
        insert_patients_one(
          object: {
            clinic_id: $clinicId
            name: $name
            mobile: $mobile
            email: $email
            is_existing: $existing
          }
          on_conflict: {
            constraint: patients_clinic_id_mobile_key
            update_columns: [name, email]
          }
        ) {
          id
        }
      }`,
      {
        clinicId: clinic.id,
        name: name.trim(),
        mobile,
        email: email || null,
        existing: Boolean(isExisting),
      },
    );

    const booked = await hasura<{
      insert_appointments_one: {
        id: string;
        booking_reference: string;
        status: string;
        starts_at: string;
        ends_at: string;
      };
    }>(
      `mutation CreateAppointment(
        $clinicId: uuid!
        $locationId: uuid!
        $doctorId: uuid!
        $serviceId: uuid!
        $patientId: uuid!
        $startsAt: timestamptz!
        $endsAt: timestamptz!
        $status: appointment_status!
        $reference: String!
        $notes: String
      ) {
        insert_appointments_one(
          object: {
            clinic_id: $clinicId
            location_id: $locationId
            doctor_id: $doctorId
            service_id: $serviceId
            patient_id: $patientId
            starts_at: $startsAt
            ends_at: $endsAt
            status: $status
            booking_reference: $reference
            notes: $notes
            source: online
          }
        ) {
          id
          booking_reference
          status
          starts_at
          ends_at
        }
      }`,
      {
        clinicId: clinic.id,
        locationId: location.id,
        doctorId,
        serviceId,
        patientId: data.insert_patients_one.id,
        startsAt: matched.start,
        endsAt: matched.end,
        status,
        reference,
        notes: notes || null,
      },
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/appointments");

    try {
      await notifyAppointmentCreated(booked.insert_appointments_one.id);
    } catch (notifyError) {
      console.error("[notify] appointment created handler failed", notifyError);
    }

    return NextResponse.json({
      appointment: booked.insert_appointments_one,
      clinic: { name: clinic.name, phone: clinic.phone, timezone: clinic.timezone },
      doctor: { name: doctor.name },
      service: { name: service.name },
      location: { name: location.name, address_line1: location.address_line1, area: location.area },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed.";
    if (message.toLowerCase().includes("appointments_no_overlap") || message.toLowerCase().includes("exclusion")) {
      return NextResponse.json(
        { error: "That slot was just taken. Please choose another time." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
