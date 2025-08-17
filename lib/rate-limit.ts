const WINDOW_MS = 60_000;
const LIMIT = 60;
type Bucket = { ts: number[] };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string){
  const now = Date.now();
  const b = buckets.get(key) || { ts: [] };
  b.ts = b.ts.filter(t => now - t < WINDOW_MS);
  if(b.ts.length >= LIMIT) return false;
  b.ts.push(now);
  buckets.set(key, b);
  return true;
}
