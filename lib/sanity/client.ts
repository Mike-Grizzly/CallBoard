import { createClient } from "next-sanity";

// Project ID + dataset are NOT secret (they ship in client bundles); the
// values are defaulted here so the read path works out of the box, and can be
// overridden via env.
export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "dsciikio";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-12-01";

// Server-only read token (optional). Lets the server read a PRIVATE dataset /
// drafts. It has no NEXT_PUBLIC_ prefix, so Next strips it from client
// bundles — it can never reach the browser even if this module is imported by
// a client component. For a public dataset, published reads work without it.
const token = process.env.SANITY_API_READ_TOKEN;

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  perspective: "published",
  // CDN is fine for anonymous published reads; a token implies private/fresh
  // content, where the CDN can't help.
  useCdn: !token,
  token,
});

export const sanityConfigured = Boolean(projectId);
