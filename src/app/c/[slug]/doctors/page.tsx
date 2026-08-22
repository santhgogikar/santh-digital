import { notFound } from "next/navigation";
import Link from "next/link";
import { ClinicFooter, ClinicHeader } from "@/components/clinic-chrome";
import { getClinicBySlug } from "@/lib/clinic";

export default async function DoctorsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) notFound();

  return (
    <div>
      <ClinicHeader clinic={clinic} />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-5xl">Doctors</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {clinic.doctors.map((doctor) => (
            <article key={doctor.id} className="panel p-6">
              <h2 className="text-3xl">{doctor.name}</h2>
              <p className="text-sm text-ink-soft">{doctor.qualification}</p>
              <p className="mt-2 text-sm">{doctor.experience_years} years · {doctor.specialisation}</p>
              <p className="mt-4 leading-relaxed text-ink-soft">{doctor.bio}</p>
              <p className="mt-4 text-xs uppercase tracking-wider text-gold">Treats</p>
              <p className="mt-1 text-sm">{doctor.doctor_services.map((ds) => ds.service.name).join(" · ")}</p>
              <Link href={`/c/${clinic.slug}/book`} className="btn-clay mt-6 !py-2 text-sm">
                Book with {doctor.name.split(" ")[1] ?? "this doctor"}
              </Link>
            </article>
          ))}
        </div>
      </main>
      <ClinicFooter clinic={clinic} />
    </div>
  );
}
