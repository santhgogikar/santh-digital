# Santh Digital

Multi-tenant conversion platform for appointment businesses. The first vertical is dental clinics in Hyderabad.

## What is running in this repo

- Public **Santh Digital** landing (for clinic owners)
- Public **clinic site** for the demo practice (Smile Care Dental, Mehdipatnam)
- **Book appointment** flow with computed availability and double-booking protection
- **Request a callback** lead capture
- **Clinic dashboard** for appointments, leads, doctors, services, and hours

## Prerequisites

- Node 20+
- Docker Desktop

## Start

```bash
docker compose up -d
cp .env.example .env.local   # already present for local dev
npm install
npm run dev
```

Checks:

```bash
npm run verify      # types, lint, slot unit tests
npm run test:e2e    # against a running app on :3000
```

| Surface | URL |
| --- | --- |
| Platform | http://localhost:3000 |
| Brand kit | http://localhost:3000/brand |
| Demo clinic | http://localhost:3000/c/smile-care-mehdipatnam |
| Booking | http://localhost:3000/c/smile-care-mehdipatnam/book |
| Clinic login | http://localhost:3000/login |
| Hasura console | http://localhost:8080 |

Demo clinic login: `admin@smilecare.demo` / `clinic123`

Hasura admin secret: `devadminsecret`

Postgres is published on **5433** (not 5432) so it does not collide with a local Postgres install.

Full technical documentation: **[docs/TECHNICAL.md](./docs/TECHNICAL.md)**. Brand kit: **[docs/BRAND.md](./docs/BRAND.md)**. Product thesis: **[PRODUCT.md](./PRODUCT.md)**.

## Architecture

- **Next.js** owns the public site, booking UI, dashboard, and auth cookies.
- **Hasura** is the GraphQL API over PostgreSQL. The app talks to Hasura from the server with the admin secret. Tenant isolation is applied on every query via `clinic_id`.
- **PostgreSQL** is the system of record. Appointment overlap is blocked with an exclusion constraint so two patients cannot keep the same doctor slot.

Slots are computed from working hours, service duration, holidays, existing appointments, and a booking buffer. They are not stored as rows.

## Notifications

Booking flow:

**Patient → Book → PostgreSQL → Hasura → Appointment created**

Then two paths fire:

1. **Portal** — a real-time alert in the clinic dashboard (`Alerts`)
2. **Email** — Hasura event trigger → Next.js notification service → **Resend** → clinic email

### Resend free tier

1. Create an account at [resend.com](https://resend.com)
2. Add an API key
3. Put it in `.env.local` as `RESEND_API_KEY`
4. Until you verify a domain, Resend only delivers to the email on your Resend account. Set the clinic email to that address, or verify `santh.digital` and set `RESEND_FROM`

Without `RESEND_API_KEY`, the portal alert still appears; the email is skipped and logged.
