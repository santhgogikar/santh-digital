import Link from "next/link";
import type { ClinicRecord } from "@/lib/types";
import { clinicBrandName, clinicDescription, clinicShortAddress, clinicFullAddress } from "@/lib/clinic-display";

export function ClinicHeader({ clinic }: { clinic: ClinicRecord }) {
  const base = `/c/${clinic.slug}`;
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href={base} className="flex min-w-0 items-center gap-3">
          {clinic.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={clinic.logo_url} alt="" className="h-9 w-9 rounded-md object-cover" />
          ) : null}
          <span className="min-w-0">
            <p className="truncate font-semibold">{clinicBrandName(clinic)}</p>
            <p className="truncate text-xs text-ink-soft">{clinicShortAddress(clinic)}</p>
          </span>
        </Link>
        <Link href={`${base}/book`} className="btn-clay !px-4 !py-2 text-sm">
          Book appointment
        </Link>
      </div>
    </header>
  );
}

export function ClinicFooter({ clinic }: { clinic: ClinicRecord }) {
  return (
    <footer className="mt-16 border-t border-line bg-teal-deep text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:justify-between">
        <div>
          <p className="serif text-2xl">{clinicBrandName(clinic)}</p>
          <p className="mt-2 max-w-sm text-sm text-white/70">{clinicDescription(clinic)}</p>
        </div>
        <div className="whitespace-pre-line text-sm text-white/80">
          <p>{clinicFullAddress(clinic)}</p>
          <p className="mt-2">{clinic.phone}</p>
        </div>
      </div>
    </footer>
  );
}
