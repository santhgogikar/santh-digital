import assert from "node:assert/strict";
import test from "node:test";
import {
  appointmentViewFilters,
  appointmentViewOrder,
  daySheetRows,
  type DashboardAppointment,
} from "../src/lib/dashboard-data";

function row(id: string, status: string): DashboardAppointment {
  return {
    id,
    booking_reference: `SD-${id}`,
    status,
    starts_at: "2026-08-24T04:30:00.000Z",
    doctor: { name: "Dr. A" },
    service: { name: "Consult" },
    patient: { name: "Pat", mobile: "9000000000" },
  };
}

test("day sheet hides pending so the inbox is not duplicated", () => {
  const sheet = daySheetRows([row("1", "pending"), row("2", "confirmed"), row("3", "completed")]);
  assert.deepEqual(
    sheet.map((r) => r.id),
    ["2", "3"],
  );
});

test("bookings views query upcoming pending independently of a report range", () => {
  assert.match(appointmentViewFilters.pending, /clinic_id: \{ _in: \$clinicIds \}/);
  assert.match(appointmentViewFilters.pending, /starts_at: \{ _gte: \$todayStart \}/);
  assert.doesNotMatch(appointmentViewFilters.pending, /tomorrowStart/);
  assert.match(appointmentViewFilters.upcoming, /_in: \[pending, confirmed\]/);
  assert.match(appointmentViewFilters.today, /_lt: \$tomorrowStart/);
  assert.equal(appointmentViewOrder.pending, "{ starts_at: asc }");
  assert.equal(appointmentViewOrder.past, "{ starts_at: desc }");
});
