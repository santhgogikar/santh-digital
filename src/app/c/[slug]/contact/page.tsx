import { notFound } from "next/navigation";
import { CallbackForm } from "@/components/callback-form";
import { ClinicFooter, ClinicHeader } from "@/components/clinic-chrome";
import { getClinicBySlug } from "@/lib/clinic";

export default async function ContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) notFound();
  const loc = clinic.locations[0];

  return (
    <div>
      <ClinicHeader clinic={clinic} />
      <main className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-2">
        <div>
          <h1 className="text-5xl">Visit us</h1>
          <p className="mt-4 text-lg">
            {loc?.address_line1}
            <br />
            {loc?.area}, {loc?.city} {loc?.pincode}
          </p>
          <p className="mt-4">{clinic.phone}</p>
          <p>{clinic.email}</p>
          {loc?.google_maps_url ? (
            <a href={loc.google_maps_url} className="mt-6 inline-block font-semibold text-teal" target="_blank" rel="noreferrer">
              Open in Google Maps
            </a>
          ) : null}
        </div>
        <div className="panel p-6">
          <CallbackForm slug={clinic.slug} />
        </div>
      </main>
      <ClinicFooter clinic={clinic} />
    </div>
  );
}
