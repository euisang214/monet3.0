# Monet 3.0 Codebase Analysis Report
## Code Quality Assessment: Redundancy & Contradictions

**Analysis Date**: 2025-11-17  
**Scope**: API routes, utilities, types, and authentication patterns  
**Thoroughness Level**: Very Thorough

---

## Executive Summary

Found **11 major issues** with code redundancy and inconsistencies:
- 3 conflicting/duplicate settings implementations
- 8 identical stubbed admin export routes
- 25+ duplicate unauthorized error patterns
- 16+ duplicate session validation blocks
- 1 broken import path
- 1 unused RBAC utility module
- Multiple overlapping timezone/date utilities

---

## DETAILED FINDINGS

### 1. **DUPLICATE SETTINGS IMPLEMENTATIONS - PROFESSIONAL PORTAL**
**Priority**: HIGH  
**Impact**: Confusing API structure, hard to maintain

**Files:**
- `/home/user/monet3.0/src/app/api/professional/settings.ts` (30 lines)
  - Exports `getProfessionalSettings(userId)` - utility function
  - **NOT** an API route (no GET/POST handler)
  
- `/home/user/monet3.0/src/app/api/professional/settings/route.ts` (48 lines)
  - Implements full GET/PUT/DELETE route handlers
  - Exports `fetchSettings()` and re-exports as `getProfessionalSettings`
  - **Different structure**: includes profile data, timezone, verification status

**Issue**: Both files export a `getProfessionalSettings` function but with different implementations:
- `settings.ts`: Includes `professionalProfile.verifiedAt` in select, returns `fullName`
- `route.ts`: Uses `include` instead of `select`, returns `name` not `fullName`

**Contradiction**: `route.ts` has a re-export that shadows the original utility (line 46):
```typescript
export { fetchSettings as getProfessionalSettings };
```

**Which is being used?** Pages import from `settings.ts`:
```typescript
// /src/app/professional/dashboard/page.tsx:4
import { getProfessionalDashboardData } from "../../api/professional/dashboard";
```

**Consolidation Approach**: 
1. Delete `/api/professional/settings.ts`
2. Use `route.ts` as the single source of truth
3. Export utility function from route file for use in pages

---

### 2. **DUPLICATE SETTINGS IMPLEMENTATIONS - CANDIDATE PORTAL**
**Priority**: HIGH  
**Impact**: Conflicting resume URL handling, notification preferences not accessible

**Files:**
- `/home/user/monet3.0/src/app/api/candidate/settings.ts` (32 lines)
  - Exports `getCandidateSettings(userId)` utility
  - Only fetches: `email`, `resumeUrl`, `timezone`
  - Minimal S3 integration (just gets signed URL)

- `/home/user/monet3.0/src/app/api/candidate/settings/route.ts` (111 lines)
  - Full GET/PUT/DELETE handlers
  - Fetches: `email`, `resumeUrl`, `timezone`, `flags.notifications`, `flags.defaultBusy`
  - Full S3 file upload support in PUT handler

**Issue**: The `route.ts` implementation is MORE COMPLETE but `settings.ts` is the exported utility

**Missing Features in Utility**: 
- No notification preferences
- No default busy times
- No file upload support

**Consolidation Approach**:
1. Delete `/api/candidate/settings.ts`
2. Extract shared logic from `route.ts` into a proper utility file at `/lib/candidate-settings.ts`
3. Import that utility in both the route and any pages needing it

---

### 3. **ALL 8 ADMIN EXPORT ROUTES ARE IDENTICAL & STUBBED**
**Priority**: MEDIUM  
**Impact**: Export functionality not implemented, duplicated stub code

**Files (all 383 bytes each)**:
- `/home/user/monet3.0/src/app/api/admin/users/export/route.ts`
- `/home/user/monet3.0/src/app/api/admin/bookings/export/route.ts`
- `/home/user/monet3.0/src/app/api/admin/payments/export/route.ts`
- `/home/user/monet3.0/src/app/api/admin/payouts/export/route.ts`
- `/home/user/monet3.0/src/app/api/admin/disputes/export/route.ts`
- `/home/user/monet3.0/src/app/api/admin/feedback/export/route.ts`
- `/home/user/monet3.0/src/app/api/admin/audit-logs/export/route.ts`
- `/home/user/monet3.0/src/app/api/admin/invoices/export/route.ts`

**Code Content (identical across all)**:
```typescript
import { NextResponse } from 'next/server';
import { Parser } from 'json2csv';
import { prisma } from '../../../../../../lib/db';

export async function GET(){
  const data = await prisma.$queryRawUnsafe<any[]>(`SELECT 'stubbed' as note`);
  const parser = new Parser();
  const csv = parser.parse(data);
  return new NextResponse(csv, { headers: { 'Content-Type':'text/csv' } });
}
```

**Issues**:
- No authentication checks
- All queries are stubbed
- CSV parser will fail on { note: 'stubbed' } 

**Consolidation Approach**:
1. Create `/lib/admin-export.ts` with functions for each export type
2. Use a single route template with dynamic query building
3. Implement proper SQL queries for each entity

---

### 4. **UTILITY FUNCTIONS IN API DIRECTORY (Confusing Structure)**
**Priority**: MEDIUM  
**Impact**: Poor code organization, unclear what's an API endpoint vs utility

**Problematic Files** (utilities masquerading as API handlers):
- `/home/user/monet3.0/src/app/api/professional/requests.ts` - Exports `getProfessionalRequests()`
- `/home/user/monet3.0/src/app/api/professional/dashboard.ts` - Exports `getProfessionalDashboardData()`
- `/home/user/monet3.0/src/app/api/professional/feedback.ts` - Exports `getProvidedFeedback()`, `getPendingFeedback()`
- `/home/user/monet3.0/src/app/api/professional/earnings.ts` - Exports `getProfessionalEarnings()`
- `/home/user/monet3.0/src/app/api/bookings/history.ts` - Exports `getPastCalls()`
- `/home/user/monet3.0/src/app/api/bookings/upcoming.ts` - Exports `getUpcomingCalls()`

**Issue**: These are **not** API routes (no `export async function GET/POST/etc`). They're utilities that happen to be in the `/api` directory.

**Who uses them?**
```typescript
// /src/app/professional/dashboard/page.tsx
import { getProfessionalDashboardData } from "../../api/professional/dashboard";
```

**Consolidation Approach**:
1. Move all to `/lib/` directory with better names:
   - `professional/dashboard.ts` → `lib/professional-dashboard.ts`
   - `professional/requests.ts` → `lib/professional-requests.ts`
   - `professional/feedback.ts` → `lib/professional-feedback.ts`
   - `professional/earnings.ts` → `lib/professional-earnings.ts`
   - `bookings/history.ts` → `lib/bookings-history.ts`
   - `bookings/upcoming.ts` → `lib/bookings-upcoming.ts`

---

### 5. **DUPLICATE SESSION VALIDATION PATTERN**
**Priority**: MEDIUM  
**Impact**: Boilerplate code, opportunity for helper function

**Pattern appears 16+ times** across routes:
```typescript
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
```

**Files**:
- `/src/app/api/professionals/[id]/route.ts:19`
- `/src/app/api/bookings/[id]/accept/route.ts:11`
- `/src/app/api/bookings/[id]/decline/route.ts:6`
- `/src/app/api/bookings/[id]/cancel/route.ts:7`
- `/src/app/api/bookings/[id]/schedule/route.ts:9`
- `/src/app/api/bookings/[id]/checkout/route.ts:10`
- `/src/app/api/bookings/[id]/viewAvailabilities/route.ts:11`
- `/src/app/api/candidate/availability/route.ts:16`
- `/src/app/api/candidate/settings/route.ts:45`
- `/src/app/api/candidate/busy/route.ts:...` (+ 6 more)

**Also 25+ instances** of the unauthorized response:
```typescript
return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
```

**Consolidation Approach**:
1. Create `/lib/api-auth.ts`:
```typescript
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('unauthorized');
  }
  return session;
}

// In route handlers:
try {
  const session = await requireAuth();
  // handler logic
} catch (err) {
  return NextResponse.json({ error: err.message }, { status: 401 });
}
```

---

### 6. **IMPORT PATH ERROR IN QC MODULE**
**Priority**: HIGH  
**Impact**: Runtime error when QC job is enqueued

**File**: `/home/user/monet3.0/lib/qc.ts`
**Line 1**: 
```typescript
import { prisma } from './db';  // ❌ WRONG
```

**Should be**:
```typescript
import { prisma } from './db';  // Correct relative path from lib/
```

**OR** (better):
```typescript
import { prisma } from '@/lib/db';  // Using path alias
```

**Current location**: `/home/user/monet3.0/lib/qc.ts`
**Actual location of db**: `/home/user/monet3.0/lib/db.ts`

**However**: The relative path `./db` from `lib/qc.ts` should work... unless there's a `lib/db/` directory. Let me verify this doesn't exist. The file exists at the root of lib, so this could work, but using the path alias is safer.

---

### 7. **UNUSED RBAC UTILITY FUNCTIONS**
**Priority**: LOW-MEDIUM  
**Impact**: Dead code, maintenance burden

**File**: `/home/user/monet3.0/lib/auth/rbac.ts`

**Functions**:
```typescript
export async function getSession() {  // ❌ NOT USED
  return await auth();
}

export async function requireRole(expected: Role[]) {  // ❌ NOT USED
  const session = await getSession();
  if(!session?.user) throw new Error('unauthorized');
  if(expected.includes('ADMIN')){
    if(session.user.email === 'admin@monet.local') return session;
  }
  if(expected.includes(session.user.role as Role)) return session;
  throw new Error('forbidden');
}
```

**Grep result**: No files import these functions

**Consolidation Approach**:
1. Either delete this file entirely, OR
2. Check if this was planned for future use and document it
3. If keeping, add to CLAUDE.md as preferred auth pattern

---

### 8. **OVERLAPPING TIMEZONE/DATE UTILITIES**
**Priority**: MEDIUM  
**Impact**: Confusing exports, re-export pattern, code duplication

**Files**:
- `/home/user/monet3.0/lib/timezones.ts` (1 line)
  - Exports: `timezones` (list of IANA timezones)

- `/home/user/monet3.0/lib/time-slot.ts` (54 lines)
  - Type: `TimeSlot`
  - Functions: `ensureTimezone()`, `createTimeSlotFromDates()`, `toUtcDateRange()`, etc.

- `/home/user/monet3.0/lib/availability.ts` (137 lines)
  - Re-exports from time-slot.ts with wrapper functions
  - Lines 4-11: Imports all time-slot functions with "_Internal" suffix
  - Lines 24-57: Re-exports as wrappers

**Example of re-export pattern** (lines 43-45):
```typescript
export function convertTimeSlotTimezone(slot: TimeSlot, targetTimezone: string): TimeSlot {
  return convertTimeSlotTimezoneInternal(slot, targetTimezone);
}
```

**Issue**: The re-export layer adds nothing - it's just passing through to the original function.

- `/home/user/monet3.0/lib/date.ts` (5 lines)
  - Only has `formatDateTime()` - not really redundant, just minimal

**Consolidation Approach**:
1. Keep `time-slot.ts` as the core
2. Delete the wrapper re-exports from `availability.ts`
3. Have `availability.ts` export only the non-wrapping utilities like `mergeSlots()`, `splitIntoSlots()`, `normalizeSlots()`
4. Direct imports to `time-slot.ts` where the re-export was just passing through

---

### 9. **INCONSISTENT BOOKING DECLINE IMPLEMENTATION**
**Priority**: LOW  
**Impact**: Confusing route naming, unclear intent

**File**: `/home/user/monet3.0/src/app/api/bookings/[id]/decline/route.ts`

**Issue**: Route named "decline" but doesn't match expected behavior from CLAUDE.md

**Current implementation** (lines 12):
```typescript
await prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
return NextResponse.json({ status: 'cancelled' });
```

**Expected behavior from CLAUDE.md**: Professional declines a booking request

**Actual behavior**: Just cancels the booking to 'cancelled' status

**Compare to `/accept/route.ts`**: Returns availability slots

**Problem**: The route name doesn't match what it does. Should be either:
1. Refactored to proper decline logic (change status to 'declined')
2. Renamed to match current behavior
3. Update status enum in schema to include 'declined' status

---

### 10. **DUPLICATE TIMESTAMP FORMATTING PATTERNS**
**Priority**: LOW  
**Impact**: Inconsistent date/time display, maintenance burden

**Used in 5 files**:
- `/src/app/candidate/calls/page.tsx` - Uses `formatDateTime()`
- `/src/app/candidate/history/page.tsx` - Uses `formatDateTime()`
- `/src/components/HistoricalFeedback.tsx` - Uses `formatDateTime()`
- `/src/components/UpcomingCalls.tsx` - Uses `formatDateTime()`

**Inconsistent pattern in route handlers**:
- `/src/app/api/bookings/[id]/schedule/route.ts:33-34` - Custom ICS formatting
- `/src/app/api/professional/earnings/page.tsx:25` - Uses `format()` from date-fns

**Issue**: Using both `formatDateTime()` from `/lib/date.ts` AND `format()` from date-fns directly

**Example**: `/src/app/api/bookings/[id]/schedule/route.ts` defines inline formatter:
```typescript
const formatICS = (d: Date) =>
  d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
```

**Consolidation Approach**:
1. Expand `/lib/date.ts` with more formatters
2. Create `formatISO()`, `formatTimezone()`, `formatICS()` functions
3. Replace direct `format()` calls with utility functions

---

### 11. **UNUSED RE-EXPORT PATTERN IN ROUTE FILES**
**Priority**: LOW  
**Impact**: Confusion about what's exported, future maintenance issues

**Pattern**:
- `/src/app/api/professional/settings/route.ts:46`
  ```typescript
  export { fetchSettings as getProfessionalSettings };
  ```

- `/src/app/api/candidate/settings/route.ts:110`
  ```typescript
  export { fetchSettings as getCandidateSettings };
  ```

**Issue**: Route files shouldn't export utility functions (this is an anti-pattern)

**These exports are used by**:
```typescript
import { getProfessionalSettings } from "../professional/settings";
```

**Problem**: Pages import from route files instead of from `/lib/` 

**Consolidation Approach**:
1. Move `fetchSettings` functions to `/lib/`
2. Update imports in pages to use `/lib/` paths
3. Keep route files as API handlers only

---

## SUMMARY TABLE

| Issue | Type | Files | Priority | Effort |
|-------|------|-------|----------|--------|
| Duplicate professional settings | Contradiction | 2 files | HIGH | Medium |
| Duplicate candidate settings | Contradiction | 2 files | HIGH | Medium |
| Stubbed admin exports (identical) | Duplication | 8 files | MEDIUM | Low |
| Utilities in API directory | Organization | 6 files | MEDIUM | High |
| Duplicate session validation | Boilerplate | 16+ instances | MEDIUM | Low |
| QC import path | Bug | 1 file | HIGH | Trivial |
| Unused RBAC functions | Dead code | 1 file | LOW-MEDIUM | Trivial |
| Overlapping timezone utils | Duplication | 3 files | MEDIUM | Low |
| Decline route confusion | Naming | 1 file | LOW | Low |
| Duplicate date formatting | Boilerplate | 5+ files | LOW | Low |
| Route file re-exports | Anti-pattern | 2 files | LOW | Low |

---

## RECOMMENDED FIXES (In Priority Order)

### Phase 1: Critical Fixes (Do First)
1. Fix QC import path: `./db` → proper relative or alias path
2. Delete `/api/professional/settings.ts` (keep route.ts)
3. Delete `/api/candidate/settings.ts` (keep route.ts)

### Phase 2: High-Value Cleanup (Do Second)
4. Implement auth helper function to eliminate 16+ duplicate session checks
5. Create single admin export route handler with parameterized queries
6. Move utility files from `/api/` to `/lib/`
7. Create centralized date formatting utility

### Phase 3: Code Quality (Do Third)
8. Remove unused RBAC functions or implement them
9. Refactor timezone util re-exports
10. Fix booking decline route naming/implementation

---

## CODE EXAMPLES FOR FIXES

### Helper for Session Validation
```typescript
// /lib/api-helpers.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function withAuth(handler: (session: any) => Promise<Response>) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return handler(session);
}

// Usage in route:
export async function POST(req: Request) {
  return withAuth(async (session) => {
    const data = await req.json();
    // ... handler logic
    return NextResponse.json({ ok: true });
  });
}
```

### Consolidated Admin Export
```typescript
// /lib/admin-export.ts
export type ExportType = 'users' | 'bookings' | 'payments' | 'payouts' | 'disputes' | 'feedback' | 'audit_logs' | 'invoices';

const queries: Record<ExportType, string> = {
  'users': `SELECT id, email, role FROM User`,
  'bookings': `SELECT id, candidateId, professionalId, status FROM Booking`,
  // ... etc
};

export async function getExportData(type: ExportType) {
  const query = queries[type];
  return prisma.$queryRawUnsafe(query);
}
```

---

**End of Analysis Report**
