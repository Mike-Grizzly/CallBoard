// Builder.io PUBLIC (read) API key for the marketing POC.
//
// This is the Space's *public* key: it is safe to expose to the browser and
// grants read-only access to this Space's published/preview content. It is the
// only Builder credential this POC needs.
//
// The Builder *private* (write/admin) key must NEVER be placed here or in any
// NEXT_PUBLIC_* variable — it would let anyone with the bundle mutate content.
//
// Get this value from Builder: Account Settings → Space → "Public API Key".
export const BUILDER_PUBLIC_API_KEY =
  process.env.NEXT_PUBLIC_BUILDER_API_KEY ?? "";

// The Builder model the POC page renders. "page" is Builder's default
// visual-page model; the POC only ever reads from it.
export const BUILDER_PAGE_MODEL = "page";
