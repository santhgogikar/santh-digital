"use client";

import { useRouter } from "next/navigation";
import type { BranchSummary } from "@/lib/scope";

export function BranchSwitcher({
  branches,
  activeClinicId,
  allBranches,
}: {
  branches: BranchSummary[];
  activeClinicId: string | null;
  allBranches: boolean;
}) {
  const router = useRouter();
  if (branches.length <= 1) return null;

  return (
    <label className="mt-3 block px-3 text-xs">
      <span className="text-ink-soft">Branch</span>
      <select
        className="mt-1 w-full rounded-xl border border-line bg-white px-2 py-2 text-sm"
        value={allBranches || !activeClinicId ? "all" : activeClinicId}
        onChange={async (event) => {
          await fetch("/api/dashboard/scope", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clinicId: event.target.value === "all" ? null : event.target.value }),
          });
          router.refresh();
        }}
      >
        <option value="all">All branches</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.short_address || branch.slug}
          </option>
        ))}
      </select>
    </label>
  );
}
