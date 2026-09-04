import assert from "node:assert/strict";
import test from "node:test";
import { computeSlots, nextBookableDates } from "../src/lib/slots";

const hours = [
  {
    id: "1",
    doctor_id: "doc",
    day_of_week: 5,
    start_time: "10:00:00",
    end_time: "12:00:00",
  },
  {
    id: "2",
    doctor_id: "doc",
    day_of_week: 5,
    start_time: "17:00:00",
    end_time: "20:00:00",
  },
];

test("computes 30-minute slots inside working blocks", () => {
  const slots = computeSlots({
    dateYmd: "2026-08-21",
    timeZone: "Asia/Kolkata",
    durationMinutes: 30,
    bufferMinutes: 0,
    hours,
    busy: [],
    holidays: [],
    now: new Date("2026-08-20T00:00:00.000Z"),
  });
  assert.equal(slots.length, 10);
  assert.equal(slots[0].label.includes("10:00"), true);
});

test("hides slots that overlap an existing appointment", () => {
  const slots = computeSlots({
    dateYmd: "2026-08-21",
    timeZone: "Asia/Kolkata",
    durationMinutes: 30,
    bufferMinutes: 0,
    hours,
    busy: [
      {
        starts_at: "2026-08-21T04:30:00.000Z",
        ends_at: "2026-08-21T05:00:00.000Z",
      },
    ],
    holidays: [],
    now: new Date("2026-08-20T00:00:00.000Z"),
  });
  assert.equal(
    slots.some((s) => s.start === "2026-08-21T04:30:00.000Z"),
    false,
  );
  assert.equal(slots.length, 9);
});

test("returns no slots on a holiday", () => {
  const slots = computeSlots({
    dateYmd: "2026-08-21",
    timeZone: "Asia/Kolkata",
    durationMinutes: 30,
    bufferMinutes: 0,
    hours,
    busy: [],
    holidays: ["2026-08-21"],
    now: new Date("2026-08-20T00:00:00.000Z"),
  });
  assert.equal(slots.length, 0);
});

test("root canal duration does not emit a slot that overruns the block", () => {
  const slots = computeSlots({
    dateYmd: "2026-08-21",
    timeZone: "Asia/Kolkata",
    durationMinutes: 60,
    bufferMinutes: 0,
    hours: [hours[0]],
    busy: [],
    holidays: [],
    now: new Date("2026-08-20T00:00:00.000Z"),
  });
  assert.equal(slots.length, 2);
});

test("15-minute clinic slots fill a two-hour morning block", () => {
  const slots = computeSlots({
    dateYmd: "2026-08-21",
    timeZone: "Asia/Kolkata",
    durationMinutes: 15,
    bufferMinutes: 0,
    hours: [hours[0]],
    busy: [],
    holidays: [],
    now: new Date("2026-08-20T00:00:00.000Z"),
  });
  assert.equal(slots.length, 8);
});

test("next bookable dates skip Sundays", () => {
  const dates = nextBookableDates(7, new Date("2026-08-21T00:00:00+05:30"), "Asia/Kolkata");
  assert.equal(dates.includes("2026-08-23"), false);
  assert.equal(dates.length, 7);
});
