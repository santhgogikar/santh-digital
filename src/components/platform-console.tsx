"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Group = {
  id: string;
  name: string;
  description: string | null;
  clinics: { id: string; slug: string; short_address: string | null; is_active: boolean }[];
};

export function PlatformConsole({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createClinic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/platform/clinics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        clinicAdminEmail: form.get("clinicAdminEmail"),
        clinicAdminPassword: form.get("clinicAdminPassword"),
        branch: {
          shortAddress: form.get("shortAddress"),
          clinicNumber: form.get("clinicNumber"),
          fullAddress: form.get("fullAddress"),
          mapURL: form.get("mapURL"),
          adminEmail: form.get("branchAdminEmail"),
          adminPassword: form.get("branchAdminPassword"),
        },
      }),
    });
    setPending(false);
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not create clinic.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  async function addBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/platform/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: form.get("groupId"),
        shortAddress: form.get("shortAddress"),
        clinicNumber: form.get("clinicNumber"),
        fullAddress: form.get("fullAddress"),
        mapURL: form.get("mapURL"),
        adminEmail: form.get("adminEmail"),
        adminPassword: form.get("adminPassword"),
      }),
    });
    setPending(false);
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not add branch.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl">Clinics</h1>
        <p className="mt-1 text-sm text-ink-soft">Create a clinic and its first branch. Clinic admins cannot do this.</p>
      </div>

      <div className="grid gap-4">
        {groups.map((group) => (
          <article key={group.id} className="panel p-5">
            <h2 className="text-2xl">{group.name}</h2>
            <p className="mt-1 text-sm text-ink-soft">{group.description}</p>
            <form
              className="mt-3 flex flex-wrap gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                setPending(true);
                setError(null);
                const form = new FormData(event.currentTarget);
                const response = await fetch("/api/platform/clinics", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ groupId: group.id, name: form.get("name") }),
                });
                setPending(false);
                if (!response.ok) {
                  const json = (await response.json()) as { error?: string };
                  setError(json.error ?? "Could not rename.");
                  return;
                }
                router.refresh();
              }}
            >
              <input name="name" defaultValue={group.name} className="min-w-48 flex-1 rounded-xl border border-line px-3 py-2 text-sm" />
              <button type="submit" disabled={pending} className="rounded-xl border border-line px-3 py-2 text-sm">
                Save name
              </button>
            </form>
            <ul className="mt-3 space-y-1 text-sm">
              {group.clinics.map((branch) => (
                <li key={branch.id}>
                  <a className="font-medium text-teal" href={`/c/${branch.slug}`} target="_blank" rel="noreferrer">
                    /c/{branch.slug}
                  </a>
                  <span className="text-ink-soft"> — {branch.short_address}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
        {groups.length === 0 ? <p className="text-sm text-ink-soft">No clinics yet.</p> : null}
      </div>

      <form onSubmit={createClinic} className="panel grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="text-xl sm:col-span-2">New clinic + first branch</h2>
        <label className="text-sm sm:col-span-2">
          Name
          <input name="name" required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="text-sm sm:col-span-2">
          Description
          <textarea name="description" rows={2} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="text-sm">
          Clinic admin email
          <input name="clinicAdminEmail" type="email" required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="text-sm">
          Clinic admin password
          <input name="clinicAdminPassword" type="password" required minLength={8} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="text-sm">
          Short address
          <input name="shortAddress" required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="text-sm">
          Clinic number
          <input name="clinicNumber" required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="text-sm sm:col-span-2">
          Full address
          <textarea name="fullAddress" required rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="text-sm sm:col-span-2">
          Map URL
          <input name="mapURL" required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="text-sm">
          Branch admin email
          <input name="branchAdminEmail" type="email" required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="text-sm">
          Branch admin password
          <input name="branchAdminPassword" type="password" required minLength={8} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <button type="submit" disabled={pending} className="btn-clay sm:col-span-2">
          {pending ? "Creating…" : "Create clinic"}
        </button>
      </form>

      {groups.length > 0 ? (
        <form onSubmit={addBranch} className="panel grid gap-3 p-5 sm:grid-cols-2">
          <h2 className="text-xl sm:col-span-2">Add branch to existing clinic</h2>
          <label className="text-sm sm:col-span-2">
            Clinic
            <select name="groupId" className="mt-1 w-full rounded-xl border border-line px-3 py-2">
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Short address
            <input name="shortAddress" required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="text-sm">
            Clinic number
            <input name="clinicNumber" required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="text-sm sm:col-span-2">
            Full address
            <textarea name="fullAddress" required rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="text-sm sm:col-span-2">
            Map URL
            <input name="mapURL" required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="text-sm">
            Branch admin email
            <input name="adminEmail" type="email" required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="text-sm">
            Branch admin password
            <input name="adminPassword" type="password" required minLength={8} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
          </label>
          <button type="submit" disabled={pending} className="btn-clay sm:col-span-2">
            {pending ? "Adding…" : "Add branch"}
          </button>
        </form>
      ) : null}

      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </div>
  );
}
