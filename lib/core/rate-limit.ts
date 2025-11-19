const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 60;

// Stricter limits for auth endpoints to prevent brute force
const AUTH_WINDOW_MS = 15 * 60_000; // 15 minutes
const AUTH_LIMIT = 5; // 5 attempts per 15 minutes

type Bucket = { ts: number[] };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number = DEFAULT_LIMIT, windowMs: number = DEFAULT_WINDOW_MS){
  const now = Date.now();
  const b = buckets.get(key) || { ts: [] };
  b.ts = b.ts.filter(t => now - t < windowMs);
  if(b.ts.length >= limit) return false;
  b.ts.push(now);
  buckets.set(key, b);
  return true;
}

/**
 * Stricter rate limiting for authentication endpoints
 * 5 attempts per 15 minutes per IP/email
 */
export function rateLimitAuth(key: string) {
  return rateLimit(key, AUTH_LIMIT, AUTH_WINDOW_MS);
}
