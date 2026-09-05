import { redirect } from "next/navigation";
import { getSession, isClinicAdmin } from "@/lib/auth";
import { getClinicById } from "@/lib/clinic";
import { getDashboardScope } from "@/lib/scope";
import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardLive } from "@/components/dashboard-live";
import { ThemeScope } from "@/components/theme-scope";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "platform_admin") redirect("/platform");

  const scope = await getDashboardScope(session);
  const themeId = scope.activeClinicId ?? scope.clinicIds[0];
  if (!themeId) {
    return (
      <div className="p-10">
        <h1 className="text-3xl">No branches yet</h1>
        <p className="mt-2 text-ink-soft">Ask Santh Digital to add a branch to this clinic.</p>
      </div>
    );
  }
  const clinic = await getClinicById(themeId);
  if (!clinic) redirect("/login");

  return (
    <ThemeScope theme={clinic}>
      <div className="min-h-screen lg:flex">
        <DashboardNav
          clinicName={scope.groupName}
          roleLabel={isClinicAdmin(session) ? "Clinic admin" : "Branch admin"}
          branches={scope.branches}
          activeClinicId={scope.activeClinicId}
          allBranches={scope.allBranches}
          showBranchSwitcher={isClinicAdmin(session)}
        />
        <DashboardLive>
          <div className="flex-1 px-4 py-6 lg:px-10 lg:py-8">{children}</div>
        </DashboardLive>
      </div>
    </ThemeScope>
  );
}
