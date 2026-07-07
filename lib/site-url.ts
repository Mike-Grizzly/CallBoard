import "server-only";
import { headers } from "next/headers";

/**
 * Base URL for Stripe checkout/portal return URLs — the origin the request is
 * actually on (localhost, a Vercel preview, or production). Using the live
 * origin (instead of a fixed NEXT_PUBLIC_SITE_URL) means checkout returns the
 * user to the SAME deployment they started on, so a purchase made on a preview
 * doesn't bounce them to production. Mirrors the OAuth `requestOrigin()` in
 * `app/actions/auth.ts`. Falls back to the configured site URL, then localhost.
 */
export async function requestSiteUrl(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
