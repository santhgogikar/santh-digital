import { notFound } from "next/navigation";
import { ClinicFooter, ClinicHeader } from "@/components/clinic-chrome";
import { BookingWizard } from "@/components/booking-wizard";
import { getClinicBySlug } from "@/lib/clinic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) notFound();
  const initialServiceSlug = (await searchParams).service;

  return (
    <div>
      <ClinicHeader clinic={clinic} />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">No account needed</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">Book an appointment</h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Choose a treatment and a time the clinic can honour. You will get a booking reference on the next screen.
        </p>
        <div className="mt-8">
          <BookingWizard clinic={clinic} initialServiceSlug={initialServiceSlug} />
        </div>
      </main>
      <ClinicFooter clinic={clinic} />
    </div>
  );
}
