import { LOGIN_RATE_LIMIT_ATTEMPTS, LOGIN_RATE_LIMIT_WINDOW_MS } from "@/config/app";

type RateLimitEntry = { count: number; resetAt: number };

// In-memory store — sufficient for single-user/single-instance
const store = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired entries every 10 minutes to prevent memory accumulation
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000).unref?.();

export function checkRateLimit(
  key: string,
  maxAttempts: number = LOGIN_RATE_LIMIT_ATTEMPTS,
  windowMs: number = LOGIN_RATE_LIMIT_WINDOW_MS
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}