const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function isYmd(value: string) {
  if (!YMD.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function todayYmd(now = new Date(), timeZone = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDaysYmd(ymd: string, days: number) {
  if (!isYmd(ymd)) throw new Error("Invalid date.");
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDashboardRange(
  fromParam?: string | null,
  toParam?: string | null,
  now = new Date(),
) {
  const today = todayYmd(now);
  let from = fromParam && isYmd(fromParam) ? fromParam : today;
  let to = toParam && isYmd(toParam) ? toParam : today;
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  if (addDaysYmd(from, 90) < to) {
    to = addDaysYmd(from, 90);
  }
  return { from, to };
}

export function rangeBounds(from: string, to: string, offset = "+05:30") {
  const range = parseDashboardRange(from, to);
  return {
    from: range.from,
    to: range.to,
    start: `${range.from}T00:00:00${offset}`,
    endExclusive: `${addDaysYmd(range.to, 1)}T00:00:00${offset}`,
  };
}

export function rangePresets(now = new Date()) {
  const today = todayYmd(now);
  return [
    { id: "today", label: "Today", from: today, to: today },
    { id: "yesterday", label: "Yesterday", from: addDaysYmd(today, -1), to: addDaysYmd(today, -1) },
    { id: "7d", label: "Last 7 days", from: addDaysYmd(today, -6), to: today },
    { id: "30d", label: "Last 30 days", from: addDaysYmd(today, -29), to: today },
  ] as const;
}
