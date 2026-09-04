"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { formatClock } from "@/lib/hours-display";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type HourRow = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export function HoursEditor({ hours }: { hours: HourRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/dashboard/hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayOfWeek: Number(form.get("dayOfWeek")),
        startTime: form.get("startTime"),
        endTime: form.get("endTime"),
      }),
    });
    setPending(false);
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not add session.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  async function remove(id: string) {
    await fetch("/api/dashboard/hours", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Day</th>
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {hours.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{days[row.day_of_week]}</td>
                <td className="px-4 py-3">
                  {formatClock(row.start_time)} – {formatClock(row.end_time)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="text-sm text-clay" onClick={() => void remove(row.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {hours.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-ink-soft" colSpan={3}>
                  No clinic timings yet. Add a session below.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <form onSubmit={add} className="panel grid gap-3 p-5 sm:grid-cols-4 sm:items-end">
        <label className="text-sm">
          Day
          <select name="dayOfWeek" className="mt-1 w-full rounded-xl border border-line px-3 py-2" defaultValue={1}>
            {days.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Start
          <input name="startTime" type="time" required defaultValue="10:00" className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="text-sm">
          End
          <input name="endTime" type="time" required defaultValue="14:00" className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <button type="submit" disabled={pending} className="btn-clay !py-2">
          {pending ? "Adding…" : "Add session"}
        </button>
        {error ? <p className="text-sm text-clay sm:col-span-4">{error}</p> : null}
      </form>
    </div>
  );
}
