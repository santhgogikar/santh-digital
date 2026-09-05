import { getClinicBySlug } from "@/lib/clinic";
import { ThemeScope } from "@/components/theme-scope";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const clinic = await getClinicBySlug(slug);
    if (!clinic) return { title: "Clinic" };
    const area = clinic.short_address ?? clinic.locations[0]?.area ?? "Hyderabad";
    const name = clinic.group?.name ?? clinic.name;
    return {
      title: `${name} | Dentist in ${area}`,
      description: clinic.group?.description ?? clinic.tagline ?? `Book a dental appointment at ${name}.`,
      icons: clinic.logo_url ? { icon: clinic.logo_url } : { icon: "/brand/favicon.png" },
    };
  } catch {
    return { title: "Clinic" };
  }
}

export default async function ClinicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);
  return <ThemeScope theme={clinic}>{children}</ThemeScope>;
}
