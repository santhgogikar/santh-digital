import { addMinutes, isBefore } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type { BusyAppointment, WorkingHour } from "./types";

export type Slot = {
  start: string;
  end: string;
  label: string;
};

function parseTimeOnDate(dateYmd: string, time: string, timeZone: string) {
  const t = time.length === 5 ? `${time}:00` : time;
  return fromZonedTime(`${dateYmd}T${t}`, timeZone);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export function computeSlots(args: {
  dateYmd: string;
  timeZone: string;
  durationMinutes: number;
  bufferMinutes: number;
  hours: WorkingHour[];
  busy: BusyAppointment[];
  holidays: string[];
  now?: Date;
}): Slot[] {
  const now = args.now ?? new Date();
  if (args.holidays.includes(args.dateYmd)) return [];

  const weekday = toZonedTime(
    fromZonedTime(`${args.dateYmd}T12:00:00`, args.timeZone),
    args.timeZone,
  ).getDay();

  const blocks = args.hours.filter((h) => h.day_of_week === weekday);
  const busyRanges = args.busy.map((b) => ({
    start: new Date(b.starts_at),
    end: new Date(b.ends_at),
  }));

  const earliest = addMinutes(now, args.bufferMinutes);
  const slots: Slot[] = [];

  for (const block of blocks) {
    let cursor = parseTimeOnDate(args.dateYmd, block.start_time, args.timeZone);
    const blockEnd = parseTimeOnDate(args.dateYmd, block.end_time, args.timeZone);

    while (addMinutes(cursor, args.durationMinutes) <= blockEnd) {
      const end = addMinutes(cursor, args.durationMinutes);
      const free = !busyRanges.some((b) => overlaps(cursor, end, b.start, b.end));
      if (free && !isBefore(cursor, earliest)) {
        slots.push({
          start: cursor.toISOString(),
          end: end.toISOString(),
          label: new Intl.DateTimeFormat("en-IN", {
            timeZone: args.timeZone,
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }).format(cursor),
        });
      }
      cursor = addMinutes(cursor, args.durationMinutes);
    }
  }

  return slots;
}

export function nextBookableDates(count = 14, from = new Date(), timeZone = "Asia/Kolkata") {
  const dates: string[] = [];
  const start = toZonedTime(from, timeZone);
  const first = start.getHours() >= 20 ? 1 : 0;
  for (let i = first; i < count + 8 && dates.length < count; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const ymd = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    const weekday = toZonedTime(fromZonedTime(`${ymd}T12:00:00`, timeZone), timeZone).getDay();
    if (weekday !== 0) dates.push(ymd);
  }
  return dates;
}
