"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClinicDoctor, ClinicService } from "@/lib/types";

export function DoctorForm({ services }: { services: ClinicService[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const serviceIds = form.getAll("serviceIds").map(String);
    const response = await fetch("/api/dashboard/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        qualification: form.get("qualification"),
        specialisation: form.get("specialisation"),
        experienceYears: Number(form.get("experienceYears") || 0),
        bio: form.get("bio"),
        serviceIds,
      }),
    });
    setPending(false);
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not add doctor.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel mt-6 space-y-3 p-5">
      <h2 className="text-xl">Add a doctor</h2>
      <input name="name" required placeholder="Dr. Name" className="w-full rounded-xl border border-line px-3 py-2" />
      <input name="qualification" placeholder="BDS, MDS" className="w-full rounded-xl border border-line px-3 py-2" />
      <input name="specialisation" placeholder="Specialisation" className="w-full rounded-xl border border-line px-3 py-2" />
      <input name="experienceYears" type="number" min={0} placeholder="Years of experience" className="w-full rounded-xl border border-line px-3 py-2" />
      <textarea name="bio" placeholder="Short bio for the website" rows={3} className="w-full rounded-xl border border-line px-3 py-2" />
      <fieldset>
        <legend className="text-sm font-medium">Treatments they offer</legend>
        <div className="mt-2 grid gap-2">
          {services.map((service) => (
            <label key={service.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="serviceIds" value={service.id} defaultChecked />
              {service.name}
            </label>
          ))}
        </div>
      </fieldset>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-clay">
        {pending ? "Saving…" : "Add doctor"}
      </button>
    </form>
  );
}

export function ServiceForm({ doctors }: { doctors: ClinicDoctor[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const doctorIds = form.getAll("doctorIds").map(String);
    const response = await fetch("/api/dashboard/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        durationMinutes: Number(form.get("durationMinutes")),
        doctorIds,
      }),
    });
    setPending(false);
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not add service.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel mt-6 space-y-3 p-5">
      <h2 className="text-xl">Add a service</h2>
      <input name="name" required placeholder="Service name" className="w-full rounded-xl border border-line px-3 py-2" />
      <textarea name="description" required placeholder="What the patient should know" rows={3} className="w-full rounded-xl border border-line px-3 py-2" />
      <label className="block text-sm">
        Duration (minutes)
        <input name="durationMinutes" type="number" required min={10} step={5} defaultValue={30} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Doctors who provide this</legend>
        <div className="mt-2 grid gap-2">
          {doctors.map((doctor) => (
            <label key={doctor.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="doctorIds" value={doctor.id} defaultChecked />
              {doctor.name}
            </label>
          ))}
        </div>
      </fieldset>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-clay">
        {pending ? "Saving…" : "Add service"}
      </button>
    </form>
  );
}
