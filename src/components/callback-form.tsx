"use client";

import { FormEvent, useState } from "react";

export function CallbackForm({ slug }: { slug: string }) {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("idle");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/c/${slug}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        mobile: form.get("mobile"),
        requirement: form.get("requirement"),
      }),
    });
    setPending(false);
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setStatus("error");
      setMessage(json.error ?? "Could not submit.");
      return;
    }
    setStatus("ok");
    setMessage("Received. The clinic will call you back.");
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="serif text-2xl">Not sure which treatment you need?</p>
      <p className="text-sm text-ink-soft">Request a callback. No account required.</p>
      <input name="name" required placeholder="Your name" className="w-full rounded-xl border border-line px-3 py-2" />
      <input name="mobile" required placeholder="Mobile number" className="w-full rounded-xl border border-line px-3 py-2" />
      <textarea name="requirement" required placeholder="Tooth pain, cleaning, implant questions…" className="w-full rounded-xl border border-line px-3 py-2" rows={3} />
      <button type="submit" disabled={pending} className="btn-outline w-full">
        {pending ? "Sending…" : "Request a callback"}
      </button>
      {status !== "idle" ? (
        <p className={`text-sm ${status === "ok" ? "text-ok" : "text-clay"}`}>{message}</p>
      ) : null}
    </form>
  );
}
