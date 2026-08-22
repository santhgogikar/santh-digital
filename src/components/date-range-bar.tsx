"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { rangePresets } from "@/lib/date-range";

export function DateRangeBar({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const presets = rangePresets();

  function go(nextFrom: string, nextTo: string) {
    router.push(`/dashboard?from=${nextFrom}&to=${nextTo}`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextFrom = String(form.get("from") || from);
    const nextTo = String(form.get("to") || to);
    go(nextFrom, nextTo);
  }

  return (
    <div className="panel mt-5 p-4">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const active = preset.from === from && preset.to === to;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => go(preset.from, preset.to)}
              className={`rounded-full px-3 py-2 text-sm font-medium ${
                active ? "bg-teal text-white" : "bg-paper text-ink"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-sm">
          From
          <input
            name="from"
            type="date"
            defaultValue={from}
            key={`from-${from}`}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
          />
        </label>
        <label className="text-sm">
          To
          <input
            name="to"
            type="date"
            defaultValue={to}
            key={`to-${to}`}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
          />
        </label>
        <button type="submit" className="btn-clay !py-2">
          Apply
        </button>
      </form>
    </div>
  );
}
