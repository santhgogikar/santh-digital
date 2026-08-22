"use client";

import { useRouter } from "next/navigation";
import { telLink, whatsappLink } from "@/lib/slug";

type Appointment = {
  id: string;
  booking_reference: string;
  status: string;
  starts_atLabel: string;
  doctorName: string;
  serviceName: string;
  patientName: string;
  patientMobile: string;
  clinicName: string;
};

async function setStatus(id: string, status: string) {
  const response = await fetch("/api/dashboard/appointments", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
  if (!response.ok) throw new Error("Could not update appointment.");
}

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const message = `Hello ${appointment.patientName}, this is ${appointment.clinicName}. Please confirm your appointment (${appointment.booking_reference}) on ${appointment.starts_atLabel} for ${appointment.serviceName} with ${appointment.doctorName}.`;

  async function confirm() {
    await setStatus(appointment.id, "confirmed");
    router.refresh();
  }

  async function cancel() {
    if (!window.confirm("Cancel this appointment? The slot will open again for other patients.")) return;
    await setStatus(appointment.id, "cancelled");
    router.refresh();
  }

  async function complete() {
    await setStatus(appointment.id, "completed");
    router.refresh();
  }

  async function noShow() {
    if (!window.confirm("Mark this patient as a no-show?")) return;
    await setStatus(appointment.id, "no_show");
    router.refresh();
  }

  return (
    <article className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gold">{appointment.status.replace("_", " ")}</p>
          <p className="mt-1 font-semibold">{appointment.patientName}</p>
          <p className="text-sm text-ink-soft">{appointment.starts_atLabel}</p>
        </div>
        <p className="text-xs font-semibold text-ink-soft">{appointment.booking_reference}</p>
      </div>
      <p className="mt-3 text-sm">
        {appointment.serviceName}
        <span className="text-ink-soft"> · {appointment.doctorName}</span>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a className="rounded-full bg-teal px-3 py-2 text-sm font-semibold text-white" href={telLink(appointment.patientMobile)}>
          Call
        </a>
        <a
          className="rounded-full border border-teal px-3 py-2 text-sm font-semibold text-teal"
          href={whatsappLink(appointment.patientMobile, message)}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>
        {appointment.status === "pending" ? (
          <button type="button" className="rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white" onClick={() => void confirm()}>
            Confirm
          </button>
        ) : null}
        {appointment.status === "confirmed" ? (
          <button type="button" className="rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white" onClick={() => void complete()}>
            Done
          </button>
        ) : null}
        {appointment.status === "pending" || appointment.status === "confirmed" ? (
          <button type="button" className="rounded-full border border-clay px-3 py-2 text-sm font-semibold text-clay" onClick={() => void cancel()}>
            Cancel
          </button>
        ) : null}
        {appointment.status === "confirmed" ? (
          <button type="button" className="rounded-full border border-line px-3 py-2 text-sm" onClick={() => void noShow()}>
            No-show
          </button>
        ) : null}
      </div>
    </article>
  );
}
