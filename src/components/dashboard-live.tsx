"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function DashboardLive({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();
    const interval = window.setInterval(refresh, 8000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return <>{children}</>;
}
