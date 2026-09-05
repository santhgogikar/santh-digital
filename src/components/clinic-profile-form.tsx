"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { BranchSummary } from "@/lib/scope";

export function ClinicProfileForm({
  canEditDescription,
  description,
  branches,
  lockedName,
}: {
  canEditDescription: boolean;
  description: string;
  lockedName: string;
  branches: (BranchSummary & { full_address?: string | null; map_url?: string | null })[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(body: Record<string, unknown>) {
    setPending(true);
    setError(null);
    const response = await fetch("/api/dashboard/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(false);
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not save.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <h2 className="text-xl">Clinic</h2>
        <p className="mt-3 text-sm text-ink-soft">Name</p>
        <p className="font-semibold">{lockedName}</p>
        <p className="mt-1 text-xs text-ink-soft">Only Santh Digital can change the clinic name.</p>
        {canEditDescription ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void save({ description: String(new FormData(event.currentTarget).get("description") ?? "") });
            }}
          >
            <label className="block text-sm">
              Description
              <textarea name="description" defaultValue={description} rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
            </label>
            <button type="submit" disabled={pending} className="btn-clay !py-2">
              Save description
            </button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">{description || "No description."}</p>
        )}
      </section>

      {branches.map((branch) => (
        <form
          key={branch.id}
          className="panel space-y-3 p-5"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void save({
              branchId: branch.id,
              shortAddress: form.get("shortAddress"),
              clinicNumber: form.get("clinicNumber"),
              fullAddress: form.get("fullAddress"),
              mapURL: form.get("mapURL"),
            });
          }}
        >
          <h2 className="text-xl">Branch</h2>
          <p className="text-sm text-ink-soft">{branch.slug}</p>
          <label className="block text-sm">
            Short address
            <input name="shortAddress" defaultValue={branch.short_address ?? ""} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="block text-sm">
            Clinic number
            <input name="clinicNumber" defaultValue={branch.phone ?? ""} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="block text-sm">
            Full address
            <textarea name="fullAddress" defaultValue={branch.full_address ?? ""} rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="block text-sm">
            Map URL
            <input name="mapURL" defaultValue={branch.map_url ?? ""} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
          </label>
          <button type="submit" disabled={pending} className="btn-clay !py-2">
            Save branch
          </button>
        </form>
      ))}
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </div>
  );
}
