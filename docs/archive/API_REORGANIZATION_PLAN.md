# API Routes Reorganization Plan

> **Date**: 2025-11-17
> **Goal**: Clearly separate professional, candidate, and shared API routes for better maintainability

---

## Current Issues

1. **Mixed `/api/bookings/*`**: Contains both professional actions (accept/decline) and candidate actions (request/schedule/checkout)
2. **Unclear ownership**: Hard to tell which endpoints are for which user type
3. **Professional discovery mixed**: `/api/professionals/*` used by candidates, but not clearly marked

---

## Proposed API Structure

```
src/app/api/
├── professional/              # Professional-specific endpoints
│   ├── bookings/
│   │   ├── [id]/
│   │   │   ├── accept/       # Professional accepts booking
│   │   │   └── decline/      # Professional declines booking
│   ├── feedback/
│   │   └── [bookingId]/      # Professional submits feedback
│   ├── onboarding/           # Stripe Connect onboarding
│   └── settings/             # Professional settings
│
├── candidate/                # Candidate-specific endpoints
│   ├── bookings/
│   │   ├── request/          # Candidate requests booking
│   │   ├── [id]/
│   │   │   ├── schedule/     # Candidate schedules time
│   │   │   ├── checkout/     # Candidate initiates payment
│   │   │   └── view-availabilities/  # View professional availability
│   ├── professionals/
│   │   ├── search/           # Search/browse professionals
│   │   ├── [id]/             # View professional profile
│   │   └── [id]/reviews/     # View professional reviews
│   ├── profile/
│   │   └── [id]/             # Candidate profile (existing)
│   ├── availability/         # Manage availability (existing)
│   ├── busy/                 # Get busy times from calendar (existing)
│   └── settings/             # Candidate settings (existing)
│
├── shared/                   # Shared/common endpoints (used by both or system)
│   ├── auth/                 # Authentication
│   │   ├── [...nextauth]/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── role/
│   ├── bookings/
│   │   └── [id]/
│   │       └── cancel/       # Either party can cancel
│   ├── payments/
│   │   ├── confirm/          # Confirm payment
│   │   ├── payout/           # Release payout
│   │   └── refund/           # Process refund
│   ├── stripe/
│   │   ├── account/          # Stripe account operations
│   │   ├── intent/           # Create payment intent
│   │   └── webhook/          # Stripe webhook
│   ├── verification/
│   │   ├── request/          # Request email verification
│   │   ├── confirm/          # Confirm verification
│   │   └── status/           # Check verification status
│   ├── qc/
│   │   └── [bookingId]/recheck/  # QC recheck (system)
│   ├── reviews/              # Reviews (shared)
│   └── users/
│       └── list.ts           # User list (shared/admin)
│
├── admin/                    # Admin endpoints (keep as-is)
│   ├── users/export/
│   ├── bookings/export/
│   ├── payments/export/
│   ├── payouts/export/
│   ├── feedback/export/
│   ├── disputes/export/
│   ├── invoices/export/
│   └── audit-logs/export/
│
└── filterOptions.ts          # Shared filter options helper
```

---

## Migration Steps

### Step 1: Create New Directory Structure

Create all the new API route directories.

### Step 2: Move Professional-Specific APIs

**From → To:**
```bash
/api/bookings/[id]/accept        → /api/professional/bookings/[id]/accept
/api/bookings/[id]/decline       → /api/professional/bookings/[id]/decline
/api/feedback/[bookingId]        → /api/professional/feedback/[bookingId]
/api/feedback/validate           → /api/professional/feedback/validate
/api/onboarding                  → /api/professional/onboarding
/api/professional/settings       → /api/professional/settings (no change)
```

### Step 3: Move Candidate-Specific APIs

**From → To:**
```bash
/api/bookings/request            → /api/candidate/bookings/request
/api/bookings/[id]/schedule      → /api/candidate/bookings/[id]/schedule
/api/bookings/[id]/checkout      → /api/candidate/bookings/[id]/checkout
/api/bookings/[id]/viewAvailabilities → /api/candidate/bookings/[id]/view-availabilities
/api/professionals/search        → /api/candidate/professionals/search
/api/professionals/[id]          → /api/candidate/professionals/[id]
/api/professionals/[id]/reviews  → /api/candidate/professionals/[id]/reviews
/api/candidate/[id]              → /api/candidate/profile/[id]
/api/candidate/availability      → /api/candidate/availability (no change)
/api/candidate/busy              → /api/candidate/busy (no change)
/api/candidate/settings          → /api/candidate/settings (no change)
```

### Step 4: Move Shared/Common APIs

**From → To:**
```bash
/api/auth/*                      → /api/shared/auth/* (all routes)
/api/bookings/[id]/cancel        → /api/shared/bookings/[id]/cancel
/api/payments/*                  → /api/shared/payments/* (all routes)
/api/stripe/*                    → /api/shared/stripe/* (all routes)
/api/verification/*              → /api/shared/verification/* (all routes)
/api/qc/*                        → /api/shared/qc/* (all routes)
/api/reviews                     → /api/shared/reviews
/api/users/list.ts               → /api/shared/users/list.ts
```

### Step 5: Keep Admin APIs As-Is

Admin APIs are already well-organized under `/api/admin/*`.

### Step 6: Update All Frontend References

**Search for and update all fetch/axios calls in:**
- All page components in `/src/app/`
- All client components
- All forms
- All API utility functions

**Find patterns:**
```bash
grep -r "fetch.*'/api/" src/
grep -r "fetch.*\`/api/" src/
grep -r "/api/bookings" src/
grep -r "/api/professionals" src/
grep -r "/api/feedback" src/
grep -r "/api/payments" src/
```

**Update examples:**
```typescript
// Before:
fetch('/api/bookings/request', ...)
fetch(`/api/bookings/${id}/accept`, ...)
fetch('/api/professionals/search', ...)

// After:
fetch('/api/candidate/bookings/request', ...)
fetch(`/api/professional/bookings/${id}/accept`, ...)
fetch('/api/candidate/professionals/search', ...)
```

### Step 7: Update CLAUDE.md Documentation

Update all API route references in CLAUDE.md to reflect new structure.

### Step 8: Update NextAuth Configuration

The NextAuth route handler path needs to be updated if we move `/api/auth/[...nextauth]`:

In `src/auth.ts`:
```typescript
// If moving to /api/shared/auth/[...nextauth]
// May need to configure basePath or keep auth at /api/auth/
```

**Recommendation**: Keep `/api/auth/*` at root level for simplicity with NextAuth.

---

## Alternative: Minimal Disruption Approach

Instead of moving all routes, we could use a **hybrid approach**:

1. **Keep existing API structure** for backward compatibility
2. **Add clear comments** indicating which endpoints are for which role
3. **Use middleware** to enforce role-based access
4. **Document clearly** in CLAUDE.md which APIs are for which user type

### Hybrid Structure:
```
src/app/api/
├── auth/                  # Shared (keep as-is)
├── bookings/              # Mixed (keep as-is, add role checks)
│   ├── request/           # [CANDIDATE] Create request
│   ├── [id]/accept/       # [PROFESSIONAL] Accept
│   ├── [id]/decline/      # [PROFESSIONAL] Decline
│   ├── [id]/schedule/     # [CANDIDATE] Schedule
│   ├── [id]/checkout/     # [CANDIDATE] Checkout
│   └── [id]/cancel/       # [BOTH] Cancel
├── professionals/         # Candidate-facing (keep as-is)
├── candidate/             # Candidate-specific (keep as-is)
├── professional/          # Professional-specific (keep as-is)
├── admin/                 # Admin (keep as-is)
└── shared/                # Add new shared utilities
```

---

## Recommendation

**Option A (Full Reorganization):**
- **Pros**: Crystal clear separation, better long-term maintainability
- **Cons**: Breaks all frontend code, requires extensive testing
- **Effort**: High (4-6 hours)

**Option B (Hybrid/Minimal):**
- **Pros**: No breaking changes, faster implementation
- **Cons**: Less clear organization, still some confusion
- **Effort**: Low (30-60 minutes)

**Suggested Approach**: **Option B** - Add clear documentation and role markers without breaking changes.

If you want **Option A**, it's best done:
1. In a separate branch
2. With comprehensive testing
3. As a dedicated refactoring sprint

---

## Files Affected (Full Reorganization)

**API Route Files**: ~40 files
**Frontend Components**: ~50+ files (estimated)
**Total LOC Changes**: ~500-800 lines

---

## Rollback Plan

If going with full reorganization:
1. Git reset to commit before API reorganization
2. Or keep old routes with redirects for backward compatibility
3. Maintain both old and new routes during transition period

---

**Decision Required**: Which approach should we take?
