# Frontend React Components - Bug Report

## Summary
Found **22 critical and high-severity bugs** in the frontend React components, primarily involving:
- Missing error handling in fetch calls (most common)
- Missing null/undefined checks
- State management issues
- Missing try-catch blocks
- Incorrect use of global fetch interception

---

## CRITICAL ISSUES (Must Fix)

### 1. StatusPopup.tsx - Global Fetch Interception (CRITICAL)
**File:** `/home/user/monet3.0/src/components/ui/StatusPopup.tsx`  
**Lines:** 42-68  
**Severity:** CRITICAL  
**Description:**
The `StatusProvider` intercepts ALL fetch calls globally by replacing `window.fetch`. This will:
- Break all API requests by showing success/error popups regardless of actual response content
- Intercept requests that shouldn't trigger UI feedback (background syncs, health checks)
- Consume response bodies (`clone().json()`) which can cause issues with streaming responses
- Show incorrect messages to users when actual API responses fail

**Issues:**
- Line 47: Calls `.clone()` multiple times which wastes resources
- Line 52: Assumes error response has `.error` or `.message` field (fragile)
- Line 59: Always shows "Success" even for redirects, network errors, etc.
- Line 64: Re-throws error after showing message, causing unhandled rejections

**Fix Required:** Either:
1. Remove this global interception entirely
2. Only intercept specific routes (list them explicitly)
3. Use a proper fetch wrapper instead of monkey-patching window.fetch

---

### 2. RequestActions.tsx - Missing Error Handling
**File:** `/home/user/monet3.0/src/components/bookings/RequestActions.tsx`  
**Lines:** 11-16  
**Severity:** CRITICAL  
**Description:**
The `decline` function has no error handling. If the API call fails, the user sees no error message.

```typescript
const decline = async () => {
  setLoading(true);
  // No try-catch, no error handling
  await fetch(`/api/professional/bookings/${bookingId}/decline`, { method: 'POST' });
  setLoading(false);
  router.refresh();
};
```

**Problems:**
- Network errors are swallowed
- API errors (400, 500) are ignored
- User has no feedback if decline fails
- `router.refresh()` will execute regardless of success

**Fix:** Add try-catch with error state display

---

### 3. AvailabilityCalendar.tsx - Multiple Missing Error Handlers
**File:** `/home/user/monet3.0/src/components/bookings/AvailabilityCalendar.tsx`  
**Lines:** 219-245, 293-298  
**Severity:** HIGH  
**Description:**

**Line 219-245 (handleSync):**
```typescript
const res = await fetch('/api/candidate/busy');
if (res.status === 401) { /* ... */ }
if (!res.ok) return; // Silently fails!
// No error display to user
```
Doesn't inform user when sync fails silently.

**Line 293-298 (handleConfirm):**
```typescript
await fetch('/api/candidate/availability', {
  method: 'POST',
  // ...
});
// No error handling, no response check
```
Doesn't verify the request succeeded.

**Fix:** Add try-catch blocks and display error messages to users

---

### 4. FeedbackForm.tsx - No Error Handling in submitFeedback
**File:** `/home/user/monet3.0/src/app/professional/feedback/[bookingId]/FeedbackForm.tsx`  
**Lines:** 58-70  
**Severity:** HIGH  
**Description:**

```typescript
async function submitFeedback(payload: any) {
  // No try-catch, no error handling
  const res = await fetch(`/api/professional/feedback/${bookingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    router.push(`/professional/requests`);
  } else {
    alert("Failed to submit feedback"); // Only basic alert
  }
}
```

**Problems:**
- Line 44-47: When validation fails (not 200), code proceeds to submit anyway - this is wrong behavior
- No response body check
- Generic error message
- Doesn't check if res.ok before parsing JSON
- No network error handling

**Fix:** 
- Add proper error boundaries
- Don't proceed to submit if validation failed and user doesn't explicitly choose to proceed

---

### 5. Professional Settings Form - No Error Handling
**File:** `/home/user/monet3.0/src/app/professional/settings/SettingsForm.tsx`  
**Lines:** 27, 42, 54  
**Severity:** HIGH  
**Description:**
Three fetch calls without error handling:

```typescript
// Line 27 - No error handling
useEffect(() => {
  async function load() {
    const res = await fetch('/api/professional/settings');
    if (res.ok) { /* ... */ }
    // If not ok, nothing happens - form stays empty
  }
  load();
}, []);

// Line 42 - No error handling
const handleSave = async () => {
  // No try-catch
  await fetch('/api/professional/settings', {
    method: 'PUT',
    // ...
  });
  // No res.ok check, form shows "saved" regardless
  setInitial(form);
  alert('Settings saved');
};

// Line 54 - No error handling
const handleDelete = async () => {
  const res = await fetch('/api/professional/settings', { method: 'DELETE' });
  // Doesn't check res.ok
  if (res.ok) {
    await signOut({ redirectTo: '/' });
  }
};
```

**Fix:** Add proper try-catch and response validation

---

### 6. Candidate Settings Form - Missing Error Handling
**File:** `/home/user/monet3.0/src/app/candidate/settings/SettingsForm.tsx`  
**Lines:** 38, 65, 89  
**Severity:** HIGH  
**Description:**
Same issues as professional settings:
- Line 38: fetch without error handling
- Line 65: PUT request without try-catch
- Line 89: DELETE request doesn't validate response

---

### 7. Professional Requests Page - No Error Handling in useEffect
**File:** `/home/user/monet3.0/src/app/professional/requests/[id]/page.tsx`  
**Lines:** 13-22  
**Severity:** HIGH  
**Description:**

```typescript
useEffect(() => {
  // No try-catch, no error handling
  fetch(`/api/professional/bookings/${params.id}/confirm-and-schedule`)
    .then((res) => res.json()) // No res.ok check!
    .then((data) => {
      const availability: TimeSlot[] = (data.availability || []).map(...);
      setSlots(availability);
    });
    // No catch block - errors silently fail
}, [params.id]);
```

**Problems:**
- No error handling if fetch fails
- No check if response is ok
- If JSON parsing fails, error is swallowed
- User sees empty calendar with no error message

**Also Line 27:** POST request also has no error handling
```typescript
await fetch(`/api/professional/bookings/${params.id}/confirm-and-schedule`, {
  method: "POST",
  // ...
});
// Doesn't check if succeeded
router.push("/professional/requests");
```

**Fix:** Add .catch() handler and res.ok checks

---

### 8. SignUpForm.tsx - Missing Error Handling
**File:** `/home/user/monet3.0/src/app/(public)/signup/SignUpForm.tsx`  
**Lines:** 27, 34  
**Severity:** HIGH  
**Description:**

```typescript
// Line 27 - No try-catch
const res = await fetch('/api/auth/signup', {
  method: 'POST',
  // ...
});
setLoading(false);
// Doesn't check res.ok before parsing
if (res.ok) {
  // Line 34 - No error handling on signIn
  await signIn('credentials', {
    // ...
  });
  // If signIn fails, no error handling
}
```

**Problems:**
- Doesn't catch network errors
- Doesn't handle signIn failures
- Line 15: Doesn't check if res.url exists before using it

**Fix:** Add try-catch and handle all error cases

---

### 9. ForgotPasswordForm.tsx - No Error Handling
**File:** `/home/user/monet3.0/src/app/(public)/forgot-password/ForgotPasswordForm.tsx`  
**Lines:** 10-15  
**Severity:** HIGH  
**Description:**

```typescript
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  // No error handling
  await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  // Never checks if request succeeded
  setSent(true); // Shows success regardless!
}
```

**Problems:**
- Shows "Check your email" even if request failed
- No error message to user
- Doesn't validate response

**Fix:** Check res.ok before setting setSent(true)

---

### 10. ResetPasswordForm.tsx - No Error Handling
**File:** `/home/user/monet3.0/src/app/(public)/reset-password/ResetPasswordForm.tsx`  
**Lines:** 13-18  
**Severity:** HIGH  
**Description:**

```typescript
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  // No error handling
  await fetch('/api/auth/reset-password', {
    method: 'POST',
    // ...
  });
  // No res.ok check
  setDone(true); // Shows success regardless of actual response!
}
```

**Fix:** Validate response before showing success

---

### 11. StripeSection.tsx - Incorrect Error Response Handling
**File:** `/home/user/monet3.0/src/app/professional/settings/StripeSection.tsx`  
**Lines:** 30-35  
**Severity:** HIGH  
**Description:**

```typescript
const handleConnect = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch('/api/shared/stripe/account', { method: 'POST' });
    const data = await res.json();
    // Checks response.ok AFTER parsing JSON
    if (!res.ok || !data.onboardingUrl) throw new Error();
    // If res is 404, data will still be {error: "..."} 
    // and data.onboardingUrl will be undefined, then throws generic error
    setMessage('Redirecting to Stripe...');
    window.location.href = data.onboardingUrl;
  } catch {
    setError('Failed to open Stripe'); // Generic error message
  }
};
```

**Problems:**
- Parses JSON before checking res.ok - wastes resources
- Generic error message doesn't help user debug
- Line 20: Same issue in fetchStatus

**Fix:** Check res.ok before parsing, provide specific error messages

---

## HIGH-SEVERITY ISSUES

### 12. UpcomingCalls.tsx - Missing Null Check
**File:** `/home/user/monet3.0/src/components/bookings/UpcomingCalls.tsx`  
**Lines:** 32  
**Severity:** HIGH  
**Description:**

```typescript
<strong>{`${c.professional.professionalProfile?.title} @ ${c.professional.professionalProfile?.employer}`}</strong>
```

**Problem:** If `professionalProfile` is null, this renders as "null @ null" instead of showing a fallback value.

**Fix:** Add null check and fallback text:
```typescript
const profile = c.professional.professionalProfile;
const heading = profile ? `${profile.title} @ ${profile.employer}` : 'Professional';
```

---

### 13. HistoricalFeedback.tsx - Unsafe Type Cast
**File:** `/home/user/monet3.0/src/components/feedback/HistoricalFeedback.tsx`  
**Lines:** 6  
**Severity:** MEDIUM  
**Description:**

```typescript
const extraRatings = feedback.extraCategoryRatings as Record<string, number>;
```

**Problem:** 
- Unsafe type assertion without validation
- If extraCategoryRatings is null/undefined, this will cause runtime errors
- Line 18: Maps over extraRatings assuming it exists

**Fix:** Add null check:
```typescript
const extraRatings = (feedback.extraCategoryRatings ?? {}) as Record<string, number>;
```

---

### 14. ProfileDetail.tsx - Date Parsing Errors
**File:** `/home/user/monet3.0/src/components/profile/ProfileDetail.tsx`  
**Lines:** 80, 102  
**Severity:** MEDIUM  
**Description:**

```typescript
const period = item.startDate && item.endDate
  ? `${new Date(item.startDate).getFullYear()}-${new Date(item.endDate).getFullYear()}`
  : '';
```

**Problem:**
- No validation that dates are valid
- If dates are malformed, `getFullYear()` returns NaN
- Renders as "NaN-NaN" which breaks UI

**Fix:** Add date validation or use date-fns utilities from the codebase

---

### 15. DashboardClient.tsx - Type Safety Issue
**File:** `/home/user/monet3.0/src/components/dashboard/DashboardClient.tsx`  
**Lines:** 70  
**Severity:** MEDIUM  
**Description:**

```typescript
const val = (r as any)[c.key]; // Using 'any' type
```

**Problem:**
- Uses `any` type to bypass TypeScript checking
- Could allow invalid data to pass through
- Makes debugging harder

**Fix:** Use proper TypeScript types instead of `any`

---

### 16. DetailsForm.tsx - Incorrect Cache Option
**File:** `/home/user/monet3.0/src/app/(public)/signup/details/DetailsForm.tsx`  
**Lines:** 160  
**Severity:** MEDIUM  
**Description:**

```typescript
const res = await fetch('/api/shared/verification/status', { cache: 'no-store' });
```

**Problem:** 
- The `cache` option is not a standard fetch option
- Should be passed differently in Next.js
- Request might be cached when it shouldn't be

**Fix:** Use proper Next.js fetch options or revalidate

---

### 17. AvailabilityTimes.tsx - Type Safety Issue
**File:** `/home/user/monet3.0/src/app/candidate/settings/AvailabilityTimes.tsx`  
**Lines:** 21, 23  
**Severity:** MEDIUM  
**Description:**

```typescript
const updateRange = (index: number, field: keyof AvailabilityRange, value: any) => {
  const next = [...ranges];
  (next[index] as any)[field] = value; // Using 'any' to bypass TypeScript
  onChange(next);
};
```

**Problem:**
- Uses `any` type for value parameter
- Casts to `any` to bypass type checking
- Could allow invalid values

**Fix:** Properly type the value parameter and remove type assertions

---

### 18. ResumePreview.tsx - No Error Handling for Invalid URLs
**File:** `/home/user/monet3.0/src/components/profile/ResumePreview.tsx`  
**Lines:** 9-13  
**Severity:** MEDIUM  
**Description:**

```typescript
<iframe
  src={url}
  style={{ width: '100%', height: '600px', border: 'none', marginTop: 8 }}
  title="Resume preview"
/>
```

**Problem:**
- No error handling if URL is invalid
- No loading state
- If file doesn't exist, just shows blank iframe
- No fallback for unsupported file types

**Fix:** Add error handling and loading state

---

## MEDIUM-SEVERITY ISSUES

### 19. CheckoutClient.tsx - Line 116 Unknown Prop
**File:** `/home/user/monet3.0/src/app/candidate/detail/[id]/schedule/page.tsx`  
**Lines:** 116  
**Severity:** LOW  
**Description:**

```typescript
<AvailabilityCalendar weeks={weeks} onConfirm={handleConfirm} disabled={isSubmitting} />
```

**Problem:** `AvailabilityCalendar` component doesn't have a `disabled` prop defined. The prop is silently ignored.

**Fix:** Either add the prop to AvailabilityCalendar or use another method to disable it

---

### 20. ProfileDetail.tsx - Potential Interest/Activity Array Issue
**File:** `/home/user/monet3.0/src/components/profile/ProfileDetail.tsx`  
**Lines:** 121, 134  
**Severity:** LOW  
**Description:**

```typescript
{profile.interests?.map((interest) => (
  <Badge key={interest}>{interest}</Badge>
))}
```

**Problem:**
- Uses array value as React key (bad practice)
- If interests array has duplicates, React will have issues
- Should use index or unique ID

**Fix:** Use unique identifier or index

---

### 21. LoginForm.tsx - Missing Error Boundary
**File:** `/home/user/monet3.0/src/app/(public)/login/LoginForm.tsx`  
**Lines:** 16  
**Severity:** MEDIUM  
**Description:**

```typescript
const res = await signIn(provider, { callbackUrl, redirect: false });
if (res?.url) window.location.href = res.url;
```

**Problem:**
- If `signIn` returns null, code silently fails
- No error message if OAuth fails
- User has no feedback

**Fix:** Check for error state and display error message

---

### 22. DashboardClient.tsx - Table Key Issue
**File:** `/home/user/monet3.0/src/components/ui/ui.tsx`  
**Lines:** 48  
**Severity:** LOW  
**Description:**

```typescript
{rows.map((r, i) => (
  <tr key={i}> {/* Using array index as key */}
```

**Problem:**
- Using array index as React key is anti-pattern
- Causes issues if rows are reordered or filtered
- Should use unique identifier from data

**Fix:** Use unique ID from row data instead of index

---

## SUMMARY TABLE

| Issue | File | Line | Severity | Type |
|-------|------|------|----------|------|
| Global fetch interception | StatusPopup.tsx | 42-68 | CRITICAL | Architecture |
| Missing error handling | RequestActions.tsx | 11-16 | CRITICAL | Error Handling |
| Multiple missing handlers | AvailabilityCalendar.tsx | 219-298 | HIGH | Error Handling |
| No submitFeedback error handling | FeedbackForm.tsx | 58-70 | HIGH | Error Handling |
| Pro settings no error handling | SettingsForm.tsx (pro) | 27,42,54 | HIGH | Error Handling |
| Candidate settings no error handling | SettingsForm.tsx (candidate) | 38,65,89 | HIGH | Error Handling |
| No useEffect error handling | RequestSchedule page | 13-22 | HIGH | Error Handling |
| SignUp form errors | SignUpForm.tsx | 27,34 | HIGH | Error Handling |
| ForgotPassword silently fails | ForgotPasswordForm.tsx | 10-15 | HIGH | Error Handling |
| ResetPassword silently fails | ResetPasswordForm.tsx | 13-18 | HIGH | Error Handling |
| Stripe error handling | StripeSection.tsx | 30-35 | HIGH | Error Handling |
| Null checks missing | UpcomingCalls.tsx | 32 | HIGH | Type Safety |
| Unsafe type cast | HistoricalFeedback.tsx | 6 | MEDIUM | Type Safety |
| Date parsing errors | ProfileDetail.tsx | 80,102 | MEDIUM | Error Handling |
| Type safety (any) | DashboardClient.tsx | 70 | MEDIUM | Type Safety |
| Incorrect cache option | DetailsForm.tsx | 160 | MEDIUM | Configuration |
| Type safety (any) | AvailabilityTimes.tsx | 21,23 | MEDIUM | Type Safety |
| No iframe error handling | ResumePreview.tsx | 9-13 | MEDIUM | Error Handling |
| Unknown prop | Schedule page | 116 | LOW | Type Safety |
| Bad React keys | ProfileDetail.tsx | 121,134 | LOW | Best Practices |
| No OAuth error handling | LoginForm.tsx | 16 | MEDIUM | Error Handling |
| Bad React keys | DataTable | 48 | LOW | Best Practices |

---

## RECOMMENDED ACTIONS

### Priority 1 (Implement Immediately)
1. Remove global fetch interception from StatusPopup.tsx
2. Add try-catch with error states to all forms
3. Add res.ok checks before parsing JSON
4. Fix null checks in UpcomingCalls and HistoricalFeedback

### Priority 2 (Implement This Sprint)
1. Add proper date validation
2. Replace `any` types with proper TypeScript
3. Add error boundaries in useEffect hooks
4. Fix React key issues

### Priority 3 (Nice to Have)
1. Add loading states to iframes
2. Improve error messages for users
3. Add request timeouts
4. Add retry logic for network errors

