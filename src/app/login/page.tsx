"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandWordmark } from "@/components/brand-mark";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    setPending(false);
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not sign in.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/">
          <BrandWordmark className="h-14 w-auto sm:h-16" />
        </Link>
        <h1 className="mt-4 text-4xl">Clinic login</h1>
        <p className="mt-2 text-sm text-ink-soft">For reception and clinic administrators.</p>
        <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
          <label className="block text-sm">
            Email
            <input
              name="email"
              type="email"
              required
              defaultValue="admin@smilecare.demo"
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-teal"
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              name="password"
              type="password"
              required
              defaultValue="clinic123"
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-teal"
            />
          </label>
          {error ? <p className="text-sm text-clay">{error}</p> : null}
          <button type="submit" disabled={pending} className="btn-clay w-full">
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-xs text-ink-soft">Demo: admin@smilecare.demo / clinic123</p>
      </div>
    </div>
  );
}
