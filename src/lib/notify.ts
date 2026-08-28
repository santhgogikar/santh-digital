import { formatDateTime } from "./format";
import { hasura } from "./hasura";

export type AppointmentNotice = {
  id: string;
  clinic_id: string;
  booking_reference: string;
  starts_at: string;
  status: string;
  clinic: { name: string; email: string | null; timezone: string };
  patient: { name: string; mobile: string };
  doctor: { name: string };
  service: { name: string };
};

export function clinicAppointmentEmail(notice: AppointmentNotice) {
  const when = formatDateTime(notice.starts_at, notice.clinic.timezone);
  const subject = `New appointment request · ${notice.booking_reference}`;
  const text = [
    "A patient booked through the clinic website.",
    "",
    `Clinic: ${notice.clinic.name}`,
    `Reference: ${notice.booking_reference}`,
    `Status: ${notice.status}`,
    `Patient: ${notice.patient.name}`,
    `Mobile: ${notice.patient.mobile}`,
    `Treatment: ${notice.service.name}`,
    `Doctor: ${notice.doctor.name}`,
    `When: ${when}`,
    "",
    "Open the dashboard to call, WhatsApp, or confirm.",
  ].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;color:#0A0A0A"><p>A patient booked through the clinic website.</p><p><strong>${notice.patient.name}</strong> · ${notice.patient.mobile}<br/>${notice.service.name} with ${notice.doctor.name}<br/>${when}<br/>Ref ${notice.booking_reference}</p><p>Open the dashboard to call, WhatsApp, or confirm the slot.</p></div>`;
  return {
    subject,
    text,
    html,
    title: "New appointment request",
    body: `${notice.patient.name} · ${notice.service.name} · ${when}`,
  };
}

export async function loadAppointmentNotice(appointmentId: string) {
  const data = await hasura<{ appointments_by_pk: AppointmentNotice | null }>(
    `query Notice($id: uuid!) {
      appointments_by_pk(id: $id) {
        id
        clinic_id
        booking_reference
        starts_at
        status
        clinic { name email timezone }
        patient { name mobile }
        doctor { name }
        service { name }
      }
    }`,
    { id: appointmentId },
  );
  return data.appointments_by_pk;
}

export async function notifyAppointmentCreated(appointmentId: string) {
  const notice = await loadAppointmentNotice(appointmentId);
  if (!notice) return { emailed: false, reason: "missing_appointment" as const };

  const existing = await hasura<{
    clinic_notifications: { id: string }[];
  }>(
    `query Existing($appointmentId: uuid!) {
      clinic_notifications(where: { appointment_id: { _eq: $appointmentId } }, limit: 1) { id }
    }`,
    { appointmentId },
  );
  if (existing.clinic_notifications[0]) {
    return { emailed: false, reason: "already_notified" as const };
  }

  const copy = clinicAppointmentEmail(notice);
  let notificationId: string;
  try {
    const inserted = await hasura<{ insert_clinic_notifications_one: { id: string } }>(
      `mutation PortalNotice(
        $clinicId: uuid!
        $appointmentId: uuid!
        $title: String!
        $body: String!
      ) {
        insert_clinic_notifications_one(
          object: {
            clinic_id: $clinicId
            appointment_id: $appointmentId
            title: $title
            body: $body
            email_status: "pending"
          }
        ) { id }
      }`,
      {
        clinicId: notice.clinic_id,
        appointmentId,
        title: copy.title,
        body: copy.body,
      },
    );
    notificationId = inserted.insert_clinic_notifications_one.id;
  } catch {
    return { emailed: false, reason: "already_notified" as const };
  }

  const emailed = await sendClinicEmail(notice.clinic.email, copy.subject, copy.text, copy.html);
  await hasura(
    `mutation SetEmailStatus($id: uuid!, $status: String!) {
      update_clinic_notifications_by_pk(pk_columns: { id: $id }, _set: { email_status: $status }) { id }
    }`,
    { id: notificationId, status: emailed.status },
  );
  return { emailed: emailed.status === "sent", reason: emailed.status };
}

async function sendClinicEmail(to: string | null, subject: string, text: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const preferredFrom = process.env.RESEND_FROM;
  const onboardingFrom = `Santh Digital <onboarding@${["resend", "dev"].join(".")}>`;
  if (!to) return { status: "skipped" };
  if (!apiKey) {
    console.info("[notify] Resend not configured. Clinic email skipped.", { to, subject });
    return { status: "skipped" };
  }
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const first = await resend.emails.send({
    from: preferredFrom || onboardingFrom,
    to,
    subject,
    text,
    html,
  });
  if (!first.error) return { status: "sent" };

  const unverified = first.error.message?.toLowerCase().includes("not verified");
  if (unverified && preferredFrom && preferredFrom !== onboardingFrom) {
    const retry = await resend.emails.send({
      from: onboardingFrom,
      to,
      subject,
      text,
      html,
    });
    if (!retry.error) return { status: "sent" };
    console.error("[notify] Resend error", retry.error);
    return { status: "failed" };
  }

  console.error("[notify] Resend error", first.error);
  return { status: "failed" };
}
