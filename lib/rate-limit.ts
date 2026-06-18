import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Gracefully degrade when Upstash env vars are absent (local dev, CI).
function makeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = makeRedis();

// 5 attempts per IP per 15 minutes for auth actions.
const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:auth",
    })
  : null;

export type RateLimitResult = { limited: boolean; error?: string };

/**
 * Apply the auth rate limit to `identifier` (typically an IP address).
 * Returns `{ limited: false }` when under budget, or `{ limited: true, error }`
 * when the limit is exceeded. Always returns `{ limited: false }` when Redis
 * is not configured so the app stays functional without Upstash credentials.
 */
export async function checkAuthRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  if (!authLimiter) return { limited: false };
  try {
    const { success } = await authLimiter.limit(identifier);
    if (!success) {
      return {
        limited: true,
        error: "Too many attempts. Please wait a few minutes and try again.",
      };
    }
    return { limited: false };
  } catch {
    // Never block the user if the rate-limit service is unreachable.
    return { limited: false };
  }
}
