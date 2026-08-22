import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getClinicById } from "@/lib/clinic";
import { ServiceForm } from "@/components/clinic-config-forms";

export default async function ServicesAdminPage() {
  const session = await getSession();
  if (!session?.clinicId) redirect("/login");
  const clinic = await getClinicById(session.clinicId);
  if (!clinic) redirect("/login");

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl">Services</h1>
      <p className="mt-1 text-sm text-ink-soft">Duration is used to generate real slots. Add treatments the clinic actually offers.</p>
      <ServiceForm doctors={clinic.doctors} />
      <div className="mt-6 grid gap-3">
        {clinic.services.map((service) => (
          <article key={service.id} className="panel p-5">
            <p className="text-xs text-gold">{service.duration_minutes} minutes</p>
            <h2 className="text-2xl">{service.name}</h2>
            <p className="mt-2 text-sm text-ink-soft">{service.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
