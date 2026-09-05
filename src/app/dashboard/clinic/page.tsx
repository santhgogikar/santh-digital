import { redirect } from "next/navigation";
import { getSession, isClinicAdmin } from "@/lib/auth";
import { hasura } from "@/lib/hasura";
import { getDashboardScope } from "@/lib/scope";
import { ClinicProfileForm } from "@/components/clinic-profile-form";

export default async function ClinicSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getDashboardScope(session);

  const data = await hasura<{
    clinics: {
      id: string;
      name: string;
      slug: string;
      short_address: string | null;
      phone: string | null;
      full_address: string | null;
      map_url: string | null;
    }[];
  }>(
    `query BranchProfiles($ids: [uuid!]!) {
      clinics(where: { id: { _in: $ids } }, order_by: { short_address: asc }) {
        id name slug short_address phone full_address map_url
      }
    }`,
    { ids: isClinicAdmin(session) ? scope.branches.map((b) => b.id) : scope.clinicIds },
  );

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl">Clinic</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {isClinicAdmin(session)
          ? "Edit description and every branch address. You cannot add a clinic or a branch."
          : "Edit this branch address and map link."}
      </p>
      <div className="mt-6">
        <ClinicProfileForm
          lockedName={scope.groupName}
          canEditDescription={isClinicAdmin(session)}
          description={scope.description ?? ""}
          branches={data.clinics}
        />
      </div>
    </div>
  );
}
