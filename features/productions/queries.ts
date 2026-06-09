import { cache } from "react";
import { db } from "@/db";
import {
  productions,
  productionMemberships,
  organizationMemberships,
  profiles,
} from "@/db/schema";
import { and, eq, desc, isNull, isNotNull } from "drizzle-orm";
import { can } from "@/lib/permissions";
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
      ),
    )
    .orderBy(desc(productions.archivedAt));
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
