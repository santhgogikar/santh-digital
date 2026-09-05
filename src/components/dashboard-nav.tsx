"use client";

import Link from "next/link";
import { NotificationBell } from "@/components/notification-bell";
import { BrandMark } from "@/components/brand-mark";
import { BranchSwitcher } from "@/components/branch-switcher";
import { usePathname, useRouter } from "next/navigation";
import type { BranchSummary } from "@/lib/scope";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/appointments", label: "Bookings" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/clinic", label: "Clinic" },
  { href: "/dashboard/doctors", label: "Doctors" },
  { href: "/dashboard/services", label: "Services" },
  { href: "/dashboard/hours", label: "Timings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function DashboardNav({
  clinicName,
  roleLabel,
  branches,
  activeClinicId,
  allBranches,
  showBranchSwitcher,
}: {
  clinicName: string;
  roleLabel: string;
  branches: BranchSummary[];
  activeClinicId: string | null;
  allBranches: boolean;
  showBranchSwitcher: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-teal">
              <BrandMark size={18} className="rounded-sm" />
              Santh Digital
            </p>
            <p className="truncate font-semibold">{clinicName}</p>
            <p className="text-[11px] text-ink-soft">{roleLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button type="button" className="text-sm text-ink-soft" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
        {showBranchSwitcher ? (
          <div className="px-2 pb-2">
            <BranchSwitcher branches={branches} activeClinicId={activeClinicId} allBranches={allBranches} />
          </div>
        ) : null}
        <nav className="grid grid-cols-3 gap-2 px-3 pb-3">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-2 py-2.5 text-center text-sm font-medium ${
                  active ? "bg-teal text-white" : "bg-paper text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <aside className="hidden border-r border-line bg-white lg:flex lg:min-h-screen lg:w-60 lg:flex-col">
        <div className="flex items-start justify-between gap-2 px-5 py-5">
          <div>
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-teal">
              <BrandMark size={20} className="rounded-sm" />
              Santh Digital
            </p>
            <p className="mt-1 font-semibold">{clinicName}</p>
            <p className="text-xs text-ink-soft">{roleLabel}</p>
          </div>
          <NotificationBell />
        </div>
        {showBranchSwitcher ? (
          <BranchSwitcher branches={branches} activeClinicId={activeClinicId} allBranches={allBranches} />
        ) : null}
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 text-sm ${active ? "bg-teal text-white" : "text-ink-soft hover:text-ink"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button type="button" className="px-6 py-4 text-left text-sm text-ink-soft" onClick={() => void signOut()}>
          Sign out
        </button>
      </aside>
    </>
  );
}
