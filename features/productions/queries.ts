import { cache } from "react";
import { db } from "@/db";
import {
  productions,
  productionMemberships,
  productionRoles,
  productionDepartments,
  organizationMemberships,
  profiles,
} from "@/db/schema";
import { and, asc, eq, desc, isNull, isNotNull } from "drizzle-orm";
import { can } from "@/lib/permissions";
import { resolveDepartments, type ResolvedDepartment } from "./departments";
import type { Role } from "@/types/roles";
import type { WizardOrgUser } from "./wizard-constants";

/**
 * Active productions in an org (archived excluded). For the "Archived"
 * tab on /productions, call `getArchivedProductionsByOrganization`.
 */
export async function getProductionsByOrganization(organizationId: string) {
  return db
    .select()
    .from(productions)
    .where(
      and(
        eq(productions.organizationId, organizationId),
        isNull(productions.archivedAt),
        isNull(productions.deletedAt),
      ),
    )
    .orderBy(desc(productions.createdAt));
}

export async function getArchivedProductionsByOrganization(
  organizationId: string,
) {
  return db
    .select()
    .from(productions)
    .where(
      and(
        eq(productions.organizationId, organizationId),
        isNotNull(productions.archivedAt),
        isNull(productions.deletedAt),
      ),
    )
    .orderBy(desc(productions.archivedAt));
}

/**
 * Soft-deleted ("trashed") productions for the org's "Recently deleted"
 * view. Restorable by an admin for 30 days; hard purge is deferred.
 */
export async function getDeletedProductionsByOrganization(
  organizationId: string,
) {
  return db
    .select()
    .from(productions)
    .where(
      and(
        eq(productions.organizationId, organizationId),
        isNotNull(productions.deletedAt),
      ),
    )
    .orderBy(desc(productions.deletedAt));
}

/**
 * Wrapped in `cache()` — the production layout and the page beneath it
 * both resolve the production by slug on every request; this dedupes
 * them into a single query.
 */
export const getProductionBySlug = cache(
  async (organizationId: string, slug: string) => {
    const results = await db
      .select()
      .from(productions)
      .where(
        and(
          eq(productions.organizationId, organizationId),
          eq(productions.slug, slug),
          isNull(productions.deletedAt),
        ),
      )
      .limit(1);

    return results[0] ?? null;
  },
);

export async function getUserProductions(
  userId: string,
  organizationId: string,
) {
  const rows = await db
    .select({
      id: productions.id,
      title: productions.title,
      slug: productions.slug,
      status: productions.status,
      color: productions.color,
      venue: productions.venue,
      openingDate: productions.openingDate,
      closingDate: productions.closingDate,
      firstRehearsalDate: productions.firstRehearsalDate,
      techStartDate: productions.techStartDate,
      role: productionMemberships.role,
    })
    .from(productionMemberships)
    .innerJoin(
      productions,
      eq(productionMemberships.productionId, productions.id),
    )
    .where(
      and(
        eq(productionMemberships.userId, userId),
        // Scope to the CURRENT workspace — a user in several orgs must only see
        // the active org's shows, never a mix across workspaces.
        eq(productions.organizationId, organizationId),
        isNull(productions.archivedAt),
        isNull(productions.deletedAt),
      ),
    )
    .orderBy(desc(productions.createdAt));

  // Deduplicate by production id — keep the first (highest-privilege) membership
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export type UserProduction = Awaited<
  ReturnType<typeof getUserProductions>
>[number];

/**
 * Productions the user should see in the rail / dashboard / calendar for their
 * CURRENT workspace, by the Canva/Monday team model:
 *   • managers (productions:manage) see every show in the org,
 *   • everyone else sees only the shows they're cast/crewed on.
 * Always scoped to the active org, so switching workspaces never leaks another
 * org's productions.
 */
export async function getVisibleProductions(user: {
  id: string;
  organizationId: string;
  role: Role;
}): Promise<UserProduction[]> {
  if (can(user.role, "productions:manage")) {
    const rows = await getProductionsByOrganization(user.organizationId);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      status: r.status,
      color: r.color,
      venue: r.venue,
      openingDate: r.openingDate,
      closingDate: r.closingDate,
      firstRehearsalDate: r.firstRehearsalDate,
      techStartDate: r.techStartDate,
      role: user.role,
    }));
  }
  return getUserProductions(user.id, user.organizationId);
}

/**
 * The production's cast list (characters), with the org member cast in each
 * role joined in when one is assigned. Drives the cast-assignment UI on the
 * Cast & Crew page. Ordered as entered (wizard / AI reading order), then name.
 */
export async function getProductionRoles(productionId: string) {
  return db
    .select({
      id: productionRoles.id,
      name: productionRoles.name,
      type: productionRoles.type,
      actor: productionRoles.actor,
      sortOrder: productionRoles.sortOrder,
      assignedUserId: productionRoles.assignedUserId,
      assignedFirstName: profiles.firstName,
      assignedLastName: profiles.lastName,
      assignedEmail: profiles.email,
    })
    .from(productionRoles)
    .leftJoin(profiles, eq(productionRoles.assignedUserId, profiles.id))
    .where(eq(productionRoles.productionId, productionId))
    .orderBy(asc(productionRoles.sortOrder), asc(productionRoles.name));
}

export type ProductionRoleRow = Awaited<
  ReturnType<typeof getProductionRoles>
>[number];

/**
 * The departments configured for a production (rows in `production_departments`).
 * Pass through `resolveDepartments` (features/productions/departments) to get
 * display-ready, ordered departments. Drives the Cast & Crew board's team
 * buckets, the rehearsal-report sections, and the production Settings tab.
 */
export async function getProductionDepartmentRows(
  productionId: string,
): Promise<{ key: string; label: string; sortOrder: number }[]> {
  return db
    .select({
      key: productionDepartments.key,
      label: productionDepartments.label,
      sortOrder: productionDepartments.sortOrder,
    })
    .from(productionDepartments)
    .where(eq(productionDepartments.productionId, productionId));
}

/** A production's departments, resolved + ordered for display. */
export async function getResolvedDepartments(
  productionId: string,
): Promise<ResolvedDepartment[]> {
  return resolveDepartments(await getProductionDepartmentRows(productionId));
}

/**
 * Org members formatted for the wizard's actor autocomplete — anyone already
 * in the organization can be suggested when typing actor / team names.
 */
export async function getOrgUsersForWizard(
  organizationId: string,
): Promise<WizardOrgUser[]> {
  const rows = await db
    .select({
      email: profiles.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
    })
    .from(organizationMemberships)
    .innerJoin(profiles, eq(organizationMemberships.userId, profiles.id))
    .where(eq(organizationMemberships.organizationId, organizationId));

  return rows
    .map((r) => ({
      name: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || r.email,
      email: r.email,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
