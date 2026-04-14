import type { Role } from "@/types/roles";

/**
 * Centralized capability map — Phase 1 skeleton.
 *
 * PHASE 1 SCOPE:
 *   This file establishes the SHAPE of permissions so every feature slice
 *   has a single place to plug in. It does NOT enforce anything yet.
 *   Real enforcement lands in Phase 3 (RBAC).
 *
 * IMPORTANT RULES FOR FUTURE FEATURES:
 *   - Never write inline role checks scattered across components.
 *     Always ask `can(role, capability)` here.
 *   - Never introduce custom roles — the MVP uses the fixed set in
 *     `types/roles.ts`.
 *   - Capabilities are verbs on a domain entity (e.g. "reports:create").
 *     Add a new capability here BEFORE using it in a feature.
 */

export const CAPABILITIES = [
  // productions
  "productions:view",
  "productions:manage",

  // reports
  "reports:view",
  "reports:create",

  // documents
  "documents:view",
  "documents:upload",

  // announcements
  "announcements:view",
  "announcements:create",

  // activity
  "activity:view",

  // settings
  "settings:manage",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/**
 * The capability map will be filled in during Phase 3 (RBAC).
 * Intentionally empty for now — every entry returns `false` via `can()`
 * until Phase 3 wires the real role-to-capability matrix.
 */
const CAPABILITY_MAP: Record<Role, ReadonlySet<Capability>> = {
  admin: new Set(),
  producer: new Set(),
  director: new Set(),
  stage_manager: new Set(),
  cast: new Set(),
  crew: new Set(),
};

/**
 * Check whether a role has a given capability.
 *
 * Phase 1: always returns `false`. This is intentional — it forces
 * Phase 3 to explicitly populate CAPABILITY_MAP rather than relying on
 * accidental truthiness during the stub period.
 */
export function can(role: Role, capability: Capability): boolean {
  return CAPABILITY_MAP[role].has(capability);
}
