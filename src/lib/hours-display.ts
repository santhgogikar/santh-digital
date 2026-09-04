import type { WorkingHour } from "./types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatClock(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function clinicLevelHours(hours: WorkingHour[]) {
  const clinicHours = hours.filter((row) => !row.doctor_id);
  return clinicHours.length ? clinicHours : hours;
}

export function clinicHoursLines(hours: WorkingHour[]) {
  const rows = clinicLevelHours(hours);
  if (!rows.length) return ["Timings not set yet."];

  const byDay = new Map<number, string[]>();
  for (const row of rows) {
    const label = `${formatClock(row.start_time)} – ${formatClock(row.end_time)}`;
    const current = byDay.get(row.day_of_week) ?? [];
    current.push(label);
    byDay.set(row.day_of_week, current);
  }

  const uniqueSessions = new Set(
    [...byDay.entries()].map(([, sessions]) => sessions.join(",")),
  );

  if (uniqueSessions.size === 1 && byDay.size >= 5) {
    const sessions = [...uniqueSessions][0].split(",");
    const days = [...byDay.keys()].sort((a, b) => a - b);
    const span =
      days[0] === 1 && days[days.length - 1] === 6 && days.length === 6
        ? "Monday to Saturday"
        : days.map((d) => DAYS[d]).join(", ");
    return [span, ...sessions];
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, sessions]) => `${DAYS[day]} · ${sessions.join(", ")}`);
}
