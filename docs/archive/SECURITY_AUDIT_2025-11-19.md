# Security Audit Report: Monet 3.0 Authentication & Authorization

**Date**: 2025-11-19  
**Severity Assessment**: CRITICAL issues found  
**Total Issues Found**: 18

---

## CRITICAL SEVERITY ISSUES

### 1. Unrestricted Professional Account Registration
**File**: `/home/user/monet3.0/src/app/api/auth/signup/route.ts`  
**Lines**: 11, 23  
**Severity**: CRITICAL  

**Description**:
Users can sign up directly as PROFESSIONAL without any verification or approval process. The endpoint accepts both 'CANDIDATE' and 'PROFESSIONAL' roles without any gating or validation.

```typescript
// Line 11 - No restrictions on role selection
role: z.enum(['CANDIDATE', 'PROFESSIONAL'])

// Line 23 - Directly creates user with requested role
await prisma.user.create({ data: { email, hashedPassword, role } });
```

**Impact**:
- Anyone can create a professional account and receive client bookings
- Attackers can impersonate legitimate professionals
- No corporate email verification or background checks
- Complete access to professional portal immediately after signup
- Ability to receive and process payments from candidates

**Risk**: HIGH - Fundamentally breaks the professional vetting system  
**Suggested Fix**:
- Only allow CANDIDATE role during signup
- Require separate professional onboarding endpoint with email verification
- Require corporate email verification before professional profile creation
- Add admin approval workflow for new professionals

---

### 2. Unauthenticated Candidate Profile Exposure
**File**: `/home/user/monet3.0/src/app/api/candidate/profile/[id]/route.ts`  
**Lines**: 5-43  
**Severity**: CRITICAL  

**Description**:
Candidate profiles are publicly accessible without authentication. Full personal information including email, resume URL, education, and experience can be accessed by anyone who knows the user ID.

```typescript
// No auth() call, no ownership check
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Directly returns all profile data
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { candidateProfile: { ... } },
  });
  
  const payload: any = {
    identity: {
      name: formatFullName(user.firstName, user.lastName) || undefined,
      email: user.email,  // EXPOSED
    },
    resumeUrl: profile.resumeUrl,  // EXPOSED
    // ... all personal data exposed
  };
```

**Impact**:
- Privacy violation: exposing personal information (email, resume, education, experience)
- Information disclosure for all candidates in system
- Enables targeted phishing/social engineering attacks
- Violates user privacy expectations
- Potential GDPR/privacy law violations

**Risk**: CRITICAL - Exposes PII  
**Suggested Fix**:
- Add `requireAuth()` check at function start
- Only allow candidates to view their own profile: `if (params.id !== session.user.id) return forbiddenError()`
- Or require authentication + specific relationship (booking) to view

---

### 3. User Role Enumeration - Unrestricted Access
**File**: `/home/user/monet3.0/src/app/api/auth/role/route.ts`  
**Lines**: 5-17  
**Severity**: CRITICAL  

**Description**:
The `/api/auth/role` endpoint reveals the role of ANY user given their email address, with no authentication required. This allows attackers to enumerate all professionals in the system.

```typescript
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  // No auth check, directly queries and returns role
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { role: true }
  });
  return NextResponse.json({ role: user?.role ?? null });
}
```

**Impact**:
- Information disclosure: reveals professional vs candidate status for any email
- Allows enumeration of all system emails and their roles
- Can be used to identify professionals for targeted attacks
- Violates user privacy

**Risk**: HIGH - Information enumeration  
**Suggested Fix**:
- Remove this endpoint or restrict to authenticated users
- If needed for legitimate purpose, require authentication
- Never expose role information without proper authorization

---

### 4. Unauthenticated QC Recheck Endpoint
**File**: `/home/user/monet3.0/src/app/api/shared/qc/[bookingId]/recheck/route.ts`  
**Lines**: 3-7  
**Severity**: CRITICAL  

**Description**:
The QC recheck endpoint accepts requests without any authentication. Any user can trigger QC validation for any booking ID.

```typescript
export async function POST(_: Request, { params }:{params:{bookingId:string}}){
  // NO AUTH CHECK - anyone can call this
  const { enqueueFeedbackQC } = await import('@/lib/queues');
  await enqueueFeedbackQC(params.bookingId);
  return NextResponse.json({ ok: true });
}
```

**Impact**:
- Can trigger unlimited QC processing on any booking
- Potential denial of service via queue flooding
- Allows unauthorized manipulation of feedback validation workflow
- No audit trail of who triggered recheck

**Risk**: HIGH - Workflow manipulation & DoS  
**Suggested Fix**:
- Add `requireRole(['ADMIN'])` or `withAuth()` wrapper
- Validate that requester is admin, professional, or candidate involved in booking
- Limit recheck frequency per booking

---

## HIGH SEVERITY ISSUES

### 5. Hardcoded Default AUTH_SECRET
**File**: `/home/user/monet3.0/src/auth.ts`  
**Line**: 18  
**Severity**: HIGH  

**Description**:
If `AUTH_SECRET` and `NEXTAUTH_SECRET` environment variables are not set, the system falls back to a hardcoded development secret `'dev-secret'`.

```typescript
secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret',
```

**Impact**:
- If deployed without setting the secret environment variable, all JWT tokens use a known value
- Attackers could forge session tokens
- Complete authentication bypass if secret is exposed
- Violates security best practices

**Risk**: HIGH - Authentication bypass in production  
**Suggested Fix**:
- Remove the default fallback entirely
- Throw an error if neither variable is set
- Require explicit secret configuration for production

---

### 6. Weak Email Verification Token Generation
**File**: `/home/user/monet3.0/src/app/api/shared/verification/request/route.ts`  
**Line**: 8  
**Severity**: HIGH  

**Description**:
Email verification tokens are generated using `Math.random()` which is not cryptographically secure. Only 8 characters provides minimal entropy (~26 bits).

```typescript
const token = Math.random().toString(36).slice(2,10);
// Produces ~8 character tokens like "abc12def"
// Very easy to brute force or predict
```

**Impact**:
- Email verification tokens can be easily guessed or brute forced
- Attacker can verify any email address in the system
- Professional account creation vulnerable (verified via this token)
- No rate limiting on verification endpoint

**Risk**: HIGH - Token prediction/guessing  
**Suggested Fix**:
```typescript
import { randomBytes } from 'crypto';
const token = randomBytes(32).toString('hex'); // 64 character hex string
```

---

### 7. OAuth Tokens Stored in Plaintext
**File**: `/home/user/monet3.0/prisma/schema.prisma`  
**Lines**: 82-83  
**Severity**: HIGH  

**Description**:
OAuth access and refresh tokens are stored in the database without encryption. If database is compromised, all Google/LinkedIn tokens are exposed.

```prisma
model OAuthAccount {
  accessToken       String?    // Stored in plaintext
  refreshToken      String?    // Stored in plaintext
```

**Impact**:
- If database is breached, OAuth tokens are exposed
- Attacker could access candidates' Google Calendar data
- Could impersonate users to third-party services
- Complete compromise of calendar integration

**Risk**: HIGH - Data breach impact  
**Suggested Fix**:
- Encrypt tokens at rest using application-level encryption (e.g., libsodium)
- Use database encryption if available (PostgreSQL extensions)
- Consider using token vaults instead of storing directly

---

### 8. Payment Intent Created Without Ownership Validation
**File**: `/home/user/monet3.0/src/app/api/shared/stripe/intent/route.ts`  
**Lines**: 8-43  
**Severity**: HIGH  

**Description**:
A candidate can create a Stripe PaymentIntent for ANY professional without creating a booking. While payment intent doesn't transfer money, it allows generating intents for any professional.

```typescript
export const POST = withAuth(async (session, req: NextRequest) => {
  const { professionalId } = await req.json();
  // No ownership check - candidate can specify any professional
  const pro = await prisma.professionalProfile.findUnique({
    where: { userId: professionalId },
  });
  // Creates payment intent for anyone's professional account
  const pi = await stripe.paymentIntents.create({
    metadata: { professionalId },  // Could be any professional
  });
```

**Impact**:
- Can create intents for unwanted professionals (spam/abuse vector)
- May trigger Stripe processing fees
- No valid business case for this endpoint - normal flow uses `/bookings/request`

**Risk**: MEDIUM-HIGH - Unauthorized intent creation  
**Suggested Fix**:
- Remove this endpoint or verify it's needed
- If needed, restrict to authenticated candidates with booking relationship
- Or only allow through booking request flow

---

### 9. No Rate Limiting on Authentication Endpoints
**File**: `/home/user/monet3.0/src/app/api/auth/` routes  
**Severity**: HIGH  

**Description**:
Critical auth endpoints have no rate limiting:
- `signup` - allows unlimited account creation attempts
- `forgot-password` - allows unlimited password reset requests (enumeration)
- `reset-password` - allows unlimited reset attempts

**Impact**:
- Brute force attacks on password reset
- Email enumeration via password reset
- Account creation spam
- Denial of service by creating many accounts

**Risk**: HIGH - Brute force & enumeration  
**Suggested Fix**:
- Add rate limiting to signup endpoint (e.g., 5 per hour per IP)
- Add rate limiting to password endpoints
- Use Redis-based rate limiting for multiple instances
- Consider CAPTCHA on signup

---

### 10. In-Memory Rate Limiting Ineffective
**File**: `/home/user/monet3.0/lib/core/rate-limit.ts`  
**Severity**: HIGH  

**Description**:
Rate limiting is implemented in-memory only. This means:
- Resets on server restart
- Doesn't work across multiple server instances
- Can be bypassed by rotating IPs

```typescript
const buckets = new Map<string, Bucket>();
// Map is lost on server restart
// Different servers have independent maps
```

**Impact**:
- Rate limiting provides no real protection in production
- Only useful in development single-instance scenario

**Risk**: HIGH - Ineffective protection  
**Suggested Fix**:
- Use Redis-based rate limiting (e.g., ioredis with sliding window)
- Use external service (AWS API Gateway, Cloudflare)
- Persist rate limit state

---

### 11. Missing Stripe Webhook Secret Validation
**File**: `/home/user/monet3.0/src/app/api/shared/stripe/webhook/route.ts`  
**Line**: 15  
**Severity**: HIGH  

**Description**:
Stripe webhook signature verification uses an empty string fallback if `STRIPE_WEBHOOK_SECRET` is not set.

```typescript
event = stripe.webhooks.constructEvent(
  raw,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET || '', // Falls back to empty string
);
```

**Impact**:
- If environment variable is missing, signature validation is bypassed
- Attackers could send forged webhook events
- Could manipulate payment status, mark payments as received, etc.
- Major financial/security impact

**Risk**: CRITICAL for payment processing  
**Suggested Fix**:
- Require the secret to be set: `process.env.STRIPE_WEBHOOK_SECRET!`
- Throw error if not configured
- Add validation in startup

---

## MEDIUM SEVERITY ISSUES

### 12. Implicit JWT Role Fallback
**File**: `/home/user/monet3.0/src/auth.ts`  
**Lines**: 101, 108  
**Severity**: MEDIUM  

**Description**:
JWT and session callbacks implicitly default to 'CANDIDATE' role if the role is missing or undefined.

```typescript
async jwt({token, user}){
  if(user){
    token.role = (user as any).role || 'CANDIDATE';  // Implicit default
  }
  return token;
},
async session({session, token}){
  (session.user as any).role = (token.role as any) || 'CANDIDATE';  // Implicit default
}
```

**Impact**:
- If token.role is corrupted or missing, user becomes CANDIDATE
- CANDIDATE is lowest privilege, so less immediate impact
- But breaks role-based access control assumptions
- Silent failure instead of explicit error

**Risk**: MEDIUM - Unexpected privilege level  
**Suggested Fix**:
- Validate role explicitly and throw error if invalid
- Don't use implicit defaults for security-critical values
- Assert role is one of: CANDIDATE, PROFESSIONAL, ADMIN

---

### 13. TypeScript Type Bypassing
**File**: `/home/user/monet3.0/src/auth.ts`  
**Lines**: 94-95  
**Severity**: MEDIUM  

**Description**:
Using `(user as any)` bypasses TypeScript's type safety for assigning id and role to user object.

```typescript
(user as any).id = dbUser.id;
(user as any).role = dbUser.role;
```

**Impact**:
- Could hide type mismatches
- Makes it harder to refactor safely
- Security properties not checked by TypeScript

**Risk**: MEDIUM - Code quality & maintainability  
**Suggested Fix**:
- Properly type the user object
- Return properly typed object from authorize callback

---

### 14. No Audit Logging for Auth Events
**File**: All auth endpoints  
**Severity**: MEDIUM  

**Description**:
Authentication events (signup, login, password reset) are not logged. This makes it impossible to detect or investigate account takeover attempts.

**Impact**:
- No audit trail for security incidents
- Can't detect brute force attacks
- Can't investigate unauthorized access
- Compliance issues (audit requirements)

**Risk**: MEDIUM - Forensics & detection  
**Suggested Fix**:
- Log all auth events: signup, login, password reset, role changes
- Store IP address, timestamp, outcome
- Create alerts for suspicious patterns

---

### 15. Weak Crypto in Password Reset Token (Alternative Implementation)
**File**: `/home/user/monet3.0/src/app/api/auth/forgot-password/route.ts`  
**Line**: 19  
**Severity**: MEDIUM  

**Description**:
While password reset tokens are properly deleted after use (preventing reuse), the token is generated using `uuid` library which is better than random. However, tokens are 36 characters which is reasonable.

**Status**: This is adequately handled with UUID v4, which is cryptographically secure.

---

### 16. Password Reset Email Could Expose Reset Links
**File**: `/home/user/monet3.0/src/app/api/auth/forgot-password/route.ts`  
**Line**: 35  
**Severity**: MEDIUM  

**Description**:
Reset link is sent via email with token in plaintext URL. Email is potentially logged in mail servers or forwarded.

```typescript
const resetUrl = `${baseUrl}/reset-password?token=${token}`;
```

**Impact**:
- Email forwarding could expose reset token
- Email provider logging could expose token
- Token appears in email server logs

**Risk**: MEDIUM - Token leakage via email  
**Suggested Fix**:
- Use short-lived tokens (current 1 hour is good)
- Consider POST form instead of GET link
- Add rate limiting on reset attempts
- Consider one-time-use better alternatives

---

### 17. Vulnerable Middleware Configuration - API Routes Excluded
**File**: `/home/user/monet3.0/src/middleware.ts`  
**Lines**: 4-6  
**Severity**: MEDIUM  

**Description**:
API routes are explicitly excluded from middleware protection, requiring each API to manually call `auth()`.

```typescript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
// API routes are NOT protected by middleware
```

**Impact**:
- Easy to forget `auth()` call in new API routes
- Discovered during audit: route forgot auth check (Issue #3)
- Decentralized auth is error-prone

**Risk**: MEDIUM - Human error in implementation  
**Suggested Fix**:
- Create custom middleware that wraps all API routes
- Provide strict patterns/templates for new routes
- Add linter rules to check all routes have auth checks

---

### 18. No CSRF Protection Explicit Validation
**File**: All routes  
**Severity**: MEDIUM  

**Description**:
While NextAuth provides CSRF protection via JWT strategy, there's no explicit CSRF token validation or SameSite cookie configuration visible.

**Impact**:
- Relies on NextAuth's default CSRF handling
- No secondary validation visible

**Risk**: MEDIUM - If NextAuth config is changed  
**Suggested Fix**:
- Document CSRF protection strategy
- Add explicit CSRF token validation for sensitive operations
- Configure SameSite=Strict cookies

---

## SUMMARY TABLE

| Issue # | Title | Severity | File | Line | Status |
|---------|-------|----------|------|------|--------|
| 1 | Unrestricted Professional Signup | CRITICAL | auth/signup | 11, 23 | MUST FIX |
| 2 | Candidate Profile Public Access | CRITICAL | candidate/profile/[id] | 5-43 | MUST FIX |
| 3 | User Role Enumeration | CRITICAL | auth/role | 12-16 | MUST FIX |
| 4 | Unauthenticated QC Recheck | CRITICAL | shared/qc/recheck | 3-7 | MUST FIX |
| 5 | Default AUTH_SECRET | HIGH | auth.ts | 18 | FIX SOON |
| 6 | Weak Email Tokens | HIGH | shared/verification/request | 8 | FIX SOON |
| 7 | Plaintext OAuth Tokens | HIGH | schema.prisma | 82-83 | FIX SOON |
| 8 | Unvalidated Payment Intent | HIGH | shared/stripe/intent | 8-43 | FIX SOON |
| 9 | No Auth Rate Limiting | HIGH | auth endpoints | - | FIX SOON |
| 10 | Ineffective Rate Limiting | HIGH | lib/rate-limit.ts | - | FIX SOON |
| 11 | Webhook Secret Validation | HIGH | shared/stripe/webhook | 15 | FIX SOON |
| 12 | Implicit JWT Role Default | MEDIUM | auth.ts | 101, 108 | REVIEW |
| 13 | TypeScript Type Bypass | MEDIUM | auth.ts | 94-95 | IMPROVE |
| 14 | No Auth Audit Logging | MEDIUM | All auth | - | ADD SOON |
| 15 | N/A | N/A | - | - | - |
| 16 | Email Token Leakage Risk | MEDIUM | auth/forgot-password | 35 | REVIEW |
| 17 | API Middleware Config | MEDIUM | middleware.ts | 4-6 | IMPROVE |
| 18 | No Explicit CSRF | MEDIUM | All | - | DOCUMENT |

---

## RECOMMENDATIONS - PRIORITY ORDER

### Immediate (Before Production)
1. Remove professional signup without verification (Issue #1)
2. Protect candidate profile endpoint (Issue #2)
3. Remove or protect role enumeration endpoint (Issue #3)
4. Add auth to QC recheck endpoint (Issue #4)
5. Remove hardcoded AUTH_SECRET fallback (Issue #5)
6. Fix Stripe webhook secret validation (Issue #11)

### Short-term (Week 1)
1. Implement cryptographically secure token generation (Issue #6)
2. Add Redis-based rate limiting (Issue #10)
3. Rate limit auth endpoints (Issue #9)
4. Encrypt OAuth tokens at rest (Issue #7)
5. Fix payment intent endpoint (Issue #8)

### Medium-term (Month 1)
1. Add audit logging for auth events (Issue #14)
2. Fix JWT role handling (Issue #12)
3. Improve API middleware configuration (Issue #17)
4. Document CSRF protection strategy (Issue #18)
5. Add TypeScript type safety (Issue #13)

---

## TESTING RECOMMENDATIONS

1. Create security-focused test suite for auth endpoints
2. Test unauthorized access to protected endpoints
3. Test role-based access control (RBAC) enforcement
4. Test rate limiting with multiple requests
5. Test token expiration and refresh
6. Test OAuth token handling
7. Penetration testing for privilege escalation
8. Audit token generation security

---

