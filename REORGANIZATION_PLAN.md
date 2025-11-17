# Monet 3.0 Folder Reorganization Plan

> **Date**: 2025-11-17
> **Goal**: Clearly separate professional, candidate, and shared code for better maintainability

---

## Current Issues

1. **Mixed `/lib` files**: Professional-specific utilities (`professional-*.ts`) mixed with shared utilities
2. **No candidate utilities structure**: Candidate-specific logic scattered or missing
3. **Flat components directory**: All components in one folder without domain organization
4. **Unclear ownership**: Hard to tell at a glance which code serves which user type

---

## Proposed Structure

### 1. `/lib` Reorganization

```
lib/
├── professional/          # Professional-specific business logic
│   ├── dashboard.ts       # (was professional-dashboard.ts)
│   ├── earnings.ts        # (was professional-earnings.ts)
│   ├── feedback.ts        # (was professional-feedback.ts)
│   └── requests.ts        # (was professional-requests.ts)
│
├── candidate/             # Candidate-specific business logic
│   ├── dashboard.ts       # NEW: candidate dashboard logic
│   ├── availability.ts    # Move candidate-specific availability logic here
│   └── search.ts          # NEW: professional search/browse logic
│
├── shared/                # Truly shared business logic
│   ├── bookings/
│   │   ├── history.ts     # (was bookings-history.ts)
│   │   └── upcoming.ts    # (was bookings-upcoming.ts)
│   ├── availability.ts    # Shared availability utilities
│   ├── qc.ts              # Quality control logic
│   ├── audit.ts           # Audit logging
│   └── time-slot.ts       # Time slot utilities
│
├── integrations/          # Third-party service integrations
│   ├── stripe/
│   │   ├── index.ts       # (was payments/stripe.ts)
│   │   └── confirm.ts     # (was payments/confirm.ts)
│   ├── calendar/
│   │   └── google.ts      # (existing)
│   ├── zoom.ts            # (existing)
│   ├── email.ts           # (existing)
│   └── s3.ts              # (existing)
│
├── core/                  # Core infrastructure
│   ├── db.ts              # Prisma client
│   ├── auth.ts            # Auth helpers
│   ├── api-helpers.ts     # API utilities
│   ├── flags.ts           # Feature flags
│   ├── rate-limit.ts      # Rate limiting
│   └── admin-export.ts    # Admin exports
│
└── utils/                 # Pure utilities (no DB/API calls)
    ├── date.ts            # Date utilities
    ├── timezones.ts       # Timezone helpers
    └── profileOptions.ts  # Profile option constants
```

### 2. `/src/components` Reorganization

```
src/components/
├── bookings/              # Booking-related components
│   ├── RequestActions.tsx      # (existing)
│   ├── UpcomingCalls.tsx       # (existing)
│   └── AvailabilityCalendar.tsx # (existing)
│
├── feedback/              # Feedback components
│   └── HistoricalFeedback.tsx  # (existing)
│
├── profile/               # Profile components
│   ├── ProfileDetail.tsx       # (existing)
│   ├── ResumePreview.tsx       # (existing)
│   └── FilterDropdown.tsx      # (existing - for filtering profiles)
│
├── dashboard/             # Dashboard components
│   └── DashboardClient.tsx     # (existing)
│
└── ui/                    # Shared UI primitives
    ├── layouts.tsx             # (existing)
    ├── ui.tsx                  # (existing)
    ├── Pagination.tsx          # (existing)
    └── StatusPopup.tsx         # (existing)
```

### 3. Keep As-Is (Already Well Organized)

```
src/app/
├── candidate/             # ✅ Already clearly candidate-specific
├── professional/          # ✅ Already clearly professional-specific
├── admin/                 # ✅ Already clearly admin-specific
└── api/                   # ✅ Mix is intentional (shared endpoints)
```

---

## Migration Steps

### Step 1: Create New Directory Structure
- [x] Create `/lib/professional/`
- [x] Create `/lib/candidate/`
- [x] Create `/lib/shared/bookings/`
- [x] Create `/lib/integrations/stripe/`
- [x] Create `/lib/core/`
- [x] Create `/lib/utils/`
- [x] Create `/src/components/bookings/`
- [x] Create `/src/components/feedback/`
- [x] Create `/src/components/profile/`
- [x] Create `/src/components/dashboard/`
- [x] Create `/src/components/ui/`

### Step 2: Move `/lib` Files

**Professional-specific:**
```bash
lib/professional-dashboard.ts    → lib/professional/dashboard.ts
lib/professional-earnings.ts     → lib/professional/earnings.ts
lib/professional-feedback.ts     → lib/professional/feedback.ts
lib/professional-requests.ts     → lib/professional/requests.ts
```

**Shared bookings:**
```bash
lib/bookings-history.ts          → lib/shared/bookings/history.ts
lib/bookings-upcoming.ts         → lib/shared/bookings/upcoming.ts
```

**Shared utilities:**
```bash
lib/availability.ts              → lib/shared/availability.ts
lib/qc.ts                        → lib/shared/qc.ts
lib/audit.ts                     → lib/shared/audit.ts
lib/time-slot.ts                 → lib/shared/time-slot.ts
```

**Integrations:**
```bash
lib/payments/stripe.ts           → lib/integrations/stripe/index.ts
lib/payments/confirm.ts          → lib/integrations/stripe/confirm.ts
lib/calendar/google.ts           → lib/integrations/calendar/google.ts
lib/zoom.ts                      → lib/integrations/zoom.ts
lib/email.ts                     → lib/integrations/email.ts
lib/s3.ts                        → lib/integrations/s3.ts
```

**Core:**
```bash
lib/db.ts                        → lib/core/db.ts
lib/api-helpers.ts               → lib/core/api-helpers.ts
lib/flags.ts                     → lib/core/flags.ts
lib/rate-limit.ts                → lib/core/rate-limit.ts
lib/admin-export.ts              → lib/core/admin-export.ts
```

**Utils:**
```bash
lib/date.ts                      → lib/utils/date.ts
lib/timezones.ts                 → lib/utils/timezones.ts
lib/profileOptions.ts            → lib/utils/profileOptions.ts
```

**Keep as-is:**
```bash
lib/queues/index.ts              → lib/queues/index.ts (no change)
```

### Step 3: Move `/src/components` Files

**Bookings:**
```bash
src/components/RequestActions.tsx       → src/components/bookings/RequestActions.tsx
src/components/UpcomingCalls.tsx        → src/components/bookings/UpcomingCalls.tsx
src/components/AvailabilityCalendar.tsx → src/components/bookings/AvailabilityCalendar.tsx
```

**Feedback:**
```bash
src/components/HistoricalFeedback.tsx   → src/components/feedback/HistoricalFeedback.tsx
```

**Profile:**
```bash
src/components/ProfileDetail.tsx        → src/components/profile/ProfileDetail.tsx
src/components/ResumePreview.tsx        → src/components/profile/ResumePreview.tsx
src/components/FilterDropdown.tsx       → src/components/profile/FilterDropdown.tsx
```

**Dashboard:**
```bash
src/components/DashboardClient.tsx      → src/components/dashboard/DashboardClient.tsx
```

**UI:**
```bash
src/components/layouts.tsx              → src/components/ui/layouts.tsx
src/components/ui.tsx                   → src/components/ui/ui.tsx
src/components/Pagination.tsx           → src/components/ui/Pagination.tsx
src/components/StatusPopup.tsx          → src/components/ui/StatusPopup.tsx
```

### Step 4: Update All Imports

After moving files, update all imports across:
- `/src/app/**/*.tsx` (all pages)
- `/src/app/api/**/*.ts` (all API routes)
- `/lib/**/*.ts` (cross-lib references)
- `/src/components/**/*.tsx` (component cross-references)
- `/src/auth.ts`
- `/src/middleware.ts`

**Example import changes:**
```typescript
// Before:
import { getDashboard } from '@/lib/professional-dashboard'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/payments/stripe'

// After:
import { getDashboard } from '@/lib/professional/dashboard'
import { prisma } from '@/lib/core/db'
import { stripe } from '@/lib/integrations/stripe'
```

### Step 5: Update Path Aliases (Optional Enhancement)

Consider adding more specific path aliases to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/lib/professional/*": ["./lib/professional/*"],
      "@/lib/candidate/*": ["./lib/candidate/*"],
      "@/lib/shared/*": ["./lib/shared/*"],
      "@/lib/integrations/*": ["./lib/integrations/*"],
      "@/lib/core/*": ["./lib/core/*"],
      "@/lib/utils/*": ["./lib/utils/*"],
      "@/components/bookings/*": ["./src/components/bookings/*"],
      "@/components/feedback/*": ["./src/components/feedback/*"],
      "@/components/profile/*": ["./src/components/profile/*"],
      "@/components/ui/*": ["./src/components/ui/*"]
    }
  }
}
```

### Step 6: Validate Changes

- [ ] Run TypeScript compiler: `npm run build`
- [ ] Run tests: `npm run test`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Manual testing:
  - [ ] Candidate dashboard loads
  - [ ] Professional dashboard loads
  - [ ] Admin portal loads
  - [ ] Booking flow works
  - [ ] Feedback submission works

### Step 7: Update Documentation

- [ ] Update `/CLAUDE.md` with new directory structure
- [ ] Update `/README.md` if it references file paths
- [ ] Add migration notes for other developers

### Step 8: Clean Up

- [ ] Remove old empty directories (`lib/payments`, `lib/calendar`)
- [ ] Verify no broken imports with: `npx tsc --noEmit`
- [ ] Remove this reorganization plan file

---

## Benefits After Reorganization

✅ **Clarity**: Immediately clear which code serves which user type
✅ **Maintainability**: Easier to find and update role-specific logic
✅ **Scalability**: New features naturally fit into organized structure
✅ **Onboarding**: New developers understand codebase faster
✅ **Separation of Concerns**: Business logic clearly separated from integrations

---

## Risks & Mitigations

**Risk**: Breaking imports across large codebase
**Mitigation**: Use find-and-replace with exact patterns; run TypeScript compiler frequently

**Risk**: Merge conflicts if other branches are active
**Mitigation**: Coordinate with team; do reorganization in dedicated session

**Risk**: Missing imports in dynamic imports or non-TS files
**Mitigation**: Test all portals manually; grep for old import patterns

---

## Rollback Plan

If issues arise:
1. Git reset to commit before reorganization: `git reset --hard HEAD~1`
2. Or revert specific commit: `git revert <commit-hash>`
3. All changes are in single atomic commit for easy rollback

---

**Ready to execute**: All steps documented. Proceed with Step 1.
