import assert from "node:assert/strict";
import test from "node:test";
import { clinicHoursLines, formatClock } from "../src/lib/hours-display";

test("formats wall-clock times for display", () => {
  assert.equal(formatClock("10:00:00"), "10:00 AM");
  assert.equal(formatClock("17:00"), "5:00 PM");
});

test("collapses matching weekday sessions into a clinic timings summary", () => {
  const hours = [1, 2, 3, 4, 5, 6].flatMap((day) => [
    { id: `${day}a`, doctor_id: null, day_of_week: day, start_time: "10:00:00", end_time: "14:00:00" },
    { id: `${day}b`, doctor_id: null, day_of_week: day, start_time: "17:00:00", end_time: "20:00:00" },
  ]);
  const lines = clinicHoursLines(hours);
  assert.equal(lines[0], "Monday to Saturday");
  assert.equal(lines[1], "10:00 AM – 2:00 PM");
  assert.equal(lines[2], "5:00 PM – 8:00 PM");
});
