"use client";

import { useMemo, useState } from "react";
import type { ClinicRecord } from "@/lib/types";
import { formatDateLong, formatSlotLabel } from "@/lib/format";
import { nextBookableDates } from "@/lib/slots";

type Slot = { start: string; end: string; label: string };

export function BookingWizard({ clinic }: { clinic: ClinicRecord }) {
  const [serviceId, setServiceId] = useState(clinic.services[0]?.id ?? "");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(nextBookableDates(14, new Date(), clinic.timezone)[0] ?? "");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    booking_reference: string;
    status: string;
    starts_at: string;
    doctor: string;
    service: string;
  } | null>(null);
  const [pending, setPending] = useState(false);

  const doctors = useMemo(
    () => clinic.doctors.filter((d) => d.doctor_services.some((ds) => ds.service.id === serviceId)),
    [clinic.doctors, serviceId],
  );

  const dates = nextBookableDates(14, new Date(), clinic.timezone);
  const service = clinic.services.find((s) => s.id === serviceId);
  const doctor = clinic.doctors.find((d) => d.id === doctorId);

  async function loadSlots(nextDoctor = doctorId, nextDate = date, nextService = serviceId) {
    if (!nextDoctor || !nextDate || !nextService) return;
    setLoadingSlots(true);
    setError(null);
    setSlot(null);
    const params = new URLSearchParams({ serviceId: nextService, doctorId: nextDoctor, date: nextDate });
    const response = await fetch(`/api/c/${clinic.slug}/slots?${params}`);
    const json = (await response.json()) as { slots?: Slot[]; error?: string };
    setLoadingSlots(false);
    if (!response.ok) {
      setSlots([]);
      setError(json.error ?? "Could not load slots.");
      return;
    }
    setSlots(json.slots ?? []);
  }

  async function confirm(form: FormData) {
    if (!slot) return;
    setPending(true);
    setError(null);
    const response = await fetch(`/api/c/${clinic.slug}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        doctorId,
        start: slot.start,
        name: form.get("name"),
        mobile: form.get("mobile"),
        email: form.get("email") || undefined,
        isExisting: form.get("existing") === "yes",
        notes: form.get("notes") || undefined,
      }),
    });
    const json = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(json.error ?? "Booking failed.");
      await loadSlots();
      return;
    }
    setDone({
      booking_reference: json.appointment.booking_reference,
      status: json.appointment.status,
      starts_at: json.appointment.starts_at,
      doctor: json.doctor.name,
      service: json.service.name,
    });
  }

  if (done) {
    return (
      <div className="panel p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Request received</p>
        <h2 className="mt-2 text-4xl">The clinic will confirm this slot.</h2>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-soft">Reference</dt><dd className="font-semibold">{done.booking_reference}</dd></div>
          <div><dt className="text-ink-soft">When</dt><dd>{formatDateLong(done.starts_at, clinic.timezone)} · {formatSlotLabel(done.starts_at, clinic.timezone)}</dd></div>
          <div><dt className="text-ink-soft">Doctor</dt><dd>{done.doctor}</dd></div>
          <div><dt className="text-ink-soft">Treatment</dt><dd>{done.service}</dd></div>
          <div><dt className="text-ink-soft">Clinic</dt><dd>{clinic.name}</dd></div>
        </dl>
        <p className="mt-6 text-sm text-ink-soft">Reception will call or WhatsApp you to confirm. Please keep this number reachable.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Treatment</span>
          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setDoctorId("");
              setSlots([]);
              setSlot(null);
            }}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
          >
            {clinic.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.duration_minutes} min
              </option>
            ))}
          </select>
        </label>
        <div>
          <p className="text-sm font-medium">Doctor</p>
          <div className="mt-2 grid gap-2">
            {doctors.map((d) => (
              <button
                type="button"
                key={d.id}
                onClick={() => {
                  setDoctorId(d.id);
                  void loadSlots(d.id, date, serviceId);
                }}
                className={`rounded-2xl border px-4 py-3 text-left ${doctorId === d.id ? "border-teal bg-white" : "border-line bg-white/50"}`}
              >
                <p className="font-semibold">{d.name}</p>
                <p className="text-xs text-ink-soft">{d.specialisation}</p>
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Date</span>
          <select
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (doctorId) void loadSlots(doctorId, e.target.value, serviceId);
            }}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="panel p-6">
        {!doctorId ? (
          <p className="text-sm text-ink-soft">Select a doctor to see open slots.</p>
        ) : loadingSlots ? (
          <p className="text-sm text-ink-soft">Checking the chair schedule…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-ink-soft">No open slots on this date. Try another day.</p>
        ) : (
          <>
            <p className="text-sm font-medium">Available times</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.start}
                  onClick={() => setSlot(s)}
                  className={`rounded-full border px-3 py-2 text-sm ${slot?.start === s.start ? "border-clay bg-clay text-white" : "border-line bg-white"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}

        {slot && service && doctor ? (
          <form
            className="mt-6 space-y-3 border-t border-line pt-6"
            onSubmit={(e) => {
              e.preventDefault();
              void confirm(new FormData(e.currentTarget));
            }}
          >
            <p className="text-sm">
              {service.name} with {doctor.name} · {slot.label}
            </p>
            <input name="name" required placeholder="Patient name" className="w-full rounded-xl border border-line px-3 py-2" />
            <input name="mobile" required placeholder="10-digit mobile" className="w-full rounded-xl border border-line px-3 py-2" />
            <input name="email" type="email" placeholder="Email (optional)" className="w-full rounded-xl border border-line px-3 py-2" />
            <select name="existing" className="w-full rounded-xl border border-line px-3 py-2">
              <option value="no">New patient</option>
              <option value="yes">Existing patient</option>
            </select>
            <textarea name="notes" placeholder="Reason for visit (optional)" rows={2} className="w-full rounded-xl border border-line px-3 py-2" />
            {error ? <p className="text-sm text-clay">{error}</p> : null}
            <button type="submit" disabled={pending} className="btn-clay w-full">
              {pending ? "Sending request…" : "Request appointment"}
            </button>
          </form>
        ) : error ? (
          <p className="mt-4 text-sm text-clay">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
