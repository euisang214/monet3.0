# Monet MVP

Monet is a Next.js + TypeScript application with Prisma/Postgres, NextAuth (email+password + LinkedIn, Google Calendar), Stripe Connect (USA), Zoom meetings, BullMQ for background jobs, RBAC, rate limiting, audit logs, strong typing end‑to‑end, and an App Router API.

This package is designed to be **unzipped into a fresh Next.js app created via**:

```bash
npx create-next-app@latest monet
```

## Quick Start (copy–paste)

> These steps assume you're already in the `monet/` folder created by `create-next-app`.

```bash
# 1) Unzip the code overlay into your base app (overwrite files)
#    On macOS/Linux:
unzip -o ../monet-mvp.zip -d .

# 2) Install deps
npm i

# 3) (Optional) Start Postgres & Redis via Docker
docker compose up -d

# 4) Prepare the database
npx prisma migrate dev
npx prisma db seed

# 5) Copy .env.example to .env and fill in values
cp .env.example .env

# 6) Run the dev server
npm run dev

# 7) Start the background worker in another terminal
npm run dev:queue
```

### Seeded access

- **Admin**: `admin@monet.local` / `admin123!`
- **Candidate**: `cand1@monet.local` / `cand123!`
- **Professional**: `pro1@monet.local` / `pro123!`

Visit:
- Candidate: `/candidate/dashboard`
- Professional: `/professional/dashboard`
- Admin: `/admin`

### Notes

- If you prefer a locally installed Postgres instead of Docker, set `DATABASE_URL` accordingly in `.env` and skip `docker compose`.
- Background jobs require Redis (BullMQ). The included `docker-compose.yml` runs Redis locally.
- **CALL_DURATION_MINUTES** is used across scheduling UI, availability math, Google free/busy validation, and calendar event creation.

## What’s included

- **App Router** routes for public, candidate, professional, and admin surfaces, plus fully-typed API endpoints under `/app/api/*`.
- Prisma schema, migrations, and seed data (8–12 professionals, 20–30 candidates, multiple bookings across states, feedback entries incl. one QC “revise”).
- NextAuth with Email+Password, LinkedIn (lite+email), Google (Calendar scope). Server-side session enforcement with route RBAC.
- Stripe Connect Express (destination charges, 20% platform fee, success-fee module 10%).
- Zoom server-created meetings (waiting room ON, recording OFF, passcode ON).
- BullMQ queues for nudges, QC checks, payout gating.
- Rate-limiting middleware and audit logs for payouts/refunds.
- Postman collection under `/docs/Monet.postman_collection.json` covering the API surface.
- Admin CSV export endpoints for Users, Bookings, Payments, Payouts, Feedback(QC), Disputes, Success-Fee Invoices.

## References (for developers)
- Next.js App Router: https://nextjs.org/docs/app
- Prisma: https://www.prisma.io/docs
- NextAuth: https://authjs.dev
- Stripe Connect (destination charges): https://stripe.com/docs/connect/destination-charges
- Zoom Server-to-Server OAuth: https://developers.zoom.us
- BullMQ: https://docs.bullmq.io

## Unzip behavior

This overlay **adds** new files and **overwrites** existing app files when necessary. If you’ve modified your base app before unzipping, stash those changes first.

---

## Project Structure

```
/app
  /(public)           -> Landing, How It Works, Pricing, Contact
  /(candidate)        -> Dashboard, Browse, Detail (redacted), History, Availability, Settings
  /(professional)     -> Dashboard, Requests, Feedback, Earnings, Settings
  /(admin)            -> Users, Bookings, Payments, Payouts, Feedback(QC), Disputes, Invoices, Audit logs
  /api/*              -> App Router API routes (bookings, feedback, qc, payouts, verification, search, stripe, zoom)
  /components/*       -> Shared UI kit (tokens/components)
  /lib/*              -> server utilities, RBAC, feature flags, payments, calendars, zoom, qc
  /styles/*           -> global CSS, tokens
/prisma
  schema.prisma
  /migrations/*
  seed.ts
/docs
  Monet.postman_collection.json
  ARCHITECTURE.md
  QC_RUBRIC.md
/public
  /brand/* (Monet wordmark assets)
/scripts
  dev:seed, dev:queue, etc.
.env.example
package.json
README.md
docker-compose.yml
```

---

## Environment

See `.env.example` for all required variables and flags. **Exactly these feature flags** are included and read server-side:

- `FEATURE_LINKEDIN_ENHANCED` (default: false)
- `FEATURE_SUCCESS_FEE` (default: true)
- `FEATURE_QC_LLM` (default: true)

Additionally, OAuth requires these environment variables:

- `AUTH_SECRET` and `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`

For Google sign‑in, ensure the Google Cloud Console lists `http://localhost:3000/api/auth/callback/google` (or your deploy URL) under **Authorized redirect URIs**.

---

## Migrations & Seeding

The initial migration creates all tables/enums and a SQL view (`ListingCardView`). Seed inserts:
- 12 Professionals (varied firms & prices)
- 25 Candidates
- 7 Bookings across statuses
- 6 Feedback entries (incl. one `revise`)
- Some Payments & Payouts for flows

---

## Tests

Run unit & e2e tests:

```bash
npm run test
npm run test:e2e
```

Unit tests cover cancellation edge cases, QC gating, and payout/refund transitions. E2E tests exercise request→accept→schedule→checkout→confirmation; pro cancel; candidate late cancel (using API handlers with mocked external services).

---

## CSV Exports

Admin pages include **Export CSV** buttons powered by `/api/admin/*/export`. These output RFC4180-compliant CSVs suitable for spreadsheets.

---

## Security & RBAC

- Server-side checks for every API handler
- Rate limiting on sensitive POST routes
- Audit logs for payouts/refunds with Stripe IDs and actor info
- Role-safe route segments and helpers in `lib/auth/rbac.ts`

---

## Developer Scripts

- `npm run dev` — Next dev server
- `npm run dev:queue` — Starts BullMQ workers
- `npm run seed` — Runs Prisma seed
- `npm run test` — Unit tests (Vitest)
- `npm run test:e2e` — E2E tests (Vitest)

Enjoy building 🚀
