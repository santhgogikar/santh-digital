import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getClinicById } from "@/lib/clinic";
import { hasura } from "@/lib/hasura";
import { formatDateTime } from "@/lib/format";
import { AppointmentCard } from "@/components/appointment-card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppointmentsPage() {
  const session = await getSession();
  if (!session?.clinicId) redirect("/login");
  const clinic = await getClinicById(session.clinicId);
  if (!clinic) redirect("/login");

  const data = await hasura<{
    appointments: {
      id: string;
      booking_reference: string;
      status: string;
      starts_at: string;
      doctor: { name: string };
      service: { name: string };
      patient: { name: string; mobile: string };
    }[];
  }>(
    `query List($clinicId: uuid!) {
      appointments(where: { clinic_id: { _eq: $clinicId } }, order_by: { starts_at: desc }, limit: 80) {
        id
        booking_reference
        status
        starts_at
        doctor { name }
        service { name }
        patient { name mobile }
      }
    }`,
    { clinicId: session.clinicId },
  );

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl">Bookings</h1>
      <p className="mt-1 text-sm text-ink-soft">Call or WhatsApp the patient, confirm the slot, or cancel if they cannot come.</p>
      <div className="mt-5 grid gap-3">
        {data.appointments.map((row) => (
          <AppointmentCard
            key={row.id}
            appointment={{
              id: row.id,
              booking_reference: row.booking_reference,
              status: row.status,
              starts_atLabel: formatDateTime(row.starts_at),
              doctorName: row.doctor.name,
              serviceName: row.service.name,
              patientName: row.patient.name,
              patientMobile: row.patient.mobile,
              clinicName: clinic.name,
            }}
          />
        ))}
        {data.appointments.length === 0 ? <p className="text-ink-soft">No bookings yet.</p> : null}
      </div>
    </div>
  );
}
