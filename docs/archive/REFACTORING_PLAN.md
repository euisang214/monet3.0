# Monet 3.0 Refactoring Plan

> **Created**: 2025-11-18
> **Purpose**: Comprehensive plan to resolve redundancy, confusion, and naming issues

---

## Summary of Issues & Fixes

### 🔴 BREAKING CHANGES (Require Database Migration)

#### 1. Add `summary` Field to Feedback Model
**Why**: Missing field that QC LLM should reference
**Impact**: Database migration required
**Risk**: Low (adding nullable field)

```prisma
model Feedback {
  // ... existing fields
  summary String?  // ← ADD THIS: Textual summary for QC LLM
  text    String   // Existing detailed feedback
}
```

**Migration**: Add nullable column, can be populated later

---

#### 2. Rename Models for Clarity
**Why**: Current names are confusing (Feedback vs ProfessionalReview)

| Current Name | New Name | Reason |
|---|---|---|
| `Feedback` | `CallFeedback` | Clarifies it's professional's feedback about the call |
| `ProfessionalReview` | `ProfessionalRating` | Clarifies it's candidate's rating of professional |

**Impact**:
- **Files affected**: 30+ files
- **Database migration**: Requires table rename
- **Risk**: HIGH - Breaking change affects entire codebase
- **Effort**: 4-6 hours

**Migration Strategy**:
```sql
-- Rename tables
ALTER TABLE "Feedback" RENAME TO "CallFeedback";
ALTER TABLE "ProfessionalReview" RENAME TO "ProfessionalRating";

-- Update all foreign key constraints
-- Update all indexes
```

**Code Updates Required**:
- All `prisma.feedback.*` → `prisma.callFeedback.*`
- All `prisma.professionalReview.*` → `prisma.professionalRating.*`
- All imports and type references
- All API routes
- All frontend components
- Test files

---

#### 3. Rename Feedback Field Names
**Why**: Schema and documentation don't match

**Current Schema**:
```prisma
starsCategory1 Int
starsCategory2 Int
starsCategory3 Int
```

**Documented (CLAUDE.md)**:
```typescript
contentRating Int
deliveryRating Int
valueRating Int
```

**Recommendation**: Update schema to match documentation (more descriptive)

**Impact**:
- Database migration required
- Update all forms that submit these fields
- Update all display logic
- **Risk**: MEDIUM - Affects feedback submission flow

---

#### 4. Simplify Availability/Timezone Models

**Option A - Rename & Clarify**:
```prisma
model Availability {
  id       String   @id
  userId   String
  start    DateTime
  end      DateTime
  slotType SlotType  // available | busy | blocked
  source   String?   // 'manual' | 'google' | 'system'
  timezone String    // For display only
}

enum SlotType {
  available
  busy
  blocked
}
```

**Option B - Remove Timezone Field from Most Models**:
Currently, 14+ models have `timezone String @default("UTC")`:
- Remove from: Payment, Payout, Feedback, AuditLog, etc.
- Keep only on: User, Availability

**Impact**:
- **Low risk** if done carefully (most are default UTC anyway)
- Simplifies queries and reduces confusion

---

### 🟡 NON-BREAKING CHANGES (Safe to Deploy)

#### 5. Fix PLATFORM_FEE Logic
**Current**: Ambiguous (0.2 vs 20 for 20% fee)
**Fix**: Use decimal (0-1) consistently + validation

```typescript
// lib/integrations/stripe/index.ts
export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || '0');

// Validation
if (PLATFORM_FEE_PERCENT < 0 || PLATFORM_FEE_PERCENT > 100) {
  throw new Error('PLATFORM_FEE_PERCENT must be between 0 and 100');
}

// Usage
const feeDecimal = PLATFORM_FEE_PERCENT / 100;
const platformFee = Math.round(amount * feeDecimal);
```

**Files to Update**:
- `/lib/integrations/stripe/index.ts`
- `/.env.example`
- `/CLAUDE.md`
- `/tests/setup.ts`

**Impact**: LOW - Backward compatible if done right
**Effort**: 30 minutes

---

#### 6. Remove Duplicate `/candidate/history` Route

**Rationale**: `/candidate/calls` already does everything `/history` does + more

| Feature | /calls | /history |
|---|---|---|
| Shows past calls | ✓ | ✓ |
| Shows future calls | ✓ | ✗ |
| Filters | ✓ | ✗ |
| Feedback button | ✓ | ✓ |
| Status badges | ✓ | ✗ |

**Files to Remove**:
- `/src/app/candidate/history/page.tsx`
- `/src/app/candidate/history/[id]/page.tsx` (feedback detail page)
- `/lib/shared/bookings/history.ts` (if only used by history route)

**Files to Update**:
- Navigation/sidebar links that point to `/candidate/history`
- Any internal links to `/history`

**Impact**: LOW - Can redirect `/history` → `/calls`
**Effort**: 30 minutes

---

#### 7. Rename `/schedule` Endpoint to `/confirm-and-schedule`

**Why**: Current name misleading (does acceptance + scheduling + zoom + emails)

**Changes**:
```typescript
// OLD
POST /api/professional/bookings/[id]/schedule

// NEW
POST /api/professional/bookings/[id]/confirm-and-schedule
```

**Files to Update**:
- `/src/app/api/professional/bookings/[id]/schedule/route.ts` → rename folder to `confirm-and-schedule`
- All frontend forms that call this endpoint
- CLAUDE.md documentation

**Impact**: MEDIUM - Breaking API change for frontend
**Effort**: 1 hour

---

#### 8. Remove `Slot` Type Alias

**Current**:
```typescript
export type TimeSlot = { ... };
export type Slot = TimeSlot; // Unnecessary
```

**Fix**: Remove `Slot`, use only `TimeSlot` everywhere

**Files to Update**:
- `/lib/shared/time-slot.ts` (remove export)
- All files importing `Slot` → change to `TimeSlot`

**Impact**: LOW - Type alias removal
**Effort**: 15 minutes

---

#### 9. Apply Error Helpers Consistently

**Current**: Mix of 3 patterns across API routes
**Fix**: Standardize on error helper functions from `/lib/core/errors.ts`

**Files to Update** (~20 API routes):
- All routes with manual `Response.json({ error: '...' }, { status: ... })`
- Replace with `notFoundError()`, `forbiddenError()`, `validationError()`, etc.

**Impact**: LOW - Internal refactoring only
**Effort**: 2 hours

---

#### 10. Use `formatFullName()` Consistently

**Current**: Some files use helper, some use manual concatenation
**Fix**: Always use `formatFullName(firstName, lastName)` from `/lib/shared/settings.ts`

**Files to Update** (~5-10 files):
- `/src/app/candidate/calls/page.tsx:113-115` (manual concat)
- Any other manual `[firstName, lastName].filter(Boolean).join(' ')`

**Impact**: LOW - Internal cleanup
**Effort**: 30 minutes

---

#### 11. Add Rate Limiting

**Current**: Only on booking requests
**Add to**:
- Feedback submission
- Review submission
- Password reset requests
- Verification email requests

**Files to Update**:
- `/src/app/api/professional/feedback/[bookingId]/route.ts`
- `/src/app/api/shared/reviews/route.ts`
- `/src/app/api/auth/forgot-password/route.ts`
- `/src/app/api/shared/verification/request/route.ts`

**Impact**: LOW - Security improvement
**Effort**: 1 hour

---

#### 12. Document PayoutStatus vs PaymentStatus

**Action**: Add clear explanation to CLAUDE.md

**Content**:
```markdown
### Payment vs Payout Status

**PaymentStatus** (Escrow state - Candidate perspective):
- `held` - Candidate paid, funds in platform escrow
- `released` - Funds transferred to professional
- `refunded` - Funds returned to candidate

**PayoutStatus** (Withdrawal state - Professional perspective):
- `pending` - QC passed, professional can withdraw
- `paid` - Professional received funds
- `blocked` - QC failed or manual block, cannot withdraw

**Important**: Payment can be "released" while payout is "blocked" if QC fails retroactively.

**Flow**:
1. Candidate pays → PaymentStatus = 'held'
2. Call completes + QC passes → PayoutStatus = 'pending' (Payment still 'held')
3. Admin/system releases → PaymentStatus = 'released' + PayoutStatus = 'paid'
```

**Impact**: None - Documentation only
**Effort**: 10 minutes

---

#### 13. Fix CLAUDE.md Field Name Mismatches

**Current Issues**:
- Documents `contentRating`, `deliveryRating`, `valueRating`
- Schema has `starsCategory1`, `starsCategory2`, `starsCategory3`
- Tests use documented (wrong) names

**Options**:
A. Update CLAUDE.md to match schema (quick fix)
B. Update schema to match documentation (requires migration)

**Recommendation**: Do A now, plan B for next migration

**Impact**: None if updating docs only
**Effort**: 15 minutes

---

### 🟢 FUTURE IMPROVEMENTS (Nice to Have)

#### 14. Standardize "Booking" vs "Call" Terminology

**Current**: Inconsistent use of both terms
**Recommendation**: Pick one (suggest "Call" for user-facing, "Booking" for code)

**Scope**:
- Function names: `getPastCalls`, `getUpcomingCalls` → return `Booking[]`
- Keep database model as `Booking` (large refactor to change)
- Use "Calls" in all UI/frontend

**Impact**: HIGH - Affects entire codebase
**Effort**: 8+ hours
**Priority**: LOW - More cosmetic than functional

---

#### 15. Create `/lib/candidate/dashboard.ts`

**Why**: Professional has abstraction, candidate doesn't (inconsistency)
**Action**: Extract candidate dashboard logic from page component

**Impact**: LOW - Internal refactoring
**Effort**: 1 hour

---

#### 16. Split Resume Upload from Settings Endpoint

**Current**: `PUT /api/candidate/settings` updates settings + uploads resume
**Better**: `POST /api/candidate/resume` for resume upload

**Impact**: MEDIUM - Breaking API change
**Effort**: 2 hours

---

## Recommended Implementation Order

### Phase 1: Quick Wins (No Breaking Changes) - ~6 hours
1. ✅ Remove `/candidate/history` route
2. ✅ Fix PLATFORM_FEE logic + validation
3. ✅ Remove `Slot` type alias
4. ✅ Apply error helpers consistently
5. ✅ Use `formatFullName()` consistently
6. ✅ Add rate limiting
7. ✅ Fix CLAUDE.md documentation
8. ✅ Document PayoutStatus vs PaymentStatus

### Phase 2: API Changes (Breaking for Frontend) - ~3 hours
9. ✅ Rename `/schedule` → `/confirm-and-schedule`
10. ✅ Split resume upload endpoint

### Phase 3: Schema Changes (Breaking - Requires Migration) - ~8 hours
11. ⚠️ Add `summary` field to Feedback
12. ⚠️ Rename `starsCategory*` → `*Rating` fields
13. ⚠️ Rename `Feedback` → `CallFeedback`
14. ⚠️ Rename `ProfessionalReview` → `ProfessionalRating`

### Phase 4: Large Refactors (Future)
15. 🔮 Simplify timezone logic (remove from 14+ models)
16. 🔮 Standardize booking/call terminology
17. 🔮 Refactor Availability model structure

---

## Decision Time

**Which phases should we implement now?**

**Recommendation**:
- ✅ Phase 1 (safe, immediate value)
- ⚠️ Phase 2 (coordinate with frontend team)
- ⏸️ Phase 3 (plan for next migration window)
- 🔮 Phase 4 (roadmap for Q1 2026)

**Your choice!** Let me know which fixes to implement.
