import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasura } from "@/lib/hasura";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function HoursPage() {
  const session = await getSession();
  if (!session?.clinicId) redirect("/login");

  const data = await hasura<{
    working_hours: {
      id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      doctor: { name: string } | null;
    }[];
  }>(
    `query Hours($clinicId: uuid!) {
      working_hours(where: { clinic_id: { _eq: $clinicId } }, order_by: [{ doctor: { name: asc } }, { day_of_week: asc }, { start_time: asc }]) {
        id
        day_of_week
        start_time
        end_time
        doctor { name }
      }
    }`,
    { clinicId: session.clinicId },
  );

  return (
    <div>
      <h1 className="text-4xl">Hours</h1>
      <p className="mt-1 text-sm text-ink-soft">Doctor sessions used to compute live availability. Split shifts are stored as two rows per day.</p>
      <div className="panel mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Doctor</th>
              <th className="px-4 py-3 font-medium">Day</th>
              <th className="px-4 py-3 font-medium">Session</th>
            </tr>
          </thead>
          <tbody>
            {data.working_hours.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{row.doctor?.name ?? "Clinic default"}</td>
                <td className="px-4 py-3">{days[row.day_of_week]}</td>
                <td className="px-4 py-3">
                  {String(row.start_time).slice(0, 5)} – {String(row.end_time).slice(0, 5)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
