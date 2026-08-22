import { formatInTimeZone } from "date-fns-tz";

export const DEFAULT_TZ = "Asia/Kolkata";

export function formatSlotLabel(iso: string, timeZone = DEFAULT_TZ) {
  return formatInTimeZone(iso, timeZone, "h:mm a");
}

export function formatDateLong(iso: string, timeZone = DEFAULT_TZ) {
  return formatInTimeZone(iso, timeZone, "EEE, d MMM yyyy");
}

export function formatDateTime(iso: string, timeZone = DEFAULT_TZ) {
  return formatInTimeZone(iso, timeZone, "d MMM yyyy, h:mm a");
}

export function bookingReference() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `SD-${n}`;
}
