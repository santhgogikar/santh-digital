import { notFound } from "next/navigation";
import Link from "next/link";
import { CallbackForm } from "@/components/callback-form";
import { ClinicFooter, ClinicHeader } from "@/components/clinic-chrome";
import { getClinicBySlug } from "@/lib/clinic";
import { clinicHoursLines } from "@/lib/hours-display";
import { clinicBrandName, clinicDescription, clinicFullAddress, clinicMapUrl, clinicShortAddress } from "@/lib/clinic-display";

export default async function ClinicHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) notFound();
  const hourLines = clinicHoursLines(clinic.working_hours ?? []);
  const mapUrl = clinicMapUrl(clinic);

  return (
    <div>
      <ClinicHeader clinic={clinic} />
      <main className="mx-auto max-w-6xl px-5">
        <section className="grid gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 className="text-5xl leading-[1.05] sm:text-6xl">{clinicBrandName(clinic)}</h1>
            <p className="mt-4 max-w-xl text-lg text-ink-soft">{clinicDescription(clinic)}</p>
            <p className="mt-3 text-sm text-ink-soft">
              {clinicShortAddress(clinic)} · {clinic.phone}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/c/${clinic.slug}/book`} className="btn-clay">
                Book an appointment
              </Link>
              <a href="#callback" className="btn-outline">
                Request a callback
              </a>
            </div>
          </div>
          {clinic.show_hours ? (
            <div className="panel p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-gold">Clinic timings</p>
              <div className="mt-2 space-y-1">
                {hourLines.map((line) => (
                  <p key={line} className="serif text-3xl leading-tight">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {clinic.show_treatments && clinic.services.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clinic.services.map((service) => (
              <Link
                key={service.id}
                href={`/c/${clinic.slug}/book?service=${service.slug}`}
                className="panel p-5 hover:border-teal"
              >
                <h2 className="text-2xl">{service.name}</h2>
                <p className="mt-2 text-sm text-ink-soft">{service.description}</p>
              </Link>
            ))}
          </section>
        ) : null}

        {clinic.show_doctors && clinic.doctors.length > 0 ? (
          <section className="mt-16">
            <h2 className="text-4xl">Doctors</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {clinic.doctors.map((doctor) => (
                <article key={doctor.id} className="panel p-6">
                  <h3 className="text-2xl">{doctor.name}</h3>
                  <p className="text-sm text-ink-soft">{doctor.qualification}</p>
                  <p className="mt-3 text-sm leading-relaxed">{doctor.bio}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-16 grid gap-6 lg:grid-cols-2" id="callback">
          <div className="panel p-6">
            <h2 className="text-3xl">Visit us</h2>
            <div className="mt-4 space-y-1 text-ink-soft">
              <p className="whitespace-pre-line">{clinicFullAddress(clinic)}</p>
              {mapUrl ? (
                <a href={mapUrl} className="mt-4 inline-block font-semibold text-teal" target="_blank" rel="noreferrer">
                  Open in Maps
                </a>
              ) : null}
            </div>
          </div>
          <div className="panel p-6">
            <CallbackForm slug={clinic.slug} />
          </div>
        </section>
      </main>
      <ClinicFooter clinic={clinic} />
    </div>
  );
}
