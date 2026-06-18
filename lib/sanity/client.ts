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
  // Studio location for Visual Editing. Encoding stays OFF here (default); only
  // the preview client below turns it on, so published reads never carry the
  // invisible stega markers.
  stega: { studioUrl: "/studio" },
});

// Preview client for Draft Mode / Visual Editing. Reads DRAFTS (so unpublished
// edits show in the Studio's Presentation pane) and turns on stega encoding,
// which embeds invisible "edit this field" markers into every returned string.
// Those markers are what let the Presentation overlay map a piece of on-page
// text back to its Studio field — but they MUST be stripped (stegaClean) from
// any value used as a URL, slug, key, or number. Requires a read token to see
// drafts; without one it falls back to encoding published content only.
export function getSanityPreviewClient() {
  return sanityClient.withConfig({
    token,
    useCdn: false,
    perspective: token ? "drafts" : "published",
    stega: { studioUrl: "/studio", enabled: true },
  });
}

export const sanityConfigured = Boolean(projectId);
