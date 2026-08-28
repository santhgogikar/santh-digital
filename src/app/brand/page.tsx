import type { Metadata } from "next";
import Link from "next/link";
import { BrandWordmark, BrandLockup } from "@/components/brand-mark";
import { DEFAULT_THEME } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Design system",
  description: "Santh Digital tokens, logo, and clinic theme overrides.",
};

const colours = [
  { name: "Brand", hex: DEFAULT_THEME.brand, role: "Logo, CTA, links, active nav" },
  { name: "Brand hover", hex: DEFAULT_THEME.brandHover, role: "Primary button hover" },
  { name: "Brand deep", hex: DEFAULT_THEME.brandDeep, role: "Header, footer, mark field" },
  { name: "Paper", hex: DEFAULT_THEME.paper, role: "Page background" },
  { name: "Surface", hex: DEFAULT_THEME.surface, role: "Cards" },
  { name: "Ink", hex: DEFAULT_THEME.ink, role: "Primary text" },
  { name: "Ink soft", hex: DEFAULT_THEME.inkSoft, role: "Secondary text" },
  { name: "Line", hex: DEFAULT_THEME.line, role: "Borders" },
  { name: "OK", hex: DEFAULT_THEME.ok, role: "Success" },
];

export default function BrandPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-teal-deep">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <BrandWordmark className="h-16 w-auto sm:h-20" />
          </Link>
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 pb-24">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold">Design system</p>
        <h1 className="mt-3 max-w-2xl text-5xl leading-[1.05] sm:text-6xl">Santh Digital tokens, by default.</h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          Every clinic site and dashboard inherits this system. If a clinic gives their own hex values, we set{" "}
          <code className="text-ink">brand_primary</code> (and optional deep/paper). CSS variables swap; components stay
          the same.
        </p>

        <section className="mt-16">
          <h2 className="text-3xl">Logo</h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            Favicon is orange S on white. Wordmark is the official lettering — do not fake the barless A in a web font.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <figure className="panel flex flex-col items-center gap-4 p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/favicon.png" alt="Favicon on white" width={120} height={120} className="rounded-xl border border-line" />
              <figcaption className="text-xs text-ink-soft">Favicon · white field · public/brand/favicon.png</figcaption>
            </figure>
            <figure className="flex flex-col items-center justify-center rounded-[1.25rem] bg-teal-deep p-8">
              <BrandWordmark className="h-16 w-auto max-w-full sm:h-20" />
              <figcaption className="mt-4 text-xs text-white/70">Wordmark · public/brand/wordmark.png</figcaption>
            </figure>
            <figure className="panel flex flex-col items-center gap-4 p-8 md:col-span-2">
              <BrandLockup className="h-20 w-auto max-w-full sm:h-24" />
              <figcaption className="text-xs text-ink-soft">Lockup · public/brand/lockup.png</figcaption>
            </figure>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl">Colour tokens</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {colours.map((c) => (
              <article key={c.name} className="overflow-hidden rounded-2xl border border-line">
                <div className="h-20" style={{ background: c.hex }} />
                <div className="bg-white px-3 py-3">
                  <p className="font-semibold">{c.name}</p>
                  <p className="mt-1 font-mono text-xs text-ink-soft">{c.hex}</p>
                  <p className="mt-1 text-xs text-ink-soft">{c.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="panel p-6">
            <h2 className="text-3xl">Type</h2>
            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-gold">Outfit · all UI</p>
            <p className="serif mt-2 text-4xl leading-tight">Turn local searches into confirmed appointments.</p>
            <p className="mt-6 text-base leading-relaxed text-ink-soft">
              Geometric sans to match the wordmark. Logo letterforms stay in the PNG; UI copy uses Outfit.
            </p>
          </div>
          <div className="panel p-6">
            <h2 className="text-3xl">Clinic override</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Default is Santh orange on every business. To theme one clinic:
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-teal-deep p-4 text-xs text-white">
{`UPDATE clinics SET
  brand_primary = '#0B6E4F',
  brand_deep = '#06281D',
  logo_url = 'https://…/logo.png'
WHERE slug = 'their-clinic';`}
            </pre>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="btn-clay">Book an appointment</span>
              <span className="btn-outline">Request a callback</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
