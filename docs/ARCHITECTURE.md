# Architecture

This MVP uses:

- **Next.js App Router** for server-rendered pages and API routes.
- **NextAuth** with Email+Password, LinkedIn (lite+email), and Google (Calendar scopes).
- **Prisma + Postgres** for data storage; a SQL view (`ListingCardView`) powers public listing cards.
- **Stripe Connect** (destination charges) with 20% platform fee. Cards are entered only at checkout.
- **Zoom** meetings are created server-side on acceptance/checkout; waiting room ON, recording OFF, passcode ON.
- **BullMQ + Redis** schedules nudges (+24h, +48h), QC grace (+24h), and payout gating on QC pass.
- **LLM QC flag** — in this MVP, a rule-based QC is implemented; swapping to an LLM is isolated behind `lib/qc.ts` and a queue worker.
- **RBAC** — role-guarded route segments and API handlers; admin access is seed-gated to `admin@monet.local`.
- **Audit logs** — payouts/refunds are logged with Stripe IDs and actor info.
- **Rate limiting** — lightweight in-memory limiter for dev.

## Data Flow Highlights

1. **Discovery**
   - `/api/professionals/search` exposes anonymized cards populated from `ListingCardView`.

2. **Request → Accept → Schedule**
   - `POST /api/bookings/request` creates a `requested` booking.
   - `POST /api/bookings/:id/accept` returns merged Google Calendar availability to pick a slot.
   - `POST /api/bookings/:id/schedule` sets a tentative slot (30m blocks via `CALL_DURATION_MINUTES`) and moves to `accepted`.

3. **Checkout**
   - `POST /api/bookings/:id/checkout` creates a Stripe PaymentIntent and returns its client secret and ID. A Zoom meeting is also created.
   - After Stripe confirms the card on the client, call `POST /api/payments/confirm` with the PaymentIntent ID to finalize the booking.

4. **Feedback & QC**
   - `POST /api/feedback/:bookingId` validates word count, exact 3 actions, stars present.
   - QC job evaluates feedback and sets `qcStatus` to `passed` or `revise`. On pass, payout is marked `pending`.

5. **Cancellations**
   - `POST /api/bookings/:id/cancel` applies the 3-hour window policy.

6. **Admin**
   - Minimal tables with CSV exports and audit logging.

## Frontend Mapping

- Pages mirror the PDFs for candidate and professional surfaces, with anonymity preserved pre‑booking.
- The **Availability** grid uses 15‑minute increments with a 30‑minute slot size derived from `CALL_DURATION_MINUTES`.
