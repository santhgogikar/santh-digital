"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Notice = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<Notice[]>([]);
  const [toast, setToast] = useState<Notice | null>(null);
  const seen = useRef(new Set<string>());
  const primed = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function pull() {
      const response = await fetch("/api/dashboard/notifications");
      if (!response.ok) return;
      const json = (await response.json()) as { notifications: Notice[] };
      if (cancelled) return;
      const next = json.notifications ?? [];
      if (primed.current) {
        const fresh = next.find((item) => !seen.current.has(item.id));
        if (fresh) {
          setToast(fresh);
          window.setTimeout(() => setToast((current) => (current?.id === fresh.id ? null : current)), 8000);
          router.refresh();
        }
      }
      primed.current = true;
      seen.current = new Set(next.map((item) => item.id));
      setItems(next);
    }

    void pull();
    const interval = window.setInterval(() => void pull(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [router]);

  async function markAllRead() {
    await fetch("/api/dashboard/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setItems([]);
    setToast(null);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void markAllRead()}
        className="relative rounded-full px-3 py-1.5 text-sm"
        aria-label="Notifications"
      >
        Alerts
        {items.length > 0 ? (
          <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-clay px-1.5 text-[11px] font-semibold text-white">
            {items.length}
          </span>
        ) : null}
      </button>
      {toast ? (
        <div className="fixed bottom-4 left-4 right-4 z-50 panel p-4 shadow-lg sm:left-auto sm:right-6 sm:w-96">
          <p className="text-xs uppercase tracking-wider text-gold">New booking</p>
          <p className="mt-1 font-semibold">{toast.title}</p>
          <p className="mt-1 text-sm text-ink-soft">{toast.body}</p>
        </div>
      ) : null}
    </>
  );
}
