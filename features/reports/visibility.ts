import { can } from "@/lib/permissions";
import type { Role } from "@/types/roles";

/**
 * Whether a role may see rehearsal reports that are still drafts.
 *
 * Draft reports routinely hold incomplete, internal, or sensitive
 * stage-management information — attendance/absence notes, line notes, incident
 * and injury notes — that has not yet been intentionally distributed. Only
 * report managers (anyone who can create/edit/send reports) may see drafts;
 * plain viewers such as cast and crew, who hold only `reports:view`, see a
 * report once it has been distributed.
 *
 * This is the single source of truth for draft visibility. Apply it at EVERY
 * report read path so the boundary can't be reached around: list queries,
 * detail pages, direct-URL access, and attachment signed-URL issuance. UI
 * hiding alone is not sufficient — the gate must be server-side.
 *
 * Note: every role that can author a report also holds `reports:create`, so a
 * report's own creator is always covered by this rule.
 */
export function canViewDraftReports(role: Role): boolean {
  return can(role, "reports:create");
}
