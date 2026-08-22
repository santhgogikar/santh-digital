import assert from "node:assert/strict";
import test from "node:test";
import { addDaysYmd, isYmd, parseDashboardRange, rangeBounds, todayYmd } from "../src/lib/date-range";

test("accepts valid calendar dates only", () => {
  assert.equal(isYmd("2026-08-21"), true);
  assert.equal(isYmd("2026-02-30"), false);
  assert.equal(isYmd("21-08-2026"), false);
});

test("adds days across month boundaries", () => {
  assert.equal(addDaysYmd("2026-08-31", 1), "2026-09-01");
  assert.equal(addDaysYmd("2026-08-22", -1), "2026-08-21");
});

test("defaults missing params to today in IST", () => {
  const now = new Date("2026-08-21T20:30:00+05:30");
  const range = parseDashboardRange(undefined, undefined, now);
  assert.equal(range.from, "2026-08-21");
  assert.equal(range.to, "2026-08-21");
  assert.equal(todayYmd(now), "2026-08-21");
});

test("swaps inverted ranges and caps at 90 days", () => {
  const swapped = parseDashboardRange("2026-08-30", "2026-08-21");
  assert.equal(swapped.from, "2026-08-21");
  assert.equal(swapped.to, "2026-08-30");
  const capped = parseDashboardRange("2026-01-01", "2026-12-31");
  assert.equal(capped.from, "2026-01-01");
  assert.equal(capped.to, "2026-04-01");
});

test("range bounds are inclusive of the end date in IST", () => {
  const bounds = rangeBounds("2026-08-21", "2026-08-22");
  assert.equal(bounds.start, "2026-08-21T00:00:00+05:30");
  assert.equal(bounds.endExclusive, "2026-08-23T00:00:00+05:30");
});
