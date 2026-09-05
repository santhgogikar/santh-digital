import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getClinicById } from "@/lib/clinic";
import { getDashboardScope } from "@/lib/scope";
import { ServiceForm } from "@/components/clinic-config-forms";
import { SiteToggle } from "@/components/site-toggles";
import { SelectBranchNote } from "@/components/select-branch-note";

export default async function ServicesAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getDashboardScope(session);
  if (!scope.activeClinicId) return <SelectBranchNote />;
  const clinic = await getClinicById(scope.activeClinicId);
  if (!clinic) redirect("/login");

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl">Services</h1>
      <p className="mt-1 text-sm text-ink-soft">Treatments shown on this branch website. Name and a short description only.</p>
      <SiteToggle
        field="show_treatments"
        checked={clinic.show_treatments}
        label="Show treatments on the website"
      />
      <ServiceForm doctors={clinic.doctors} />
      <div className="mt-6 grid gap-3">
        {clinic.services.map((service) => (
          <article key={service.id} className="panel p-5">
            <h2 className="text-2xl">{service.name}</h2>
            <p className="mt-2 text-sm text-ink-soft">{service.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
