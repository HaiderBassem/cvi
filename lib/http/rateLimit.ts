/**
 * In-memory fixed-window rate limiter keyed by client IP. Good enough for a
 * single Node process (this app runs one); swap for Redis if it ever scales out.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Best-effort client IP. Uses the right-most X-Forwarded-For hop — the one added
 * by the nearest proxy — because the left-most entries are supplied by the client
 * and trivially spoofed. Behind exactly one reverse proxy this is the real client.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    const hops = fwd.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return 'unknown';
}

/** True when the request is allowed. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}
