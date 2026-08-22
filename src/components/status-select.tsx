"use client";

import { useRouter } from "next/navigation";

const appointmentStatuses = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;
const leadStatuses = ["new", "contacted", "converted", "lost"] as const;

export function StatusSelect({
  id,
  value,
  kind,
}: {
  id: string;
  value: string;
  kind: "appointment" | "lead";
}) {
  const router = useRouter();
  const options = kind === "appointment" ? appointmentStatuses : leadStatuses;
  const endpoint = kind === "appointment" ? "/api/dashboard/appointments" : "/api/dashboard/leads";

  return (
    <select
      key={`${kind}-${id}-${value}`}
      defaultValue={value}
      className="rounded-full border border-line bg-white px-2 py-1 text-xs"
      onChange={async (event) => {
        await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: event.target.value }),
        });
        router.refresh();
      }}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option.replace("_", "-")}
        </option>
      ))}
    </select>
  );
}
