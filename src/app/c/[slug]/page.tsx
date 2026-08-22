import { notFound } from "next/navigation";
import Link from "next/link";
import { CallbackForm } from "@/components/callback-form";
import { ClinicFooter, ClinicHeader } from "@/components/clinic-chrome";
import { getClinicBySlug } from "@/lib/clinic";

export default async function ClinicHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) notFound();
  const loc = clinic.locations[0];

  return (
    <div>
      <ClinicHeader clinic={clinic} />
      <main className="mx-auto max-w-6xl px-5">
        <section className="grid gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            {clinic.google_rating ? (
              <p className="text-sm text-gold">
                {clinic.google_rating} on Google · {clinic.google_review_count} reviews
              </p>
            ) : null}
            <h1 className="mt-3 text-5xl leading-[1.05] sm:text-6xl">{clinic.name}</h1>
            <p className="mt-4 max-w-xl text-lg text-ink-soft">{clinic.tagline}</p>
            <p className="mt-3 text-sm text-ink-soft">
              {loc?.area}, {loc?.city} · {clinic.phone}
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
          <div className="panel p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-gold">Today’s chair hours</p>
            <p className="serif mt-2 text-3xl">10:00 AM – 2:00 PM</p>
            <p className="serif text-3xl">5:00 PM – 8:00 PM</p>
            <p className="mt-3 text-sm text-ink-soft">Monday to Saturday. Sunday closed.</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clinic.services.map((service) => (
            <Link key={service.id} href={`/c/${clinic.slug}/book?service=${service.slug}`} className="panel p-5 hover:border-teal">
              <p className="text-xs text-gold">{service.duration_minutes} minutes</p>
              <h2 className="mt-1 text-2xl">{service.name}</h2>
              <p className="mt-2 text-sm text-ink-soft">{service.description}</p>
            </Link>
          ))}
        </section>

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

        <section className="mt-16 grid gap-6 lg:grid-cols-2" id="callback">
          <div className="panel p-6">
            <h2 className="text-3xl">The clinic</h2>
            <p className="mt-4 leading-relaxed text-ink-soft">{clinic.about}</p>
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
