import { notFound } from "next/navigation";
import Link from "next/link";
import { ClinicFooter, ClinicHeader } from "@/components/clinic-chrome";
import { getClinicBySlug } from "@/lib/clinic";

export default async function ServicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) notFound();

  return (
    <div>
      <ClinicHeader clinic={clinic} />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-5xl">Treatments</h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Each service has a real duration. That duration is what generates bookable slots — a consultation is not the same as a root canal.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {clinic.services.map((service) => (
            <article key={service.id} className="panel p-6">
              <h2 className="text-2xl">{service.name}</h2>
              <p className="mt-2 text-sm text-ink-soft">{service.description}</p>
              <Link href={`/c/${clinic.slug}/book`} className="mt-4 inline-block text-sm font-semibold text-teal">
                Book this →
              </Link>
            </article>
          ))}
        </div>
      </main>
      <ClinicFooter clinic={clinic} />
    </div>
  );
}
