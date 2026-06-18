import type { NextConfig } from "next";

// Security headers applied to every response. The CSP is deliberately scoped to
// the high-value, low-breakage directives: it locks down plugins (object-src),
// base-uri, and framing (frame-ancestors) WITHOUT a default-src/script-src,
// which would otherwise block the many external origins the app legitimately
// uses (Supabase signed URLs, Sanity CDN, Stripe, GTM, web-push). A full
// nonce-based script-src CSP can be layered on later behind testing.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'self'"].join(
      "; ",
    ),
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
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
