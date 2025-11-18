# CLAUDE.md - Monet 3.0 Codebase Guide for AI Assistants

> **Last Updated**: 2025-11-17
> **Version**: 0.1.0
> **Purpose**: Comprehensive guide for AI assistants working on the Monet marketplace platform

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [Development Setup](#development-setup)
6. [Key Conventions](#key-conventions)
7. [Database Schema](#database-schema)
8. [API Routes](#api-routes)
9. [Authentication & Authorization](#authentication--authorization)
10. [Important Workflows](#important-workflows)
11. [Testing](#testing)
12. [Code Patterns](#code-patterns)
13. [Common Tasks](#common-tasks)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Monet 3.0** is a full-stack marketplace platform that connects **Candidates** (job seekers) with **Professionals** (industry experts) for paid consultation calls. The platform is a three-sided marketplace with distinct portals for Candidates, Professionals, and Admins.

### Core Features

- **Anonymous Professional Discovery**: Candidates browse redacted professional profiles
- **Booking Workflow**: Request → Accept → Schedule → Checkout → Call → Feedback
- **Payment Processing**: Stripe Connect with escrow pattern (20% platform fee)
- **Quality Control**: Automated feedback validation with payout gating
- **Calendar Integration**: Google Calendar sync for availability
- **Video Meetings**: Zoom meetings created server-side
- **Background Jobs**: BullMQ for nudges, QC checks, and notifications
- **Multi-role Access**: Separate dashboards for each user role

### Key Business Rules

- **Call Duration**: 30 minutes (configurable via `CALL_DURATION_MINUTES`)
- **Platform Fee**: 20% of booking price
- **Success Fee**: Optional 10% fee (feature flag)
- **Cancellation Policy**: 3-hour window before scheduled call
- **QC Requirements**:
  - Minimum 200 words
  - Exactly 3 action items
  - 3 star ratings (content, delivery, value)
- **Payout Gating**: Payments released only after QC passes

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14.2.31 (App Router with RSC)
- **Language**: TypeScript 5.6.3 (strict mode)
- **UI Library**: React 18.2.0
- **Styling**: Custom CSS with design tokens + React Bootstrap 2.10.10
- **Icons**: Lucide React 0.424.0
- **Calendar UI**: Toast UI Calendar 2.0.1
- **Date Handling**: date-fns 3.6.0, date-fns-tz 3.2.0
- **Payment UI**: @stripe/react-stripe-js 3.9.2

### Backend
- **Runtime**: Node.js with TypeScript
- **ORM**: Prisma 6.16.2 + Prisma Accelerate extension
- **Database**: PostgreSQL with SQL views
- **Authentication**: NextAuth v5.0.0-beta.20 (JWT strategy)
- **Job Queue**: BullMQ 5.7.6 + Redis (ioredis 5.4.1)
- **Payment Processing**: Stripe 14.21.0 (Connect destination charges)
- **Video**: Zoom Server-to-Server OAuth
- **Email**: Nodemailer 6.9.14 + AWS SES
- **File Storage**: AWS S3
- **Validation**: Zod 3.23.8

### DevOps & Testing
- **Testing**: Vitest 3.2.4 (unit + E2E)
- **Package Manager**: npm
- **Build Tool**: tsx 4.19.2 for TypeScript execution
- **Container**: Docker Compose (Postgres + Redis)

---

## Architecture

### Application Type
**Full-Stack Monolith** with Server-Side Rendering

- **Frontend**: Next.js App Router with React Server Components
- **Backend**: Next.js API routes (RESTful)
- **Database**: Single PostgreSQL instance
- **Background Jobs**: Separate worker process via BullMQ

### Key Architectural Patterns

1. **App Router Structure**: Route-based file organization
2. **Server Components First**: Client components only when needed
3. **API Route Handlers**: RESTful endpoints under `/app/api/*`
4. **Service Layer**: Business logic in `/lib/*` utilities
5. **Repository Pattern**: Prisma as data access layer
6. **JWT Sessions**: Stateless authentication
7. **RBAC**: Role-based route and API protection
8. **Queue-based Background Jobs**: Async processing for long-running tasks

### Data Flow

```
Browser → Next.js SSR → Prisma → PostgreSQL
   ↓
Browser → API Routes → Service Layer → Prisma → PostgreSQL
   ↓
Background Jobs → BullMQ → Redis → Service Layer → Prisma
```

### Three User Portals

1. **Candidate Portal** (`/candidate/*`)
   - Browse professionals (anonymized)
   - Request bookings
   - Manage availability
   - View booking history

2. **Professional Portal** (`/professional/*`)
   - View booking requests
   - Accept/decline requests
   - Submit feedback
   - View earnings

3. **Admin Portal** (`/admin/*`)
   - User management
   - Booking oversight
   - Payment/payout management
   - CSV exports
   - Audit logs

---

## Directory Structure

```
monet3.0/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (public)/                # Public routes (landing, pricing, etc.)
│   │   ├── candidate/               # Candidate portal
│   │   │   ├── dashboard/
│   │   │   ├── browse/
│   │   │   ├── availability/
│   │   │   ├── history/
│   │   │   └── settings/
│   │   ├── professional/            # Professional portal
│   │   │   ├── dashboard/
│   │   │   ├── requests/
│   │   │   ├── feedback/
│   │   │   ├── earnings/
│   │   │   └── settings/
│   │   ├── admin/                   # Admin portal
│   │   │   ├── users/
│   │   │   ├── bookings/
│   │   │   ├── payments/
│   │   │   └── feedback/
│   │   └── api/                     # API routes
│   │       ├── auth/
│   │       ├── bookings/
│   │       ├── professionals/
│   │       ├── candidate/
│   │       ├── payments/
│   │       ├── stripe/
│   │       ├── feedback/
│   │       ├── qc/
│   │       └── verification/
│   ├── components/                  # Shared React components (organized by domain)
│   │   ├── bookings/               # Booking-related components
│   │   ├── feedback/               # Feedback components
│   │   ├── profile/                # Profile components
│   │   ├── dashboard/              # Dashboard components
│   │   └── ui/                     # Shared UI primitives
│   ├── types/                       # TypeScript type definitions
│   ├── auth.ts                      # NextAuth configuration
│   └── middleware.ts                # Auth middleware
├── lib/                             # Server-side utilities (organized by role)
│   ├── professional/                # Professional-specific business logic
│   │   ├── dashboard.ts
│   │   ├── earnings.ts
│   │   ├── feedback.ts
│   │   └── requests.ts
│   ├── candidate/                   # Candidate-specific business logic (reserved)
│   ├── shared/                      # Shared business logic
│   │   ├── bookings/
│   │   │   ├── history.ts
│   │   │   └── upcoming.ts
│   │   ├── availability.ts
│   │   ├── qc.ts
│   │   ├── audit.ts
│   │   └── time-slot.ts
│   ├── integrations/                # Third-party service integrations
│   │   ├── stripe/
│   │   │   ├── index.ts
│   │   │   └── confirm.ts
│   │   ├── calendar/
│   │   │   └── google.ts
│   │   ├── zoom.ts
│   │   ├── email.ts
│   │   └── s3.ts
│   ├── core/                        # Core infrastructure
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── api-helpers.ts           # API auth and helpers
│   │   ├── flags.ts                 # Feature flags
│   │   ├── rate-limit.ts            # Rate limiting
│   │   └── admin-export.ts          # Admin CSV exports
│   ├── utils/                       # Pure utilities
│   │   ├── date.ts
│   │   ├── timezones.ts
│   │   └── profileOptions.ts
│   └── queues/                      # BullMQ workers
│       └── index.ts
├── prisma/
│   ├── schema.prisma                # Database schema
│   ├── migrations/                  # Migration history
│   └── seed.ts                      # Seed data
├── tests/                           # Test files
│   ├── availability.test.ts
│   ├── cancellations.test.ts
│   ├── qc-gating.test.ts
│   ├── zoom.test.ts
│   └── e2e/
│       └── flow.test.ts
├── docs/
│   ├── ARCHITECTURE.md              # Architecture overview
│   ├── QC_RUBRIC.md                 # QC validation rules
│   └── Monet.postman_collection.json
├── scripts/
│   └── dev-queue.ts                 # Queue worker script
├── styles/                          # Global CSS
├── public/                          # Static assets
│   └── brand/                       # Logo and branding
├── package.json
├── tsconfig.json
├── .env.example
├── docker-compose.yml
└── README.md
```

### Important Path Alias

- `@/*` maps to `./src/*` (defined in `tsconfig.json`)

**Usage**: `import { prisma } from '@/lib/core/db'` instead of `import { prisma } from '../../../lib/db'`

---

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Docker services (optional - if using local DB/Redis)
docker compose up -d

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed the database
npm run seed

# 6. Start development server
npm run dev

# 7. In a separate terminal, start background worker
npm run dev:queue
```

### Seeded Test Users

After running `npm run seed`, these users are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@monet.local | admin123! |
| Candidate | cand1@monet.local | cand123! |
| Professional | pro1@monet.local | pro123! |

### Development URLs

- App: http://localhost:3000
- Candidate Dashboard: http://localhost:3000/candidate/dashboard
- Professional Dashboard: http://localhost:3000/professional/dashboard
- Admin Portal: http://localhost:3000/admin

### NPM Scripts

```bash
npm run dev          # Start Next.js dev server (port 3000)
npm run dev:queue    # Start BullMQ background worker
npm run build        # Production build
npm run start        # Production server
npm run seed         # Run database seed
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run clean        # Clean build cache
npm run reset-packages # Remove node_modules and reinstall
```

### Two-Process Development

⚠️ **IMPORTANT**: Always run **both** processes during development:

1. **Main App**: `npm run dev` (Next.js server)
2. **Queue Worker**: `npm run dev:queue` (Background jobs)

The queue worker handles:
- QC validation jobs
- Email notifications
- Nudge reminders
- Payout processing

---

## Key Conventions

### File Naming

- **Components**: PascalCase (e.g., `ProfileCard.tsx`)
- **Utilities**: kebab-case (e.g., `get-availability.ts`)
- **API Routes**: kebab-case (e.g., `route.ts` in folder structure)
- **Types**: PascalCase (e.g., `BookingTypes.ts`)

### Code Style

- **TypeScript Strict Mode**: Enabled (`strict: true`)
- **No Implicit Any**: All types must be explicit
- **Path Aliases**: Use `@/*` for imports from `src/`
- **Async/Await**: Preferred over `.then()` chains
- **Error Handling**: Always catch and handle errors appropriately

### Commit Message Conventions

Based on recent commits, the project follows this pattern:

```
<verb> <subject>
```

Examples:
- "Persist Google Calendar sync results via availability records"
- "Show generic error message in status popup"
- "Fix availability type re-exports"
- "Refactor professional booking availability view endpoint"

**Verbs used**:
- Fix: Bug fixes
- Add: New features
- Update/Refine: Improvements
- Remove: Deletions
- Refactor: Code restructuring
- Polish: UI/UX improvements

### Component Organization

1. **Route Collocation**: Forms and components in same directory as pages
2. **Shared Components**: `/src/components` for reusable UI
3. **"use client" Directive**: Only on interactive client components
4. **Server Components**: Default for all components

### API Response Patterns

**Success Response**:
```typescript
return Response.json({ data: result })
```

**Error Response**:
```typescript
return Response.json({ error: 'error_code' }, { status: 400 })
```

**Common Error Codes**:
- `unauthorized` - 401
- `forbidden` - 403
- `not_found` - 404
- `validation_error` - 400
- `internal_error` - 500

---

## Database Schema

### Core Models

#### User
```prisma
model User {
  id                      String   @id @default(cuid())
  email                   String   @unique
  hashedPassword          String?
  role                    Role     // CANDIDATE | PROFESSIONAL | ADMIN
  googleCalendarConnected Boolean  @default(false)
  linkedinConnected       Boolean  @default(false)
  corporateEmailVerified  Boolean  @default(false)
  timezone                String   @default("UTC")
  stripeCustomerId        String?  // For candidates
  stripeAccountId         String?  // For professionals (Connect)
  // ... relations
}
```

#### Booking
```prisma
model Booking {
  id               String        @id @default(cuid())
  candidateId      String
  professionalId   String
  status           BookingStatus // draft | requested | accepted | cancelled | completed | completed_pending_feedback | refunded
  priceUSD         Float?
  startAt          DateTime
  endAt            DateTime
  zoomMeetingId    String?
  zoomJoinUrl      String?
  timezone         String        @default("UTC")
  // ... relations
}
```

#### CallFeedback
```prisma
model CallFeedback {
  bookingId       String   @id
  text            String   // Detailed feedback (min 200 words)
  summary         String?  // Brief summary for QC LLM reference
  actions         String[] // Exactly 3 action items
  wordCount       Int      // Calculated word count
  contentRating   Int      // 1-5 stars (content quality)
  deliveryRating  Int      // 1-5 stars (delivery quality)
  valueRating     Int      // 1-5 stars (overall value)
  qcStatus        QCStatus // passed | revise | failed | missing
  submittedAt     DateTime
  // ... relations

  @@map("Feedback") // Maps to existing table
}
```

**Note**: Model renamed from `Feedback` to `CallFeedback` for clarity. This is the feedback that professionals provide to candidates after calls.

### Enums

```prisma
enum Role {
  CANDIDATE
  ADMIN
  PROFESSIONAL
}

enum BookingStatus {
  draft
  requested
  accepted
  cancelled
  completed
  completed_pending_feedback
  refunded
}

enum PaymentStatus {
  held      // Funds in escrow
  released  // Transferred to professional
  refunded  // Returned to candidate
}

enum PayoutStatus {
  pending  // Awaiting QC pass
  paid     // Transferred
  blocked  // QC failed
}

enum QCStatus {
  passed   // Meets requirements
  revise   // Needs improvement
  failed   // Does not meet standards
  missing  // No feedback submitted
}
```

#### ProfessionalRating
```prisma
model ProfessionalRating {
  bookingId   String   @id
  rating      Int      // 1-5 stars
  text        String   // Min 50 characters
  submittedAt DateTime @default(now())
  timezone    String   @default("UTC")
  // Relation to booking

  @@map("ProfessionalReview") // Maps to existing table
}
```

**Usage**: Allows candidates to submit reviews/ratings for professionals after completed calls. This is distinct from `CallFeedback` which professionals submit about candidates.

#### Verification
```prisma
model Verification {
  id             String    @id @default(cuid())
  userId         String
  corporateEmail String
  token          String
  verifiedAt     DateTime?
  createdAt      DateTime  @default(now())
  timezone       String    @default("UTC")
}
```

**Usage**: Corporate email verification for professionals. Stores verification tokens and tracks verification status.

#### PasswordResetToken
```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  timezone  String   @default("UTC")
}
```

**Usage**: Password reset functionality. Tokens expire and are single-use.

### SQL Views

**ListingCardView**: Optimized view for professional listings
- Pre-joins User, ProfessionalProfile, and aggregates
- Used for search results and browse pages

### Indexes

- `User.role` - For role-based queries
- `Booking.candidateId`, `Booking.professionalId` - For user bookings
- `OAuthAccount.provider, providerAccountId` - For OAuth lookups

---

## API Routes

### Structure

All API routes are in `/src/app/api/` and follow Next.js App Router conventions. **APIs are now organized by user role** for better clarity and maintainability.

### Authentication (`/api/auth/*`)

Shared authentication endpoints (kept at root for NextAuth compatibility):
- `POST /api/auth/signup` - User registration
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/role` - Get current user's role
- `/api/auth/[...nextauth]` - NextAuth handlers

### Professional Portal (`/api/professional/*`)

Professional-specific endpoints:

**Bookings**:
- `GET /api/professional/bookings/[id]/schedule` - View candidate's available times
- `POST /api/professional/bookings/[id]/schedule` - Accept booking and schedule by picking a time
  - Creates Zoom meeting, sends calendar invites, changes status to 'accepted'
  - By selecting a time, the professional confirms/accepts the booking
- `POST /api/professional/bookings/[id]/decline` - Decline booking request

**Feedback**:
- `POST /api/professional/feedback/[bookingId]` - Submit feedback after call
- `GET /api/professional/feedback/[bookingId]` - Retrieve historical feedback
- `POST /api/professional/feedback/validate` - Validate feedback (QC check)

**Settings & Account**:
- `GET /api/professional/settings` - Get professional settings
- `PUT /api/professional/settings` - Update professional settings
- `DELETE /api/professional/settings` - Delete professional account
- `POST /api/professional/onboarding` - Stripe Connect onboarding

### Candidate Portal (`/api/candidate/*`)

Candidate-specific endpoints:

**Bookings**:
- `POST /api/candidate/bookings/request` - Request a booking with available times (no payment yet)
  - Body: `{ professionalId, slots, weeks }`
  - Creates booking with status 'requested'
- `POST /api/candidate/bookings/[id]/checkout` - Pay for accepted booking
  - Creates Stripe PaymentIntent and Payment record
  - Returns clientSecret for Stripe Elements

**Professional Discovery**:
- `GET /api/candidate/professionals/search` - Search/browse professionals (anonymized)
- `GET /api/candidate/professionals/[id]` - View professional profile details
  - Shows redacted profile if no booking history, reveals identity after first booking
- `GET /api/candidate/professionals/[id]/reviews` - View professional reviews

**Profile & Settings**:
- `GET /api/candidate/profile/[id]` - Get candidate profile
- `POST /api/candidate/availability` - Set availability preferences
- `GET /api/candidate/busy` - Get busy times from Google Calendar
  - Fetches 30 days of busy times, merges with manual availability
- `GET /api/candidate/settings` - Get candidate settings
- `PUT /api/candidate/settings` - Update candidate settings (includes resume upload to S3)
- `DELETE /api/candidate/settings` - Delete candidate account

### Shared/Common Endpoints (`/api/shared/*`)

Endpoints used by both roles or system-level operations:

**Bookings**:
- `POST /api/shared/bookings/[id]/cancel` - Cancel booking (either party, respects 3hr window)

**Payments & Stripe**:
- `POST /api/shared/payments/confirm` - Confirm payment after Stripe checkout
  - Body: `{ paymentIntentId }`
  - Validates payment succeeded
- `POST /api/shared/payments/payout` - Release payment to professional (admin only)
- `POST /api/shared/payments/refund` - Refund payment to candidate (admin only)
- `GET /api/shared/stripe/account` - Get Stripe account info
- `POST /api/shared/stripe/webhook` - Stripe webhook handler

**Verification**:
- `POST /api/shared/verification/request` - Request email verification
- `POST /api/shared/verification/confirm` - Confirm email verification
- `GET /api/shared/verification/status` - Check verification status

**QC & Reviews**:
- `POST /api/shared/qc/[bookingId]/recheck` - Recheck QC status (triggers new QC validation)
- `POST /api/shared/reviews` - Submit candidate review of professional
  - Body: `{ bookingId, rating (1-5), text (min 50 chars), timezone }`
  - Only accessible after booking completed
  - Prevents duplicate reviews
- `GET /api/shared/reviews` - Get reviews (used for displaying professional reviews)

### Admin Portal (`/api/admin/*`)

**Feedback Management**:
- `PUT /api/admin/feedback/[bookingId]/qc-status` - Manually update QC status (passed/revise/failed/missing)
  - When status set to 'failed', automatically triggers refund and blocks payout
  - Requires admin role

**CSV Export Endpoints**:
- `GET /api/admin/users/export` - Export users
- `GET /api/admin/bookings/export` - Export bookings
- `GET /api/admin/payments/export` - Export payments
- `GET /api/admin/payouts/export` - Export payouts
- `GET /api/admin/feedback/export` - Export feedback
- `GET /api/admin/disputes/export` - Export disputes
- `GET /api/admin/audit-logs/export` - Export audit logs

### API Conventions

**Session Validation**: Every API route must call `auth()` to validate session

```typescript
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

**Zod Validation**: Use Zod for request body validation

```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  price: z.number().positive(),
});

const parsed = schema.safeParse(body);
if (!parsed.success) {
  return Response.json({ error: 'validation_error' }, { status: 400 });
}
```

---

## Authentication & Authorization

### NextAuth Configuration

**File**: `/src/auth.ts`

**Providers**:
1. **Credentials** (Email + Password)
   - bcrypt hashing
   - Min 6 characters

2. **Google OAuth**
   - Scopes: `openid email profile calendar.readonly calendar.events`
   - Access type: `offline` (for refresh tokens)

3. **LinkedIn OAuth**
   - Scopes: `r_liteprofile r_emailaddress`

### Session Strategy

- **Type**: JWT (not database sessions)
- **Secret**: `AUTH_SECRET` or `NEXTAUTH_SECRET` env var
- **Session Object**:
  ```typescript
  {
    user: {
      id: string;
      role: 'CANDIDATE' | 'PROFESSIONAL' | 'ADMIN';
      email: string;
      name: string;
    }
  }
  ```

### Middleware Protection

**File**: `/src/middleware.ts`

```typescript
export { auth as middleware } from './auth';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
```

**Protected Routes**: All routes except:
- API routes (must check `auth()` manually)
- Static files (`_next/static`, `_next/image`)
- Favicon
- Files with extensions

### RBAC (Role-Based Access Control)

**File**: `/lib/core/api-helpers.ts`

**Helper Functions**: `requireAuth()`, `requireRole()`, `withAuth()`, `withRole()`

```typescript
import { requireAuth, requireRole, withRole } from '@/lib/core/api-helpers';

// Option 1: Using requireRole directly
export async function GET() {
  const session = await requireRole(['ADMIN', 'PROFESSIONAL']);
  // ... rest of handler
}

// Option 2: Using withRole wrapper (recommended)
export const GET = withRole(['ADMIN', 'PROFESSIONAL'], async (session, req) => {
  // ... handler logic
  return NextResponse.json({ data: result });
});
```

**Admin Access**: Hard-coded check for `admin@monet.local` email

### OAuth Account Management

**Model**: `OAuthAccount`
- Stores access tokens, refresh tokens
- Linked to User via `userId`
- Automatically updated on sign-in

---

## Important Workflows

### Booking Flow

```
1. DISCOVERY
   Candidate browses professionals
   → GET /api/candidate/professionals/search
   → Shows anonymized listings

2. REQUEST
   Candidate requests booking with available times
   → POST /api/candidate/bookings/request { professionalId, slots, weeks }
   → Creates booking with status: "requested"
   → Sends email notification to professional

3. ACCEPT & SCHEDULE
   Professional views candidate's available times and picks one
   → GET /api/professional/bookings/[id]/schedule (view candidate availability)
   → POST /api/professional/bookings/[id]/schedule { startAt }
   → Creates Zoom meeting
   → Sends calendar invites to both parties
   → Status changes to "accepted"
   → By selecting a time, the professional confirms/accepts the booking

4. CHECKOUT
   Candidate pays for the accepted booking
   → POST /api/candidate/bookings/[id]/checkout
   → Creates Stripe PaymentIntent (status: "held")
   → Creates Payment database record
   → Returns client secret for Stripe Elements

5. CONFIRM
   After Stripe confirms payment on client
   → POST /api/shared/payments/confirm { paymentIntentId }
   → Validates payment succeeded
   → Payment record status remains "held" until after call

6. CALL
   Candidate and Professional join Zoom
   → Join tracking via database
   → Status changes to "completed_pending_feedback" after both join

7. FEEDBACK
   Professional submits feedback
   → POST /api/professional/feedback/[bookingId] { summary, actions, ratings }
   → Triggers QC job (500ms delay)
   → Status changes to "completed"

8. QC & PAYOUT
   Background job validates feedback
   → If passed: Payout status → "pending", professional can withdraw funds
   → If revise: Nudge emails queued at +24h, +48h, +72h, professional can resubmit
   → If failed (manual admin action only): Auto-refund, PaymentStatus: "refunded", Payout.status: "blocked"
```

### Cancellation Flow

```
PROFESSIONAL CANCELLATION (anytime)
  → POST /api/shared/bookings/[id]/cancel
  → Full refund processed immediately
  → Status: "cancelled"
  → PaymentStatus: "refunded"

CANDIDATE CANCELLATION (>= 3 hours before call)
  → POST /api/shared/bookings/[id]/cancel
  → Full refund processed immediately
  → Status: "cancelled"
  → PaymentStatus: "refunded"

CANDIDATE LATE CANCELLATION (< 3 hours before call)
  → POST /api/shared/bookings/[id]/cancel
  → Returns error 400: "Cannot cancel within 3 hours of scheduled call time"
  → No refund, booking remains active
```

### QC Validation Flow

```
1. Feedback submitted
   → Validates min 200 words
   → Validates exactly 3 actions
   → Validates 3 star ratings present

2. QC Job queued (500ms delay)
   → BullMQ "qc" queue

3. QC Job runs (automatic)
   → Checks feedback quality
   → Sets qcStatus: "passed" | "revise"
   → Note: Automatic QC never sets "failed"

4. If PASSED
   → Payout.status = "pending"
   → Professional can withdraw funds

5. If REVISE
   → Nudge emails enqueued at +24h, +48h, +72h
   → Professional can resubmit feedback
   → Each resubmission triggers new QC check

6. If FAILED (manual admin action only)
   → Admin sets qcStatus to "failed" via PUT /api/admin/feedback/[bookingId]/qc-status
   → Auto-refund processed to candidate
   → PaymentStatus: "refunded"
   → Payout.status: "blocked"
```

### Google Calendar Sync

```
1. OAuth Connection
   → User signs in with Google
   → Scopes: calendar.readonly + calendar.events
   → OAuthAccount created with tokens

2. Fetch Availability
   → GET /api/candidate/busy
   → Calls Google Calendar API freebusy
   → Returns next 30 days of busy times

3. Merge Availability
   → Combines Google Calendar busy times
   → With manual Availability preferences
   → Applies timezone conversions

4. Display to Professional
   → GET /api/bookings/[id]/viewAvailabilities
   → Shows merged free slots in 30-min blocks
```

---

## Testing

### Test Framework

- **Vitest 3.2.4** for both unit and E2E tests

### Test Files

```
tests/
├── availability.test.ts      # Availability slot logic
├── cancellations.test.ts     # Cancellation policy edge cases
├── qc-gating.test.ts         # QC validation and payout gating
├── zoom.test.ts              # Zoom integration
└── e2e/
    └── flow.test.ts          # Full booking flow E2E
```

### Running Tests

```bash
# All tests
npm run test

# E2E tests only
npm run test:e2e

# Watch mode (during development)
npx vitest
```

### Test Coverage Areas

- ✅ Cancellation policy (3-hour window)
- ✅ QC validation rules
- ✅ Payout gating logic
- ✅ Availability slot management
- ✅ Timezone conversions
- ✅ Zoom meeting creation
- ✅ Full booking flow (request → checkout → confirm)

### Mocking External Services

Tests mock:
- Stripe API calls
- Zoom API calls
- Google Calendar API
- Email sending (Nodemailer)

---

## Code Patterns

### Singleton Pattern (Prisma Client)

**File**: `/lib/core/db.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma;
```

**Why**: Prevents multiple Prisma instances during hot reload in development

### Service Layer Pattern

Business logic is isolated in `/lib/*` utilities, not in API routes.

**Example**: Payment processing logic in `/lib/integrations/stripe/index.ts`

```typescript
// ❌ BAD: Logic in API route
export async function POST(req: Request) {
  const { amount } = await req.json();
  const fee = amount * 0.2;
  const intent = await stripe.paymentIntents.create({...});
  // ...
}

// ✅ GOOD: Logic in service layer
// /lib/integrations/stripe/index.ts
export async function createPaymentIntent(bookingId: string) {
  const booking = await prisma.booking.findUnique({...});
  const fee = booking.price * 0.2;
  const intent = await stripe.paymentIntents.create({...});
  return intent;
}

// /api/bookings/[id]/checkout/route.ts
export async function POST(req: Request, { params }) {
  const intent = await createPaymentIntent(params.id);
  return Response.json({ clientSecret: intent.client_secret });
}
```

### Factory Pattern (Stripe Resources)

Helper functions create consistent Stripe resources:

```typescript
export function createDestinationCharge(
  amount: number,
  professionalStripeId: string,
  platformFee: number
) {
  return {
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    transfer_data: {
      destination: professionalStripeId,
      amount: Math.round((amount - platformFee) * 100),
    },
  };
}
```

### Observer Pattern (Webhooks)

**Stripe Webhook**: `/api/stripe/webhook/route.ts`

Listens for events:
- `payment_intent.succeeded`
- `transfer.created`
- `account.updated`

### Timezone Handling Pattern

**Every temporal field includes timezone**:

```typescript
type TimeSlot = {
  start: Date;
  end: Date;
  timezone: string; // IANA timezone
};
```

**Conversion utilities** in `/lib/utils/timezones.ts`:

```typescript
import { formatInTimeZone } from 'date-fns-tz';

export function convertToUserTimezone(date: Date, timezone: string) {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd HH:mm:ssXXX');
}
```

### Feature Flag Pattern

**File**: `/lib/core/flags.ts`

```typescript
export const flags = {
  FEATURE_LINKEDIN_ENHANCED: process.env.FEATURE_LINKEDIN_ENHANCED === 'true',
  FEATURE_SUCCESS_FEE: process.env.FEATURE_SUCCESS_FEE !== 'false',
  FEATURE_QC_LLM: process.env.FEATURE_QC_LLM !== 'false',
};
```

**Usage in code**:

```typescript
import { flags } from '@/lib/core/flags';

if (flags.FEATURE_SUCCESS_FEE) {
  // Apply success fee logic
}
```

### Rate Limiting Pattern

**In-memory rate limiter** for development:

```typescript
const rateLimit = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(identifier: string, limit: number = 10) {
  const now = Date.now();
  const record = rateLimit.get(identifier);

  if (!record || record.resetAt < now) {
    rateLimit.set(identifier, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
```

---

## Common Tasks

### Adding a New API Endpoint

1. Create route file: `/src/app/api/your-endpoint/route.ts`
2. Add session validation:
   ```typescript
   import { auth } from '@/auth';

   export async function GET(request: Request) {
     const session = await auth();
     if (!session?.user) {
       return Response.json({ error: 'unauthorized' }, { status: 401 });
     }
     // ...
   }
   ```
3. Add Zod validation if needed
4. Implement business logic in `/lib/*` service layer
5. Return consistent JSON responses
6. Update this CLAUDE.md with new endpoint

### Adding a New Database Model

1. Edit `/prisma/schema.prisma`
2. Add model with required fields:
   ```prisma
   model YourModel {
     id        String   @id @default(cuid())
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     timezone  String   @default("UTC")
     // ... other fields
   }
   ```
3. Create migration:
   ```bash
   npx prisma migrate dev --name add_your_model
   ```
4. Update seed data in `/prisma/seed.ts` if needed
5. Regenerate Prisma client:
   ```bash
   npx prisma generate
   ```

### Adding a New Page

1. Create page file: `/src/app/your-route/page.tsx`
2. Add layout if needed: `/src/app/your-route/layout.tsx`
3. Implement as Server Component by default
4. Add "use client" only if interactive
5. Fetch data in Server Component:
   ```typescript
   import { auth } from '@/auth';
   import { prisma } from '@/lib/core/db';

   export default async function YourPage() {
     const session = await auth();
     const data = await prisma.yourModel.findMany();
     return <div>...</div>;
   }
   ```

### Adding a Background Job

1. Define job in `/lib/queues/index.ts`:
   ```typescript
   export async function addYourJob(data: YourJobData) {
     await yourQueue.add('job-name', data, {
       delay: 1000, // Optional delay in ms
     });
   }
   ```
2. Add worker processor:
   ```typescript
   yourQueue.process('job-name', async (job) => {
     const { data } = job;
     // Process job
   });
   ```
3. Trigger job from API route or other code:
   ```typescript
   import { addYourJob } from '@/lib/queues';
   await addYourJob({ ... });
   ```

### Adding a Feature Flag

1. Add environment variable to `.env`:
   ```
   FEATURE_YOUR_FLAG=true
   ```
2. Add to `/lib/core/flags.ts`:
   ```typescript
   export const flags = {
     // ... existing flags
     FEATURE_YOUR_FLAG: process.env.FEATURE_YOUR_FLAG === 'true',
   };
   ```
3. Use in code:
   ```typescript
   import { flags } from '@/lib/core/flags';

   if (flags.FEATURE_YOUR_FLAG) {
     // New feature code
   }
   ```

### Debugging Common Issues

#### Database Connection Issues

```bash
# Check DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

#### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping
# Expected: PONG

# Check REDIS_URL
echo $REDIS_URL

# View Redis logs
docker compose logs redis
```

#### NextAuth Issues

```bash
# Check AUTH_SECRET is set
echo $AUTH_SECRET

# Clear Next.js cache
npm run clean

# Check session in browser console
console.log(await fetch('/api/auth/session').then(r => r.json()))
```

#### Prisma Type Generation

```bash
# Regenerate Prisma client
npx prisma generate

# If types are stale, restart TypeScript server in VSCode
# CMD/CTRL + Shift + P → "TypeScript: Restart TS Server"
```

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/monet"

# Redis (for BullMQ)
REDIS_URL="redis://localhost:6379"

# NextAuth
AUTH_SECRET="your-secret-key-here"
# or
NEXTAUTH_SECRET="your-secret-key-here"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Platform Fee as decimal (0-1, e.g. 0.2 for 20%)
PLATFORM_FEE=0.2
```

### OAuth Providers

```bash
# Google OAuth (with Calendar scopes)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# LinkedIn OAuth
LINKEDIN_CLIENT_ID="your-client-id"
LINKEDIN_CLIENT_SECRET="your-client-secret"
```

### Zoom Integration

```bash
ZOOM_ACCOUNT_ID="your-account-id"
ZOOM_CLIENT_ID="your-client-id"
ZOOM_CLIENT_SECRET="your-client-secret"
```

### AWS (Email & Storage)

```bash
# SES for Email
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"

# S3 for File Storage
AWS_S3_BUCKET="your-bucket-name"
```

### Feature Flags

```bash
# LinkedIn Enhanced Features (default: false)
FEATURE_LINKEDIN_ENHANCED=false

# Success Fee Module (default: true)
FEATURE_SUCCESS_FEE=true

# LLM-based QC (default: true)
FEATURE_QC_LLM=true
```

### Configuration

```bash
# Call Duration in Minutes (default: 30)
CALL_DURATION_MINUTES=30

# Default Timezone (default: America/New_York)
DEFAULT_TIMEZONE=America/New_York
```

---

## Troubleshooting

### Common Errors

#### "PrismaClientInitializationError: Can't reach database server"

**Cause**: Database not running or DATABASE_URL incorrect

**Solution**:
```bash
# Start Docker Postgres
docker compose up -d postgres

# Or check your DATABASE_URL
echo $DATABASE_URL
```

#### "ECONNREFUSED 127.0.0.1:6379"

**Cause**: Redis not running

**Solution**:
```bash
# Start Docker Redis
docker compose up -d redis

# Or check your REDIS_URL
echo $REDIS_URL
```

#### "Invalid `prisma.model.findUnique()` invocation"

**Cause**: Prisma client out of sync with schema

**Solution**:
```bash
npx prisma generate
```

#### "Error: No session found"

**Cause**: User not authenticated or AUTH_SECRET mismatch

**Solution**:
1. Check AUTH_SECRET is consistent
2. Clear browser cookies
3. Sign in again

#### "Stripe: No such payment_intent"

**Cause**: Payment intent not created or expired

**Solution**:
1. Check Stripe dashboard for payment intent
2. Ensure `/api/bookings/[id]/checkout` was called first
3. Payment intents expire after 24 hours

### Performance Issues

#### Slow Database Queries

1. Check for missing indexes in schema
2. Use Prisma's query logging:
   ```typescript
   const prisma = new PrismaClient({
     log: ['query', 'info', 'warn', 'error'],
   });
   ```
3. Consider using `ListingCardView` for complex joins

#### High Memory Usage

1. Check for memory leaks in background jobs
2. Limit batch sizes in queue processors
3. Use pagination for large data sets

### Debugging Tools

```bash
# Prisma Studio (Database GUI)
npx prisma studio

# View Redis Queue Jobs
# Install BullMQ CLI
npm install -g bullmq-cli
bullmq-cli list qc

# View Logs
docker compose logs -f app
docker compose logs -f worker

# Check Next.js Build
npm run build
# Look for errors or warnings
```

---

## Important Files Reference

### Authentication
- `/src/auth.ts` - NextAuth configuration
- `/src/middleware.ts` - Auth middleware
- `/lib/core/api-helpers.ts` - API authentication and authorization helpers

### Database
- `/lib/core/db.ts` - Prisma client singleton
- `/prisma/schema.prisma` - Database schema
- `/prisma/seed.ts` - Seed data

### Payments
- `/lib/integrations/stripe/index.ts` - Stripe utilities
- `/api/stripe/webhook/route.ts` - Stripe webhook handler

### Background Jobs
- `/lib/queues/index.ts` - BullMQ queues and workers
- `/scripts/dev-queue.ts` - Queue worker entry point

### Calendar Integration
- `/lib/integrations/calendar/google.ts` - Google Calendar API
- `/lib/utils/timezones.ts` - Timezone utilities

### Configuration
- `/lib/core/flags.ts` - Feature flags
- `/.env` - Environment variables (gitignored)
- `/.env.example` - Environment template

### Testing
- `/tests/*.test.ts` - Unit tests
- `/tests/e2e/*.test.ts` - E2E tests

---

## Git Workflow

### Branch Strategy

- **Main Branch**: Production-ready code
- **Feature Branches**: `feature/description` or `fix/description`
- **Claude Branches**: Auto-generated `claude/claude-md-*` branches

### Before Committing

1. Run tests: `npm run test`
2. Check TypeScript: `npm run build`
3. Review changes: `git diff`

### Commit Process

```bash
# Stage changes
git add <files>

# Commit with descriptive message
git commit -m "Verb subject description"

# Push to remote
git push -u origin <branch-name>
```

### Pull Request Guidelines

1. Ensure tests pass
2. Update CLAUDE.md if adding new features
3. Reference any related issues
4. Request review from team

---

## Additional Resources

### Documentation
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://authjs.dev)
- [Stripe Connect Guide](https://stripe.com/docs/connect)
- [BullMQ Documentation](https://docs.bullmq.io)

### Internal Docs
- `/docs/ARCHITECTURE.md` - System architecture
- `/docs/QC_RUBRIC.md` - Quality control rules
- `/docs/Monet.postman_collection.json` - API testing collection
- `/README.md` - Quick start guide

### Getting Help

1. Check this CLAUDE.md first
2. Review existing code for patterns
3. Check test files for examples
4. Consult external documentation
5. Review recent commits for similar changes

---

## AI Assistant Guidelines

### When Making Changes

1. ✅ **Always read relevant files first** before making changes
2. ✅ **Follow existing patterns** in the codebase
3. ✅ **Update tests** when changing functionality
4. ✅ **Use TypeScript strictly** - no `any` types
5. ✅ **Validate inputs** with Zod schemas
6. ✅ **Handle errors** gracefully with try/catch
7. ✅ **Update this CLAUDE.md** when adding significant features

### Code Quality Checklist

- [ ] TypeScript types are explicit (no `any`)
- [ ] Errors are caught and handled
- [ ] API routes validate sessions
- [ ] Request bodies are validated with Zod
- [ ] Database queries use Prisma
- [ ] Timezone is handled correctly
- [ ] Tests are updated/added
- [ ] Feature flags are used for optional features
- [ ] Secrets are in environment variables (not hardcoded)

### Security Checklist

- [ ] Session validation on all protected routes
- [ ] SQL injection prevented (using Prisma)
- [ ] XSS prevented (React escapes by default)
- [ ] CSRF protection (NextAuth handles this)
- [ ] Sensitive data not logged
- [ ] Rate limiting on sensitive endpoints
- [ ] Stripe webhooks verify signatures

### Performance Checklist

- [ ] Database queries are indexed
- [ ] Use SQL views for complex joins
- [ ] Pagination for large datasets
- [ ] Background jobs for long-running tasks
- [ ] Caching where appropriate
- [ ] Image optimization (Next.js handles this)

---

## Changelog

### 2025-11-17 - API Routes Reorganization
- Reorganized `/src/app/api` directory by user role:
  - `api/professional/` - Professional-specific endpoints (bookings actions, feedback submission, Stripe onboarding)
  - `api/candidate/` - Candidate-specific endpoints (booking requests, professional discovery, checkout)
  - `api/shared/` - Shared/common endpoints (payments, Stripe, verification, QC, reviews)
  - `api/auth/` - Authentication endpoints (kept at root for NextAuth compatibility)
  - `api/admin/` - Admin endpoints (unchanged)
- Moved 25+ API route files to new organized structure
- Updated all frontend fetch() calls to new API paths
- Updated all relative imports in API routes to use @/lib aliases
- Improved API discoverability and role-based access clarity

### 2025-11-17 - Folder Structure Reorganization
- Reorganized `/lib` directory by role and responsibility:
  - `lib/professional/` - Professional-specific business logic
  - `lib/candidate/` - Candidate-specific business logic (reserved for future use)
  - `lib/shared/` - Shared business logic (bookings, availability, QC, audit)
  - `lib/integrations/` - Third-party service integrations (Stripe, Zoom, Google Calendar, Email, S3)
  - `lib/core/` - Core infrastructure (db, api-helpers, flags, rate-limit, admin-export)
  - `lib/utils/` - Pure utilities (date, timezones, profileOptions)
- Reorganized `/src/components` by domain:
  - `components/bookings/` - Booking-related components
  - `components/feedback/` - Feedback components
  - `components/profile/` - Profile components
  - `components/dashboard/` - Dashboard components
  - `components/ui/` - Shared UI primitives
- Updated all import paths across the codebase
- Improved code discoverability and maintainability

### 2025-11-17 - Initial Version
- Created comprehensive CLAUDE.md
- Documented all major systems and patterns
- Added troubleshooting guides
- Included code examples and conventions

---

**End of CLAUDE.md**

This document should be updated whenever significant architectural changes, new patterns, or major features are added to the codebase.
