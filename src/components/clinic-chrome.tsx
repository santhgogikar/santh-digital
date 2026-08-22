import Link from "next/link";
import type { ClinicRecord } from "@/lib/types";

export function ClinicHeader({ clinic }: { clinic: ClinicRecord }) {
  const base = `/c/${clinic.slug}`;
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href={base} className="min-w-0">
          <p className="truncate font-semibold">{clinic.name}</p>
          <p className="truncate text-xs text-ink-soft">{clinic.locations[0]?.area}, {clinic.locations[0]?.city}</p>
        </Link>
        <nav className="hidden items-center gap-5 text-sm md:flex">
          <Link href={`${base}/services`}>Treatments</Link>
          <Link href={`${base}/doctors`}>Doctors</Link>
          <Link href={`${base}/contact`}>Contact</Link>
        </nav>
        <Link href={`${base}/book`} className="btn-clay !px-4 !py-2 text-sm">
          Book appointment
        </Link>
      </div>
    </header>
  );
}

export function ClinicFooter({ clinic }: { clinic: ClinicRecord }) {
  const loc = clinic.locations[0];
  return (
    <footer className="mt-16 border-t border-line bg-teal-deep text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:justify-between">
        <div>
          <p className="serif text-2xl">{clinic.name}</p>
          <p className="mt-2 max-w-sm text-sm text-white/70">{clinic.tagline}</p>
        </div>
        <div className="text-sm text-white/80">
          <p>{loc?.address_line1}</p>
          <p>{loc?.area}, {loc?.city} {loc?.pincode}</p>
          <p className="mt-2">{clinic.phone}</p>
        </div>
      </div>
    </footer>
  );
}
