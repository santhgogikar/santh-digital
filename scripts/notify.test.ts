import assert from "node:assert/strict";
import test from "node:test";
import { clinicAppointmentEmail, type AppointmentNotice } from "../src/lib/notify";

const notice: AppointmentNotice = {
  id: "appt-1",
  clinic_id: "clinic-1",
  booking_reference: "SD-123456",
  starts_at: "2026-08-22T04:30:00.000Z",
  status: "pending",
  clinic: { name: "Smile Care Dental", email: "hello@smilecare.demo", timezone: "Asia/Kolkata" },
  patient: { name: "Rahul Kumar", mobile: "9000000000" },
  doctor: { name: "Dr. Ananya Reddy" },
  service: { name: "Dental Consultation" },
};

test("builds a clinic email with the booking reference and patient", () => {
  const email = clinicAppointmentEmail(notice);
  assert.match(email.subject, /SD-123456/);
  assert.match(email.text, /Rahul Kumar/);
  assert.match(email.text, /Dental Consultation/);
  assert.match(email.html, /Dr. Ananya Reddy/);
});
