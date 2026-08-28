# Santh Digital — Technical Documentation

**Product:** Multi-tenant conversion platform for appointment businesses  
**First vertical:** Independent dental clinics in Hyderabad  
**Document status:** Describes the system as implemented in this repository (MVP)  
**Related:** [PRODUCT.md](../PRODUCT.md) (thesis and scope), [README.md](../README.md) (local run)

---

## 1. Purpose

Santh Digital is the conversion layer between local search (Google / Maps) and a confirmed chair-time:

1. A public **clinic website** that answers “who, where, what treatments, which doctors”.
2. A **booking flow** that only offers slots the clinic can honour.
3. A **callback lead** path for patients who are not ready to pick a slot.
4. A **clinic dashboard** so reception can see, call, WhatsApp, and change status immediately.

The north-star metric for a clinic is: *how much business did this digital system generate?*

Explicitly **out of this MVP:** native mobile apps, EMR/charting, payments, WhatsApp/SMS sending as a product, a website builder, and a multi-clinic marketplace.

---

## 2. System architecture

### 2.1 High-level

```
                    ┌─────────────────────────────────────┐
                    │           Next.js 15 (App Router)     │
  Patients          │  Public clinic site  /c/[slug]        │
  (no login)  ────► │  Booking wizard + callback forms      │
                    │  Route Handlers (public + dashboard)  │
  Clinic staff      │  Dashboard RSC + client islands       │
  (cookie JWT) ───► │  Middleware gate: /dashboard/*        │
                    └──────────────┬──────────────────────┘
                                   │ GraphQL + admin secret
                                   │ (server only)
                    ┌──────────────▼──────────────────────┐
                    │  Hasura GraphQL Engine v2.46        │
                    │  Event trigger: appointment INSERT  │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  PostgreSQL 16                      │
                    │  Source of truth + overlap lock     │
                    └─────────────────────────────────────┘
                                   │
                    Hasura webhook (optional email)
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  Next.js  /api/webhooks/hasura/...  │
                    │  notifyAppointmentCreated()         │
                    │  Portal row + Resend email          │
                    └─────────────────────────────────────┘
```

### 2.2 Responsibilities

| Layer | Owns | Does not own |
| --- | --- | --- |
| **Next.js** | Pages, UX, session cookies, input validation (Zod), slot *computation*, tenant `clinic_id` on every write, notification orchestration | Durable business data |
| **Hasura** | GraphQL over Postgres, relationships, event trigger on appointment insert | Application auth (the app does not send Hasura JWT claims today) |
| **PostgreSQL** | Schema, uniqueness, exclusion constraint (no overlapping doctor appointments) | UI state |

The browser **never** talks to Hasura. All GraphQL runs in Next.js server code via `src/lib/hasura.ts` with `x-hasura-admin-secret` and `cache: "no-store"`.

### 2.3 Runtime topology (local)

| Service | Host port | Role |
| --- | --- | --- |
| Next.js | `3000` | App |
| Hasura | `8080` | GraphQL + console + events |
| Postgres | `5433` → container `5432` | Database (host 5433 avoids colliding with a local Postgres) |

Compose file: `docker-compose.yml`. Hasura image is `hasura/graphql-engine:v2.46.0.cli-migrations-v3` and applies `hasura/migrations` + `hasura/metadata` on start.

Hasura reaches the Next.js webhook at `http://host.docker.internal:3000/api/webhooks/hasura/appointment-created`.

### 2.4 Multi-tenancy model

Tenancy is **row-level by `clinic_id`**, not separate databases.

- Public URLs are `/c/{slug}/…`. The slug maps to one `clinics` row (`getClinicBySlug`).
- Staff sessions carry `clinicId` in the JWT. Dashboard queries always `where: { clinic_id: { _eq: $clinicId } }`.
- Patients are unique per clinic: `UNIQUE (clinic_id, mobile)`.
- Platform admins have `clinic_id IS NULL`. The clinic dashboard is **not** a multi-tenant operator console in this MVP; signing in as platform admin shows a placeholder asking to use a clinic account.

Isolation is **enforced in application queries**, not Hasura permission rules. Hasura tables are tracked with relationships and the appointment event trigger; they are not configured with per-role row permissions. Losing the admin secret would expose the whole graph. Treat `HASURA_ADMIN_SECRET` as production-critical.

---

## 3. Authentication

### 3.1 Pattern

**Password login + signed session cookie (BFF-style).** There is no OAuth, no NextAuth, and no patient accounts.

| Piece | Implementation |
| --- | --- |
| Identity store | `users` table (email unique, `password_hash` bcrypt via Postgres `crypt` on seed / bcryptjs on login) |
| Credential check | `POST /api/auth/login` → `findUserByEmail` → `bcryptjs.compare` |
| Token | JWT (`jose`), HS256, 7-day expiry |
| Transport | HttpOnly cookie `sd_session`, `SameSite=Lax`, `Secure` in production, `path=/` |
| Secret | `AUTH_SECRET` (app). Separate from Hasura’s `HASURA_GRAPHQL_JWT_SECRET` (unused by the Next.js session today) |

Login payload claims: `sub` (user id), `email`, `name`, `role`, `clinicId`.

Inactive users (`is_active = false`) cannot sign in. Failed login always returns the same 401 copy: “Invalid email or password.”

Logout: `POST /api/auth/logout` clears the cookie (`maxAge: 0`).

### 3.2 Session helpers (`src/lib/auth.ts`)

- `getSession()` — read cookie, verify JWT, or `null`.
- `requireClinicSession()` — throws `UNAUTHENTICATED` if missing session; allows `platform_admin` without `clinicId`; other roles must have `clinicId`.
- Dashboard **layout** additionally requires `clinicId` to render clinic UI; platform admin without a clinic is not given staff tools.

### 3.3 Demo credentials (seed)

| Email | Role | Password |
| --- | --- | --- |
| `admin@smilecare.demo` | `clinic_admin` | `clinic123` |
| `santh@santh.digital` | `platform_admin` | `clinic123` |

Demo clinic: **Smile Care Dental**, slug `smile-care-mehdipatnam`.

**Production:** rotate all secrets, do not ship demo passwords, and do not pre-fill login fields.

---

## 4. Authorization

### 4.1 Roles (database enum `user_role`)

| Role | `clinic_id` | Intended meaning |
| --- | --- | --- |
| `platform_admin` | must be `NULL` | Operator of Santh Digital |
| `clinic_admin` | required | Clinic owner / manager |
| `receptionist` | required | Front desk |
| `doctor` | required | Clinical staff (schema-ready) |

Constraint: `users_clinic_required` enforces the nullability rules above.

### 4.2 What is actually enforced today

| Surface | Gate |
| --- | --- |
| `/dashboard/*` pages | Middleware verifies JWT exists and is valid; unauthenticated → `/login`. Layout loads clinic from `session.clinicId`. |
| `/api/dashboard/*` | `requireClinicSession()` + **`403` if `clinicId` is missing** (platform admin cannot use clinic APIs). Mutations include `clinic_id` in the `where` clause so one clinic cannot update another clinic’s rows even if they guess UUIDs. |
| `/api/c/[slug]/*` | **Public.** Bound to the clinic resolved from slug. No patient login. |
| `/api/webhooks/hasura/appointment-created` | Shared secret header `x-hasura-event-secret` must equal `HASURA_EVENT_SECRET`. |
| `/api/auth/*` | Public login; logout is idempotent. |

**Not yet implemented:** distinct permissions among `clinic_admin`, `receptionist`, and `doctor`. Any clinic-scoped session can list/update appointments and leads, and create doctors/services. Role is stored and signed into the JWT for future use.

**Not yet implemented:** Hasura row-level security / `x-hasura-clinic-id` claims. Authorization is entirely in Next.js.

### 4.3 Public vs staff data

Patients do not see other patients. Public APIs only expose:

- Clinic marketing data (name, doctors, services, hours-driven slots).
- Ability to **create** a patient + appointment or a lead for that slug.

They cannot list appointments or notifications.

---

## 5. Design patterns

### 5.1 Application patterns

| Pattern | Where | Why |
| --- | --- | --- |
| **BFF (Backend for Frontend)** | Next.js Route Handlers | Browser never holds GraphQL credentials; one place for validation and tenancy. |
| **Server Components + client islands** | Dashboard pages (RSC), forms/wizards (`"use client"`) | Data fetched on the server; interactivity isolated. |
| **Repository / data access module** | `src/lib/clinic.ts`, `dashboard-data.ts`, `notify.ts` | GraphQL strings live next to typed helpers, not in UI files. |
| **Computed availability (not stored slots)** | `src/lib/slots.ts` | Hours + duration + holidays + busy intervals generate slots at request time. |
| **Optimistic conflict at two layers** | Slot recompute on book + Postgres `EXCLUDE` | UI 409 if the slot vanished; DB still wins on races. |
| **Idempotent notifications** | `clinic_notifications.UNIQUE(appointment_id)` | Book path and Hasura webhook can both call `notifyAppointmentCreated` without duplicate portal rows. |
| **Tenant slug routing** | `/c/[slug]` | One Next.js app, many clinic sites. |
| **Soft operational states** | Appointment and lead enums | Reception workflow without deleting history. Cancelled / no-show appointments drop out of the overlap constraint. |

### 5.2 Slot engine (`computeSlots`)

Inputs:

- Clinic timezone (`Asia/Kolkata` for the demo).
- Service `duration_minutes`.
- Clinic `booking_buffer_minutes` (demo: 30) — no slot starting before `now + buffer`.
- Working hours for that doctor (or clinic-wide hours if the doctor has none).
- Holidays for clinic or that doctor on that date.
- Existing appointments for the doctor that day, excluding `cancelled` and `no_show`.

Behaviour:

- Walk each working-hour block in `duration` steps (no overlapping slot starts).
- Skip Sundays in `nextBookableDates` (date picker offers ~14 weekdays; if local time is 20:00 or later, the first offered day is tomorrow).
- Labels are `en-IN` 12-hour times in the clinic timezone; stored times are ISO UTC.

`GET /api/c/[slug]/slots` and `POST /api/c/[slug]/book` use the **same** function so a book request cannot accept a time the slot API would not show (except for a race, which the exclusion constraint then rejects).

### 5.3 Booking write path

1. Validate body (Zod): Indian mobile `/^[6-9]\d{9}$/`, name length, UUIDs.
2. Resolve clinic, service, doctor, primary location; doctor must offer the service.
3. Recompute slots for that local calendar day; require an exact match on `start` ISO.
4. Upsert patient on `(clinic_id, mobile)` — update name/email on conflict.
5. Insert appointment: `status = pending`, `source = online`, unique `booking_reference` (`SD-` + 6 digits).
6. Best-effort `notifyAppointmentCreated` (errors logged, booking still succeeds).
7. On exclusion violation → HTTP **409**.

**Schema vs product:** `clinics.booking_mode` is `instant | request`. Seed clinic is `request`. The book API **always** inserts `pending` (request-style). Instant auto-confirm is not wired yet.

### 5.4 Dashboard freshness

- Pages: `dynamic = "force-dynamic"`, `revalidate = 0`.
- `DashboardLive` refreshes RSC payload every 8s and on window focus / tab visible.
- `NotificationBell` polls `/api/dashboard/notifications` every 2.5s; new unread ids show a toast.
- Mutations call `revalidatePath` for dashboard routes.

This is **polling**, not Hasura subscriptions, in the MVP.

---

## 6. Data model

Migrations: `hasura/migrations/default/`.

### 6.1 Entity map

```
clinics 1──* locations
        1──* users          (except platform_admin)
        1──* doctors
        1──* services
        1──* working_hours  (optional doctor_id / location_id)
        1──* holidays
        1──* patients
        1──* leads
        1──* appointments
        1──* clinic_notifications

doctors *──* services          via doctor_services
appointments → location, doctor, service, patient
clinic_notifications → appointment (1:1 unique)
```

### 6.2 Core tables

**clinics** — `slug` unique, timezone, `booking_mode`, `booking_buffer_minutes`, Google rating fields, `is_active`.

**locations** — address for Hyderabad-first defaults (`city` Hyderabad, `state` Telangana). One primary location used for online bookings.

**users** — credentials and role.

**doctors / services** — public profile fields; `slug` unique per clinic; `is_active` filters public site.

**working_hours** — `day_of_week` 0=Sunday … 6=Saturday; split shifts are **two rows** (demo: 10:00–14:00 and 17:00–20:00, Mon–Sat). New doctors created in the dashboard get that default pattern automatically.

**holidays** — date-level closures, clinic-wide or per doctor.

**patients** — identity for bookings.

**leads** — callback requests; `source` default `website`; statuses `new | contacted | converted | lost`.

**appointments** — `starts_at`/`ends_at` timestamptz; statuses `pending | confirmed | completed | cancelled | no_show`; `source` `online | dashboard`; unique `booking_reference`.

**Overlap protection:**

```sql
EXCLUDE USING gist (
  doctor_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
)
WHERE (status NOT IN ('cancelled', 'no_show'));
```

Requires `btree_gist`. Half-open range: a 10:00–10:30 and 10:30–11:00 booking can both exist.

**clinic_notifications** — portal alert + `email_status` (`pending | sent | skipped | failed`); `read_at` for unread badge.

`updated_at` triggers exist on the main mutable tables.

### 6.3 Seed content (Smile Care)

- Two doctors (conservative vs surgical).
- Six treatments with durations 30–60 minutes.
- Doctor–service mapping (not every doctor does every treatment).
- Working hours as above.

---

## 7. API reference

Base URL: `NEXT_PUBLIC_APP_URL` (local `http://localhost:3000`).

### 7.1 Auth

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | JSON `{ email, password }` → `{ ok, role }` + cookie |
| POST | `/api/auth/logout` | Cookie optional | Clears `sd_session` |

### 7.2 Public clinic

| Method | Path | Body / query | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/c/:slug/slots` | `serviceId`, `doctorId`, `date` (YYYY-MM-DD) | `{ slots, durationMinutes }` | 404 clinic, 400 missing/invalid pairing |
| POST | `/api/c/:slug/book` | See below | Appointment + clinic/doctor/service/location snapshot | 400 validation, 409 slot gone, 500 |
| POST | `/api/c/:slug/leads` | `{ name, mobile, requirement }` | `{ ok, id }` | 400, 404 |

Book body:

```json
{
  "serviceId": "uuid",
  "doctorId": "uuid",
  "start": "ISO-8601",
  "name": "string",
  "mobile": "9XXXXXXXXX",
  "email": "optional",
  "isExisting": false,
  "notes": "optional"
}
```

### 7.3 Dashboard (clinic session required)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/dashboard/overview?from=&to=` | Range metrics + day-sheet rows, plus `needsConfirmation` / `overduePending` inbox (independent of range) |
| GET | `/api/dashboard/appointments` | Latest 80 appointments |
| PATCH | `/api/dashboard/appointments` | `{ id, status }` allowed enum |
| GET | `/api/dashboard/leads` | Latest 80 leads |
| PATCH | `/api/dashboard/leads` | `{ id, status }` |
| POST | `/api/dashboard/doctors` | Create doctor, optional service links, default hours |
| POST | `/api/dashboard/services` | Create service, optional doctor links |
| GET | `/api/dashboard/notifications` | Unread portal notices (20) |
| PATCH | `/api/dashboard/notifications` | `{ id }` or `{ all: true }` mark read |

Unauthenticated dashboard APIs: `401` where caught (`overview`); others may throw `UNAUTHENTICATED` as 500 unless wrapped — overview is the explicit pattern.

### 7.4 Webhooks

`POST /api/webhooks/hasura/appointment-created`

- Header: `x-hasura-event-secret`
- Body: Hasura event payload; reads `event.data.new.id`
- Hasura metadata: trigger `appointment_created` on INSERT, 3 retries / 10s, timeout 60s

---

## 8. Notifications

### 8.1 Dual path

On appointment insert:

1. **Synchronous** from the book handler (`notifyAppointmentCreated`).
2. **Asynchronous** Hasura event trigger → same function (idempotent).

### 8.2 Portal

Insert `clinic_notifications` with title/body derived from patient, service, and formatted time. Bell polls unread rows. Clicking **Alerts** marks all read.

### 8.3 Email (Resend)

If `RESEND_API_KEY` is set and the clinic has an email, send HTML/text. `RESEND_FROM` preferred; unverified domain falls back to Resend onboarding sender. Without API key, email is skipped and logged; portal still works.

Free-tier Resend only delivers to the account owner until a domain is verified.

---

## 9. UX reference (design system)

### 9.1 Visual language

Defined in `src/app/globals.css` and `src/app/layout.tsx`.

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#f3efe6` | Page background |
| Ink | `#1c2a24` | Primary text |
| Ink soft | `#3d4f47` | Secondary text |
| Line | `#d7cfc0` | Borders |
| Teal / teal-deep | `#0f5f56` / `#0a3f3a` | Nav active, footer, Call buttons |
| Clay | `#c24d2c` | Primary CTA (`btn-clay`), alerts badge |
| Gold | `#b0894b` | Eyebrow labels, ratings |
| White | `#fffcf7` | Panels |
| OK | `#1f7a4d` | Success messages |

**Type:** Outfit for all UI. Logo letterforms live in `public/brand/*.png`. Default brand orange `#FF4F00` on black; clinics may override via `brand_primary`.

**Components:** rounded-full CTAs, `panel` cards (`1.25rem` radius, paper-white fill). Clinic chrome: sticky header with backdrop blur; deep-teal footer with address.

### 9.2 Information architecture

**Three surfaces:**

1. **Platform marketing** — `/`  
   Audience: clinic owners evaluating Santh Digital. CTA: demo clinic + reception login.

2. **Clinic site** — `/c/{slug}`  
   Audience: patients. Primary CTA always **Book appointment**. Secondary: treatments, doctors, contact, callback.

3. **Clinic ops** — `/login` → `/dashboard`  
   Audience: reception / clinic admin. Density over decoration; phone and WhatsApp as first actions.

### 9.3 Clinic site map

| Route | Intent |
| --- | --- |
| `/c/[slug]` | Trust (rating, area, hours), treatments grid, doctors, about + callback |
| `/c/[slug]/services` | Treatment list |
| `/c/[slug]/doctors` | Doctor list |
| `/c/[slug]/contact` | Location / phone |
| `/c/[slug]/book` | Conversion wizard (no account) |
| `/c/[slug]` 404 | Unknown slug |

SEO: clinic layout `generateMetadata` sets `{Clinic} \| Dentist in {area}`.

Hours on the home “Today’s chair hours” panel are currently **copy** matching the seed (10–2 / 5–8), not a live query of `working_hours`. Live availability is only on the book wizard.

### 9.4 Booking wizard UX

Linear, single page:

1. **Treatment** — all active services.  
2. **Doctor** — filtered to those offering the treatment.  
3. **Date** — weekday chips from `nextBookableDates`.  
4. **Time** — fetched slots; empty state if holiday / fully booked / too soon.  
5. **Patient** — name, mobile, optional email, existing-patient flag, notes.  
6. **Confirmation** — reference, when, doctor, treatment; copy that reception will call/WhatsApp. Status language: **request received**, not “you are confirmed”, matching `pending`.

On 409, error copy + slot list reload.

### 9.5 Dashboard UX

**Nav:** Dashboard, Bookings, Leads, Doctors, Services, Hours. Mobile: sticky top bar + 3-column chip grid. Desktop: left rail. Alerts + Sign out always available.

**Home (inbox vs day sheet):**

1. **Needs confirmation** — all `pending` visits from the start of today onward, soonest first. Not filtered by the date bar.
2. **Past slots still pending** — `pending` with `starts_at` before today (still occupy the diary until cancelled / no-show).
3. **Day sheet and report** — date range (Today, Next 7 / 14, Yesterday, Last 7 / 30, custom, cap 90 days). Metrics and leads use this range. The visit list **excludes pending** so those cards are not duplicated from the inbox.

**Bookings page** (`?view=`): Needs confirmation (default) · Today · All upcoming (`pending` + `confirmed` from today) · Past. Upcoming lists sort by `starts_at` ascending.

**Appointment card actions:** Call (`tel:+91…`), WhatsApp (`wa.me` with a confirmation script), Confirm (pending → confirmed), Done (confirmed → completed), Cancel, No-show. Cancel/no-show **free the slot** via the exclusion predicate.

**Hours page:** read-only table of sessions (edit hours UI not in MVP).

**Doctors / Services:** list + create forms; slug generated with `slugify` + time suffix.

---

## 10. End-user experience (journeys)

### 10.1 Patient — book a slot

1. Lands from Google/Maps or platform “Demo clinic”.
2. Scans treatments; taps **Book an appointment** (or a treatment card with `?service=` — wizard still starts from first service unless wired to that query in a later change).
3. Picks treatment → eligible doctor → weekday → real slot.
4. Enters 10-digit Indian mobile; submits.
5. Sees reference `SD-######` and “clinic will confirm”.
6. Reception calls or WhatsApps; patient does not log in.

Failure: slot taken → choose another time. Invalid mobile → inline validation.

### 10.2 Patient — callback only

1. Unsure of treatment → **Request a callback** (home or contact).
2. Name, mobile, short requirement.
3. “Received. The clinic will call you back.”
4. Appears on dashboard Leads as `new`.

### 10.3 Reception — convert a booking

1. Signs in at `/login`.
2. **Needs confirmation** lists every open website request, including next week. **Alerts** toast if a new booking just arrived.
3. Opens card → Call or WhatsApp with prefilled message including reference and time.
4. **Confirm** when the patient agrees; **Cancel** if they decline (slot reopens); **Done** after visit; **No-show** if they miss.

### 10.4 Reception — work a lead

1. Leads list / home range view.
2. Call / WhatsApp.
3. Status: contacted → converted (if they later book) or lost.

### 10.5 Clinic admin — catalogue

1. Add a service (duration drives slot length).
2. Add a doctor and tick treatments; default Mon–Sat split hours apply immediately to public booking.
3. Hours page to **verify** sessions (changes still require SQL/Hasura in this MVP).

### 10.6 Platform admin

Signs in but cannot operate a clinic dashboard until a clinic-scoped user is used. Future: operator console for onboarding clinics.

---

## 11. Application map (code)

```
src/app/
  page.tsx                    Platform landing
  login/page.tsx
  layout.tsx                  Fonts + metadata
  c/[slug]/                   Public clinic
  dashboard/                  Staff (layout + live refresh)
  api/auth|c|dashboard|webhooks

src/lib/
  auth.ts, hasura.ts, clinic.ts, slots.ts
  dashboard-data.ts, date-range.ts, notify.ts
  format.ts, slug.ts, types.ts

src/components/
  booking-wizard, callback-form, clinic-chrome
  dashboard-nav, dashboard-live, notification-bell
  appointment-card, appointment-list, status-select, date-range-bar
  clinic-config-forms

hasura/migrations + metadata
scripts/                      unit tests + e2e.mjs
```

Middleware matcher: `/dashboard/:path*` only.

---

## 12. Configuration

From `.env.example`:

| Variable | Purpose |
| --- | --- |
| `HASURA_GRAPHQL_URL` | GraphQL endpoint |
| `HASURA_ADMIN_SECRET` | Server → Hasura |
| `HASURA_EVENT_SECRET` | Webhook auth |
| `AUTH_SECRET` | Session JWT |
| `NEXT_PUBLIC_APP_URL` | Public origin |
| `RESEND_API_KEY` | Optional email |
| `RESEND_FROM` | From address |

Compose also sets `HASURA_GRAPHQL_JWT_SECRET` (reserved for a future Hasura-auth integration).

---

## 13. Testing and verification

| Command | What |
| --- | --- |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Slot engine, date-range, notify copy (`node --test` + tsx) |
| `npm run verify` | typecheck + lint (`max-warnings 0`) + unit tests |
| `npm run test:e2e` | Live server: public pages, slots, book, **409 on double book**, lead, login cookie, overview includes booking, notifications |

E2E expects Hasura on `:8080` and the app on `:3000`.

---

## 14. Known MVP gaps (honest contract)

- Role-based staff permissions (`receptionist` vs `clinic_admin` vs `doctor`) are data-only.
- Hasura is admin-secret only; no RLS.
- `booking_mode = instant` is unused; all web books are `pending`.
- Hours are not editable in the dashboard UI.
- Clinic home “chair hours” are static copy.
- No patient email/SMS confirmation; clinic email is best-effort.
- Platform admin console is a stub.
- Booking wizard does not yet consume `?service=` from treatment cards (cards link with the query; wizard initialises to the first service).
- Dashboard date bounds assume IST `+05:30` in `rangeBounds`.

---

## 15. Security notes for production

- Rotate `AUTH_SECRET`, Hasura admin/event secrets, and Postgres password.
- Restrict Hasura console and admin secret to private networks.
- Serve Next.js over HTTPS so `Secure` cookies apply.
- Do not expose Hasura to the public internet with the admin secret.
- Rate-limit public book/lead endpoints (not implemented).
- Treat seed users as non-production.
