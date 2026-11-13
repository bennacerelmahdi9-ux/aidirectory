/**
 * Rate limiter for server actions. Redis-backed (fixed window) so limits
 * hold across instances and restarts; falls back to in-memory sliding
 * window when Redis is unavailable.
 */

import { getRedis } from "@/lib/redis";

type Window = { hits: number[] };
const memoryWindows = new Map<string, Window>();
let lastSweep = 0;

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the caller may retry (0 when ok). */
  retryAfterSec: number;
  remaining: number;
};

/**
 * Record a hit for `key` if under the limit.
 * @param limit    max hits per window
 * @param windowMs window length in milliseconds
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const redis = getRedis();
  if (redis) {
    try {
      const windowSec = Math.ceil(windowMs / 1000);
      const bucket = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
      const count = await redis.incr(bucket);
      if (count === 1) {
        await redis.expire(bucket, windowSec);
      }
      if (count > limit) {
        const ttl = await redis.ttl(bucket);
        return { ok: false, retryAfterSec: Math.max(1, ttl), remaining: 0 };
      }
      return { ok: true, retryAfterSec: 0, remaining: limit - count };
    } catch {
      /* Redis unavailable — fall through to memory */
    }
  }
  return memoryLimit(key, limit, windowMs);
}

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Lazy sweep of stale windows so the map doesn't grow unbounded.
  if (now - lastSweep > 60_000) {
    for (const [k, w] of memoryWindows) {
      const last = w.hits[w.hits.length - 1];
      if (!last || now - last > windowMs * 4) memoryWindows.delete(k);
    }
    lastSweep = now;
  }

  const w = memoryWindows.get(key) ?? { hits: [] };
  w.hits = w.hits.filter((t) => now - t < windowMs);

  if (w.hits.length >= limit) {
    const oldest = w.hits[0];
    memoryWindows.set(key, w);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)), remaining: 0 };
  }

  w.hits.push(now);
  memoryWindows.set(key, w);
  return { ok: true, retryAfterSec: 0, remaining: limit - w.hits.length };
}

/** Human-friendly rate limit error. */
export function rateLimitError(retryAfterSec: number): string {
  const mins = Math.ceil(retryAfterSec / 60);
  return `Too many requests. Try again in ${mins > 1 ? `${mins} minutes` : "a minute"}.`;
}
