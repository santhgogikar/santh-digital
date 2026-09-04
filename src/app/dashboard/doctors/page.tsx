import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getClinicById } from "@/lib/clinic";
import { DoctorForm } from "@/components/clinic-config-forms";
import { SiteToggle } from "@/components/site-toggles";

export default async function DoctorsAdminPage() {
  const session = await getSession();
  if (!session?.clinicId) redirect("/login");
  const clinic = await getClinicById(session.clinicId);
  if (!clinic) redirect("/login");

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl">Doctors</h1>
      <p className="mt-1 text-sm text-ink-soft">Doctors can appear on the public site. Booking no longer asks the patient to pick a doctor.</p>
      <SiteToggle field="show_doctors" checked={clinic.show_doctors} label="Show doctors on the website" />
      <DoctorForm services={clinic.services} />
      <div className="mt-6 grid gap-4">
        {clinic.doctors.map((doctor) => (
          <article key={doctor.id} className="panel p-5">
            <h2 className="text-2xl">{doctor.name}</h2>
            <p className="text-sm text-ink-soft">{doctor.qualification}</p>
            <p className="mt-2 text-sm">{doctor.specialisation} · {doctor.experience_years ?? 0} years</p>
            <p className="mt-3 text-sm">
              {doctor.doctor_services.map((ds) => ds.service.name).join(" · ") || "No treatments linked yet"}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
