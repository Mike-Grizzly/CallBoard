/**
 * Fixed role set for the MVP. Do not add custom roles here —
 * custom roles are explicitly out of scope for the MVP.
 *
 * Keep this in sync with db/schema role columns and lib/permissions.ts.
 */
export const ROLES = [
  "admin",
  "producer",
  "director",
  "choreographer",
  // Creative / design team (designers, music staff). Editor-tier: can upload
  // scripts & ground plans, run AI parsing, and edit blocking.
  "creative",
  "stage_manager",
  "cast",
  "crew",
] as const;

export type Role = (typeof ROLES)[number];
