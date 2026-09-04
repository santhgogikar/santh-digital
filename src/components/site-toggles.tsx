"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SiteToggle({
  field,
  checked,
  label,
  hint,
}: {
  field: "show_treatments" | "show_doctors" | "show_hours";
  checked: boolean;
  label: string;
  hint?: string;
}) {
  const router = useRouter();
  const [on, setOn] = useState(checked);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = !on;
    setOn(next);
    setPending(true);
    await fetch("/api/dashboard/clinic", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: next }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <label className="panel mt-5 flex items-start gap-3 p-4">
      <input type="checkbox" checked={on} disabled={pending} onChange={() => void toggle()} className="mt-1" />
      <span>
        <span className="font-medium">{label}</span>
        {hint ? <span className="mt-1 block text-sm text-ink-soft">{hint}</span> : null}
      </span>
    </label>
  );
}

export function SlotDurationSelect({ value }: { value: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <label className="panel mt-5 block p-4 text-sm">
      Slot length
      <select
        defaultValue={value}
        disabled={pending}
        className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2"
        onChange={async (event) => {
          setPending(true);
          await fetch("/api/dashboard/clinic", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slot_duration_minutes: Number(event.target.value) }),
          });
          setPending(false);
          router.refresh();
        }}
      >
        <option value={15}>15 minutes</option>
        <option value={30}>30 minutes</option>
      </select>
      <span className="mt-2 block text-ink-soft">Public booking uses this length for every treatment.</span>
    </label>
  );
}
