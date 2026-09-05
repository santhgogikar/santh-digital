import { redirect } from "next/navigation";
import { getSession, isSystemAdmin } from "@/lib/auth";
import { hasura } from "@/lib/hasura";
import { PlatformConsole } from "@/components/platform-console";

export default async function PlatformPage() {
  const session = await getSession();
  if (!session || !isSystemAdmin(session)) redirect("/login");

  const data = await hasura<{
    clinic_groups: {
      id: string;
      name: string;
      description: string | null;
      clinics: { id: string; slug: string; short_address: string | null; is_active: boolean }[];
    }[];
  }>(
    `query Groups {
      clinic_groups(order_by: { name: asc }) {
        id name description
        clinics(order_by: { short_address: asc }) { id slug short_address is_active }
      }
    }`,
  );

  return <PlatformConsole groups={data.clinic_groups} />;
}
