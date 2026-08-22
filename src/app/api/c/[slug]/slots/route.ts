import { NextRequest, NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";
import { getBusyAppointments, getClinicBySlug, getHolidays, getWorkingHours } from "@/lib/clinic";
import { computeSlots } from "@/lib/slots";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) return NextResponse.json({ error: "Clinic not found." }, { status: 404 });

  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const doctorId = request.nextUrl.searchParams.get("doctorId");
  const date = request.nextUrl.searchParams.get("date");
  if (!serviceId || !doctorId || !date) {
    return NextResponse.json({ error: "serviceId, doctorId and date are required." }, { status: 400 });
  }

  const service = clinic.services.find((s) => s.id === serviceId);
  const doctor = clinic.doctors.find((d) => d.id === doctorId);
  if (!service || !doctor) {
    return NextResponse.json({ error: "Unknown doctor or service." }, { status: 400 });
  }

  const offers = doctor.doctor_services.some((ds) => ds.service.id === serviceId);
  if (!offers) {
    return NextResponse.json({ error: "This doctor does not offer that service." }, { status: 400 });
  }

  const hours = await getWorkingHours(clinic.id, doctorId);
  const holidays = await getHolidays(clinic.id, doctorId, date, date);
  const dayStart = fromZonedTime(`${date}T00:00:00`, clinic.timezone);
  const dayEnd = fromZonedTime(`${date}T23:59:59`, clinic.timezone);
  const busy = await getBusyAppointments(doctorId, dayStart.toISOString(), dayEnd.toISOString());

  const slots = computeSlots({
    dateYmd: date,
    timeZone: clinic.timezone,
    durationMinutes: service.duration_minutes,
    bufferMinutes: clinic.booking_buffer_minutes,
    hours,
    busy,
    holidays,
  });

  return NextResponse.json({ slots, durationMinutes: service.duration_minutes });
}
