import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <p className="text-sm font-semibold tracking-[0.18em] uppercase text-teal">Santh Digital</p>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/c/smile-care-mehdipatnam" className="hidden sm:inline text-ink-soft hover:text-ink">
            Demo clinic
          </Link>
          <Link href="/login" className="text-ink-soft hover:text-ink">
            Clinic login
          </Link>
          <Link href="/c/smile-care-mehdipatnam/book" className="btn-clay !px-4 !py-2 text-sm">
            See booking
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="grid gap-12 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold">Hyderabad · Dental first</p>
            <h1 className="mt-4 max-w-xl text-5xl leading-[1.05] text-ink sm:text-6xl">
              Turn local searches into confirmed appointments.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
              Santh Digital is not a website shop. It is the conversion layer between Google and the dental chair:
              a clinic site, real availability, leads, and a dashboard reception can actually use.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/c/smile-care-mehdipatnam" className="btn-clay">
                Open demo clinic
              </Link>
              <Link href="/login" className="btn-outline">
                Reception login
              </Link>
            </div>
          </div>
          <div className="panel p-6 shadow-[0_20px_60px_rgba(28,42,36,0.08)]">
            <p className="text-xs uppercase tracking-[0.16em] text-gold">Patient journey</p>
            <ol className="mt-4 space-y-3 text-sm">
              {[
                "Google Search / Maps",
                "Clinic website",
                "Treatment → doctor → slot",
                "Patient details",
                "Appointment created",
                "Clinic sees it immediately",
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="serif w-6 text-gold">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-24 grid gap-4 sm:grid-cols-3">
          {[
            { k: "Website", v: "Built to convert, not decorate. Primary CTA is always Book an Appointment." },
            { k: "Booking", v: "Slots are computed from hours, duration, leave and existing appointments — never guessed in the browser." },
            { k: "Dashboard", v: "Today’s appointments, new leads, statuses a receptionist can change without training." },
          ].map((item) => (
            <article key={item.k} className="panel p-6">
              <h2 className="text-2xl">{item.k}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.v}</p>
            </article>
          ))}
        </section>

        <section className="mt-20 panel overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="bg-teal-deep px-8 py-10 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-gold">First market</p>
              <h2 className="mt-3 text-3xl text-white">Independent dental clinics in Hyderabad</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
                Strong local intent, structured slots, multiple services and doctors, and a receptionist who should
                not need a 40-page playbook. Prove it with 3 paying clinics, then expand the vertical.
              </p>
            </div>
            <div className="px-8 py-10">
              <p className="text-sm font-medium">Pilot clinic in this build</p>
              <p className="serif mt-2 text-3xl">Smile Care Dental</p>
              <p className="mt-2 text-ink-soft">Mehdipatnam · 2 doctors · 6 services · instant booking</p>
              <Link href="/c/smile-care-mehdipatnam" className="btn-clay mt-6">
                Visit public site
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
