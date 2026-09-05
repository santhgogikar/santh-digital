import { redirect } from "next/navigation";
import { getSession, isSystemAdmin } from "@/lib/auth";
import { BrandMark } from "@/components/brand-mark";
import { PlatformSignOut } from "@/components/platform-sign-out";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSystemAdmin(session)) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 text-sm">
            <BrandMark size={22} className="rounded-sm" />
            <span className="font-semibold">Santh Digital</span>
            <span className="text-ink-soft">System admin</span>
          </div>
          <PlatformSignOut />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
