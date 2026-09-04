import { redirect } from "next/navigation";

export default async function LegacyDoctorsPage({ params }: { params: Promise<{ slug: string }> }) {
  redirect(`/c/${(await params).slug}`);
}
