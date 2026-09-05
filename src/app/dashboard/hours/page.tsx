import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasura } from "@/lib/hasura";
import { getClinicById } from "@/lib/clinic";
import { getDashboardScope } from "@/lib/scope";
import { HoursEditor } from "@/components/hours-editor";
import { SiteToggle, SlotDurationSelect } from "@/components/site-toggles";
import { SelectBranchNote } from "@/components/select-branch-note";

export default async function HoursPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getDashboardScope(session);
  if (!scope.activeClinicId) return <SelectBranchNote />;
  const clinic = await getClinicById(scope.activeClinicId);
  if (!clinic) redirect("/login");

  const data = await hasura<{
    working_hours: {
      id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
    }[];
  }>(
    `query Hours($clinicId: uuid!) {
      working_hours(
        where: { clinic_id: { _eq: $clinicId }, doctor_id: { _is_null: true } }
        order_by: [{ day_of_week: asc }, { start_time: asc }]
      ) {
        id
        day_of_week
        start_time
        end_time
      }
    }`,
    { clinicId: scope.activeClinicId },
  );

  return (
    <div>
      <h1 className="text-4xl">Clinic timings</h1>
      <p className="mt-1 text-sm text-ink-soft">
        These sessions appear on this branch website (if enabled) and generate booking slots.
      </p>
      <SiteToggle
        field="show_hours"
        checked={clinic.show_hours}
        label="Show clinic timings on the website"
        hint="Hides the timings panel on the public clinic page."
      />
      <SlotDurationSelect value={clinic.slot_duration_minutes || 30} />
      <HoursEditor hours={data.working_hours} />
    </div>
  );
}
