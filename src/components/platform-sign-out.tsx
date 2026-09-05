"use client";

import { useRouter } from "next/navigation";

export function PlatformSignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-sm text-ink-soft"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
