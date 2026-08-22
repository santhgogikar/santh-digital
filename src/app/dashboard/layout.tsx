import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getClinicById } from "@/lib/clinic";
import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardLive } from "@/components/dashboard-live";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.clinicId) {
    return (
      <div className="p-10">
        <h1 className="text-3xl">Platform admin</h1>
        <p className="mt-2 text-ink-soft">
          Clinic-scoped dashboard is the MVP. Sign in as admin@smilecare.demo to operate a clinic.
        </p>
      </div>
    );
  }
  const clinic = await getClinicById(session.clinicId);
  if (!clinic) redirect("/login");

  return (
    <div className="min-h-screen lg:flex">
      <DashboardNav clinicName={clinic.name} />
      <DashboardLive>
        <div className="flex-1 px-4 py-6 lg:px-10 lg:py-8">{children}</div>
      </DashboardLive>
    </div>
  );
}
