import { AppointmentCard } from "@/components/appointment-card";
import { formatDateTime } from "@/lib/format";
import type { DashboardAppointment } from "@/lib/dashboard-data";

export function AppointmentList({
  rows,
  clinicName,
  empty,
}: {
  rows: DashboardAppointment[];
  clinicName: string;
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-ink-soft">{empty}</p>;
  }

  return (
    <div className="mt-3 grid gap-3">
      {rows.map((row) => (
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
            clinicName,
          }}
        />
      ))}
    </div>
  );
}
