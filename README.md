# fystay

A booking marketplace in the spirit of Airbnb: guests search and book stays, hosts list and
manage properties, and payments run through Stripe Checkout.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + PostgreSQL
- [NextAuth.js](https://authjs.dev) (credentials-based auth, JWT sessions)
- [Stripe](https://stripe.com) Checkout for payments
- [react-day-picker](https://daypicker.dev) for the booking calendar
- A small in-house design system (`src/components/ui`) built on
  [class-variance-authority](https://cva.style) + [lucide-react](https://lucide.dev) icons, with
  [sonner](https://sonner.emilkowal.ski) for toasts

## Design system

`src/components/ui` holds the primitives every surface is built from: `Button`, `Input`,
`Textarea`, `Select`, `Card`, `Badge`, `Avatar`, `Skeleton`, `Spinner`, and `Dialog`/`ConfirmDialog`.
Brand colors, surface/text tokens, and shadows are defined once in `src/app/globals.css` (a teal
brand scale, chosen to read as trustworthy and premium rather than the pink-clone look) — change
them there and every component picks it up. Every route has a matching `loading.tsx` skeleton,
plus shared `not-found.tsx` and `error.tsx` boundaries.

## Features

- **Listings** — browse and search by destination, dates, and guest count; detail pages with
  photo gallery, amenities, and an availability-aware booking widget.
- **Auth & roles** — sign up as a guest or a host; hosts get a dashboard, guests get a trips page.
- **Host dashboard** — create, edit, publish/unpublish, and delete listings; see upcoming
  bookings per listing.
- **Booking & availability** — date-range picker that disables already-booked nights and
  computes the total price.
- **Payments** — booking a stay creates a Stripe Checkout session; a webhook confirms the
  booking once payment succeeds.
- **Photo uploads** — hosts upload real photos (via Supabase Storage) instead of pasting URLs,
  with a manual URL-paste fallback if storage isn't configured on a given deployment.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start Postgres

```bash
docker compose up -d
```

This starts a local Postgres instance matching the connection string in `.env.example`
(`postgresql://fystay:fystay@localhost:5432/fystay`).

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `AUTH_SECRET` with a random string (`openssl rand -base64 32`). Stripe keys can stay
blank for local development — see [Payments without Stripe keys](#payments-without-stripe-keys)
below.

### 4. Run migrations and seed data

```bash
npx prisma migrate dev
npm run db:seed
```

The seed script creates:

| Role  | Email               | Password       |
| ----- | ------------------- | -------------- |
| Host  | host@fystay.dev      | hostpass123    |
| Guest | guest@fystay.dev     | guestpass123   |

...plus three sample listings with generated placeholder art (no external image host, so the
demo never depends on network access). Photos submitted through the app itself must be real
http(s) URLs — editing a seeded listing without replacing its placeholder photos first will fail
validation.

### 5. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Payments without Stripe keys

If `STRIPE_SECRET_KEY` is not set, the checkout API skips Stripe entirely and confirms the
booking immediately — useful for exercising the full booking flow in local development without
a Stripe account. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable real Checkout sessions, and point a webhook at
`/api/webhooks/stripe` for the `checkout.session.completed` event (e.g. via
`stripe listen --forward-to localhost:3000/api/webhooks/stripe` during development).

## Deploying

`vercel.json` pins the framework to `nextjs` so Vercel builds it correctly regardless of the
project's dashboard settings. You'll need to configure, in the Vercel project's environment
variables:

- `DATABASE_URL` pointing at a real Postgres instance (e.g. [Neon](https://neon.tech) or
  [Supabase](https://supabase.com)). **On Supabase, use the pooled connection string** (the
  "Transaction pooler" option in the dashboard, port `6543`, with `?pgbouncer=true` appended) —
  serverless functions open a new connection per invocation, and a direct connection
  (port `5432`) exhausts Postgres's connection limit under real traffic.
- `DIRECT_URL` set to the *direct* (non-pooled, port `5432`) connection string. Prisma Migrate
  needs a direct connection — PgBouncer's transaction mode doesn't support the operations it
  runs — so this is used only when you run `npx prisma migrate deploy`, never by the app itself.
- `AUTH_SECRET` (a random string) and `NEXTAUTH_URL` (your deployed URL)
- `NEXT_PUBLIC_BASE_URL` set to the same deployed URL (used for Stripe redirect URLs and Open
  Graph metadata)
- Stripe keys if you want real payments; otherwise bookings auto-confirm as described above
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` if you want real host photo uploads
  (see [Photo uploads](#photo-uploads) below); otherwise the upload button shows an error and
  hosts fall back to pasting an image URL directly

After setting `DATABASE_URL`/`DIRECT_URL`, run `npx prisma migrate deploy` once from your machine
(with those same two variables in your local `.env`) to create the schema on the real database.

## Photo uploads

Hosts upload photos through `/api/uploads`, which checks the session is a logged-in host, then
uploads server-side to a Supabase Storage bucket using the `service_role` key (uploads are
authorized by our own session check, not Supabase's row-level security, since the app doesn't use
Supabase Auth). To enable this:

1. In a Supabase project, create a public bucket named `listing-photos`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` to the project's URL (not sensitive — safe to expose).
3. Set `SUPABASE_SERVICE_ROLE_KEY` to the project's `service_role` secret key from
   Settings → API Keys. **Never expose this to the client** — it's only read in
   `src/lib/storage.ts`, a server-only module.

If these aren't set, `isStorageConfigured()` returns `false` and the upload API returns a clear
error instead of crashing; the listing form's "paste an image URL" fallback still works.

## Testing

- **Unit tests** ([Vitest](https://vitest.dev)) cover pure logic in `src/lib/` (availability/overlap
  math, price formatting, URL validation): `npm test` (or `npm run test:watch`).
- **End-to-end tests** ([Playwright](https://playwright.dev)) cover the golden paths — a guest
  logging in, booking a listing, and seeing it under "My trips"; a host creating, editing, and
  deleting a listing — against a real running instance of the app: `npm run test:e2e`. This needs
  the dev server's database seeded first (`npx prisma migrate deploy && npm run db:seed`);
  Playwright then starts `npm run dev` itself (see `playwright.config.ts`).
- CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, and a production build against
  a real Postgres service on every push/PR, then runs the Playwright suite in a second job.

## Security

- **Content-Security-Policy** — `src/proxy.ts` (Next's renamed `middleware.ts`) generates a
  per-request nonce and sets a `script-src 'self' 'nonce-...' 'strict-dynamic'` CSP; every real
  page in the app is already dynamically rendered (via `auth()`), so nonces cost no static-
  generation benefit. `style-src` allows `'unsafe-inline'` since a few components (e.g. `Avatar`)
  set inline `style` attributes, which can't carry a nonce.
- Other security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Strict-Transport-Security`) are set in `next.config.ts`.
- `trustHost: true` is set in `src/auth.ts` — without it, NextAuth v5 rejects every request with
  "UntrustedHost" as soon as the app runs in production mode (`next start`/Vercel), since it
  can't otherwise tell a real request's Host header from a spoofed one. Safe here because the app
  only ever sits behind Vercel's proxy, which sets a trustworthy Host header itself.
- Stripe webhook signatures are verified (`src/app/api/webhooks/stripe/route.ts`); listing/booking
  mutation routes check resource ownership server-side, not just in the UI; booking price is
  always computed server-side from the listing's stored price, never trusted from the client.
- A `PENDING` booking (created before Stripe Checkout completes) only blocks a listing's dates for
  30 minutes (`PENDING_BOOKING_HOLD_MINUTES` in `src/lib/availability.ts`) — otherwise an abandoned
  checkout would lock those dates out for every other guest indefinitely.
- Known accepted gap: two guests booking the same dates at the exact same moment could both pass
  the availability check before either row is written (no DB-level exclusion constraint on
  booking date ranges) — a real race condition, left as-is since closing it needs a Postgres
  `EXCLUDE` constraint (via `btree_gist`), which is a larger migration than this pass covers.

## Project structure

```
prisma/schema.prisma       Data model (User, Listing, Booking)
prisma/seed.ts             Seed script
src/auth.ts                NextAuth configuration
src/lib/                   Prisma client, availability logic, formatting, Stripe client
src/app/                   Routes (pages + API routes)
src/components/            Shared UI (forms, booking widget, listing card, navbar)
```

## Scripts

| Command             | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`         | Start the dev server                 |
| `npm run build`       | Production build                     |
| `npm run start`       | Start the production server          |
| `npm run lint`        | Lint                                  |
| `npm run typecheck`   | Type-check with `tsc --noEmit`       |
| `npm test`            | Run unit tests                        |
| `npm run test:watch`  | Run unit tests in watch mode          |
| `npm run test:e2e`    | Run Playwright end-to-end tests       |
| `npm run db:migrate`  | Run Prisma migrations                |
| `npm run db:seed`     | Seed the database                    |
