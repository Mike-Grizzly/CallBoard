import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Gracefully degrade when Upstash env vars are absent (local dev, CI, previews).
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

const RATE_LIMITED_MESSAGE =
  "Too many attempts. Please wait a few minutes and try again.";
const UNAVAILABLE_MESSAGE =
  "Authentication is temporarily unavailable. Please try again in a moment.";

/**
 * The limiter's outcome for a single check, before we decide how to treat it:
 *  - `ok`: the limiter ran and told us whether the request is within budget.
 *  - `unavailable`: no limiter is configured (missing Upstash env vars).
 *  - `error`: the limiter threw (e.g. Redis unreachable).
 */
type LimiterOutcome =
  | { kind: "ok"; success: boolean }
  | { kind: "unavailable" }
  | { kind: "error" };

/**
 * Pure policy decision, separated from I/O so it can be unit-tested.
 *
 * The key security choice is what to do when rate limiting is unavailable.
 * Failing OPEN there means brute-force/credential-stuffing protection silently
 * disappears at the exact moment it's needed. In real production we therefore
 * fail CLOSED — deny the attempt with a generic "try again" — so a missing or
 * broken limiter degrades availability loudly instead of degrading security
 * silently. Everywhere else (local dev, CI, Vercel previews) there is no Redis
 * by design, so we fail open to stay usable.
 */
export function decideRateLimit(
  outcome: LimiterOutcome,
  realProduction: boolean,
): RateLimitResult {
  if (outcome.kind === "ok") {
    return outcome.success
      ? { limited: false }
      : { limited: true, error: RATE_LIMITED_MESSAGE };
  }
  // unavailable | error
  return realProduction
    ? { limited: true, error: UNAVAILABLE_MESSAGE }
    : { limited: false };
}

/**
 * True only on the real production deployment. Vercel runs previews with
 * NODE_ENV=production too, so we key on VERCEL_ENV when present (which is
 * "production" only for the production deployment) and fall back to NODE_ENV
 * off-Vercel. This keeps preview logins working without Upstash configured.
 */
function isRealProduction(): boolean {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  return process.env.NODE_ENV === "production";
}

/**
 * Apply the auth rate limit to `identifier` (typically an IP address).
 * Returns `{ limited: false }` when under budget, or `{ limited: true, error }`
 * when the request should be blocked — either because the limit was exceeded
 * or, in production, because the limiter is unavailable (see `decideRateLimit`).
 */
export async function checkAuthRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  const realProd = isRealProduction();

  if (!authLimiter) {
    if (realProd) {
      console.error(
        "[rate-limit] Upstash Redis is not configured in production — auth " +
          "rate limiting is unavailable. Set UPSTASH_REDIS_REST_URL and " +
          "UPSTASH_REDIS_REST_TOKEN. Failing closed.",
      );
    }
    return decideRateLimit({ kind: "unavailable" }, realProd);
  }

  try {
    const { success } = await authLimiter.limit(identifier);
    return decideRateLimit({ kind: "ok", success }, realProd);
  } catch (err) {
    if (realProd) {
      console.error(
        "[rate-limit] Auth rate limiter failed in production — failing closed.",
        err,
      );
    }
    return decideRateLimit({ kind: "error" }, realProd);
  }
}
