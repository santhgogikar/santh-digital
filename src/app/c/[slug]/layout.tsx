import { getClinicBySlug } from "@/lib/clinic";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const clinic = await getClinicBySlug(slug);
    if (!clinic) return { title: "Clinic" };
    const area = clinic.locations[0]?.area ?? "Hyderabad";
    return {
      title: `${clinic.name} | Dentist in ${area}`,
      description: clinic.tagline ?? `Book a dental appointment at ${clinic.name}.`,
    };
  } catch {
    return { title: "Clinic" };
  }
}

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
