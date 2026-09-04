/**
 * Hits the running Next.js server. Requires Hasura + `npm start` or `npm run dev`.
 */
const base = process.env.APP_URL ?? "http://localhost:3000";
const slug = "smile-care-mehdipatnam";

async function json(path, init) {
  const response = await fetch(`${base}${path}`, init);
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body, headers: response.headers };
}

function nextWeekdayYmd() {
  const tz = "Asia/Kolkata";
  for (let i = 0; i < 10; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const ymd = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    const weekday = new Date(`${ymd}T12:00:00+05:30`).getDay();
    if (weekday !== 0) return ymd;
  }
  throw new Error("No weekday found");
}

async function html(path) {
  const response = await fetch(`${base}${path}`);
  const text = await response.text();
  return { status: response.status, text };
}

async function main() {
  const home = await html("/");
  if (home.status !== 200 || !home.text.includes("Turn local searches")) {
    throw new Error(`Platform home failed: ${home.status}`);
  }
  if (!home.text.includes("/brand/wordmark.png")) {
    throw new Error("Platform home is missing the wordmark.");
  }

  const brandPage = await html("/brand");
  if (brandPage.status !== 200 || !brandPage.text.includes("Design system") || !brandPage.text.includes("favicon.png")) {
    throw new Error(`Brand page failed: ${brandPage.status}`);
  }

  for (const asset of ["/brand/favicon.png", "/brand/wordmark.png", "/brand/lockup.png", "/brand/mark.png"]) {
    const response = await fetch(`${base}${asset}`);
    if (response.status !== 200) {
      throw new Error(`${asset} returned ${response.status}`);
    }
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("png") && !type.includes("octet-stream")) {
      throw new Error(`${asset} unexpected type ${type}`);
    }
  }

  const clinic = await html(`/c/${slug}`);
  if (clinic.status !== 200 || !clinic.text.includes("Smile Care Dental")) {
    throw new Error(`Clinic home failed: ${clinic.status}`);
  }
  if (clinic.text.includes("on Google") || clinic.text.includes("312 reviews")) {
    throw new Error("Clinic home still shows Google review counts.");
  }
  if (!clinic.text.includes("Visit us") || !clinic.text.includes("Clinic timings")) {
    throw new Error("Clinic home missing Visit us / Clinic timings.");
  }
  if (clinic.text.includes(`/c/${slug}/services`) || clinic.text.includes(`/c/${slug}/doctors`) || clinic.text.includes(`/c/${slug}/contact`)) {
    throw new Error("Clinic home still links to removed tab pages.");
  }

  const bookPage = await html(`/c/${slug}/book`);
  if (bookPage.status !== 200 || !bookPage.text.includes("Book an appointment")) {
    throw new Error(`Book page failed: ${bookPage.status}`);
  }

  const idsRes = await fetch("http://localhost:8080/v1/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": "devadminsecret",
    },
    body: JSON.stringify({
      query: `query {
        clinics(where: { slug: { _eq: "${slug}" } }) {
          services(where: { slug: { _eq: "dental-consultation" } }) { id }
        }
      }`,
    }),
  });
  const ids = await idsRes.json();
  const serviceId = ids.data.clinics[0].services[0].id;
  let date = nextWeekdayYmd();
  let slots = await json(`/api/c/${slug}/slots?serviceId=${serviceId}&date=${date}`);
  for (let i = 1; i < 14 && (!slots.body.slots || slots.body.slots.length === 0); i += 1) {
    const d = new Date(`${date}T12:00:00+05:30`);
    d.setDate(d.getDate() + 1);
    date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    if (new Date(`${date}T12:00:00+05:30`).getDay() === 0) continue;
    slots = await json(`/api/c/${slug}/slots?serviceId=${serviceId}&date=${date}`);
  }
  if (slots.status !== 200 || !Array.isArray(slots.body.slots) || slots.body.slots.length < 1) {
    throw new Error(`Slots failed: ${JSON.stringify(slots.body)}`);
  }

  const slot = slots.body.slots[0];
  const mobile = `9${Math.floor(100000000 + Math.random() * 899999999)}`;
  const booked = await json(`/api/c/${slug}/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId,
      start: slot.start,
      name: "Test Patient",
      mobile,
      notes: "E2E booking",
    }),
  });
  if (booked.status !== 200 || !booked.body.appointment?.booking_reference) {
    throw new Error(`Book failed: ${JSON.stringify(booked.body)}`);
  }
  if (booked.body.appointment.status !== "pending") {
    throw new Error(`Expected pending, got ${booked.body.appointment.status}`);
  }

  const clash = await json(`/api/c/${slug}/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId,
      start: slot.start,
      name: "Second Patient",
      mobile: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
    }),
  });
  if (clash.status !== 409) {
    throw new Error(`Expected 409 on double book, got ${clash.status} ${JSON.stringify(clash.body)}`);
  }

  const lead = await json(`/api/c/${slug}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Callback Tester",
      mobile: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
      requirement: "Tooth pain",
    }),
  });
  if (lead.status !== 200 || !lead.body.ok) {
    throw new Error(`Lead failed: ${JSON.stringify(lead.body)}`);
  }

  const login = await json("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@smilecare.demo", password: "clinic123" }),
  });
  if (login.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(login.body)}`);
  }
  const cookie = login.headers.get("set-cookie");
  if (!cookie) throw new Error("Login did not set a session cookie");

  const overview = await json("/api/dashboard/overview", {
    headers: { cookie },
  });
  if (overview.status !== 200 || typeof overview.body.metrics?.leads !== "number") {
    throw new Error(`Overview failed: ${JSON.stringify(overview.body)}`);
  }
  if (!overview.body.needsConfirmation?.some((row) => row.booking_reference === booked.body.appointment.booking_reference)) {
    throw new Error(`Inbox missed future/pending booking: ${JSON.stringify(overview.body.inbox)}`);
  }

  const ranged = await json(`/api/dashboard/overview?from=${date}&to=${date}`, {
    headers: { cookie },
  });
  if (ranged.status !== 200 || ranged.body.metrics.appointments < 1) {
    throw new Error(`Range overview missed the booking: ${JSON.stringify(ranged.body.metrics)}`);
  }
  if (!ranged.body.appointments.some((row) => row.booking_reference === booked.body.appointment.booking_reference)) {
    throw new Error("Range details did not include the new booking.");
  }

  const appointments = await json("/api/dashboard/appointments", { headers: { cookie } });
  if (appointments.status !== 200 || !Array.isArray(appointments.body) || appointments.body.length < 1) {
    throw new Error("Appointments list failed");
  }

  const notices = await json("/api/dashboard/notifications", { headers: { cookie } });
  if (notices.status !== 200 || !Array.isArray(notices.body.notifications) || notices.body.notifications.length < 1) {
    throw new Error(`Notifications failed: ${JSON.stringify(notices.body)}`);
  }

  const dash = await html("/dashboard");
  if (dash.status !== 307 && dash.status !== 200) {
    // unauthenticated html fetch should redirect to login
  }

  const authedDash = await fetch(`${base}/dashboard?from=${date}&to=${date}`, {
    headers: { cookie },
    redirect: "manual",
  });
  if (authedDash.status !== 200) {
    throw new Error(`Authed dashboard status ${authedDash.status}`);
  }
  const dashHtml = await authedDash.text();
  if (!dashHtml.includes("Needs confirmation") || !dashHtml.includes("Day sheet and report")) {
    throw new Error("Dashboard HTML missing inbox / day sheet");
  }
  if (!dashHtml.includes(booked.body.appointment.booking_reference)) {
    throw new Error("Dashboard HTML missing the new booking reference in the inbox");
  }

  for (const view of ["pending", "today", "upcoming", "past"]) {
    const page = await fetch(`${base}/dashboard/appointments?view=${view}`, {
      headers: { cookie },
      redirect: "manual",
    });
    if (page.status !== 200) {
      throw new Error(`Bookings view=${view} status ${page.status}`);
    }
    const html = await page.text();
    if (view === "pending" && !html.includes(booked.body.appointment.booking_reference)) {
      throw new Error("Bookings pending view missing the new booking reference");
    }
    if (view === "upcoming" && !html.includes(booked.body.appointment.booking_reference)) {
      throw new Error("Bookings upcoming view missing the new booking reference");
    }
  }

  console.log("E2E passed");
  console.log({
    reference: booked.body.appointment.booking_reference,
    slots: slots.body.slots.length,
    date,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
