import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Security headers applied to every response. The CSP is deliberately scoped to
// the high-value, low-breakage directives: it locks down plugins (object-src),
// base-uri, and framing (frame-ancestors) WITHOUT a default-src/script-src,
// which would otherwise block the many external origins the app legitimately
// uses (Supabase signed URLs, Sanity CDN, Stripe, GTM, web-push). A full
// nonce-based script-src CSP can be layered on later behind testing.
// Shared, framing-agnostic headers. The framing directives (X-Frame-Options +
// CSP frame-ancestors) are appended per-scope below so the Builder.io POC route
// can be framed by the visual editor WITHOUT loosening framing anywhere else.
const baseSecurityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

// Production default: same-origin framing only (unchanged from before).
const securityHeaders = [
  ...baseSecurityHeaders,
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Content-Security-Policy",
    value: ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'self'"].join(
      "; ",
    ),
  },
];

// Builder.io POC ONLY (/builder-poc/*): the in-context visual editor frames the
// page from builder.io, so this scope allows builder.io as a frame ancestor and
// omits X-Frame-Options (which can't express an external allow-list and would
// otherwise block the editor). object-src/base-uri stay locked down. This
// relaxation is intentionally confined to the POC path — see docs/builder-poc.md.
const builderPocSecurityHeaders = [
  ...baseSecurityHeaders,
  {
    key: "Content-Security-Policy",
    value: [
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'self' https://builder.io https://*.builder.io",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb",
    },
    proxyClientMaxBodySize: "64mb",
  },
  async headers() {
    return [
      // Builder POC scope first; its negative-lookahead exclusion below keeps the
      // default rule from also matching /builder-poc and re-adding X-Frame-Options.
      { source: "/builder-poc/:path*", headers: builderPocSecurityHeaders },
      { source: "/((?!builder-poc).*)", headers: securityHeaders },
    ];
  },
};

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      disableLogger: true,
    })
  : nextConfig;
