import { db } from "@/db";
import {
  organizationMemberships,
  organizations,
  profiles,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { Role } from "@/types/roles";

export type UserMembership = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: Role;
};

/**
 * Every active membership the user belongs to. Drives the workspace
 * switcher: when it returns 0 rows the user shouldn't be in the app at
 * all (auth would have created an org), when it returns 1 the switcher
 * shows the current label only, when it returns 2+ the dropdown lists
 * everywhere they can pivot to.
 */
export async function getUserMemberships(
  userId: string,
): Promise<UserMembership[]> {
  const rows = await db
    .select({
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
      role: organizationMemberships.role,
    })
    .from(organizationMemberships)
    .innerJoin(
      organizations,
      eq(organizations.id, organizationMemberships.organizationId),
    )
    .where(eq(organizationMemberships.userId, userId))
    .orderBy(organizations.name);

  return rows.map((r) => ({
    organizationId: r.organizationId,
    organizationName: r.organizationName,
    organizationSlug: r.organizationSlug,
    role: r.role as Role,
  }));
}

export type WorkspaceOverview = {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  adminCount: number;
};

/**
 * Org-level stats used by the workspace settings page. `adminCount`
 * powers the last-admin safeguard on demote/remove.
 */
export async function getWorkspaceOverview(
  organizationId: string,
): Promise<WorkspaceOverview | null> {
  const orgRow = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (orgRow.length === 0) return null;

  const counts = await db
    .select({
      memberCount: sql<number>`count(*)::int`,
      adminCount: sql<number>`sum(case when ${organizationMemberships.role} = 'admin' then 1 else 0 end)::int`,
    })
    .from(organizationMemberships)
    .innerJoin(profiles, eq(profiles.id, organizationMemberships.userId))
    .where(eq(organizationMemberships.organizationId, organizationId));

  return {
    id: orgRow[0].id,
    name: orgRow[0].name,
    slug: orgRow[0].slug,
    memberCount: counts[0]?.memberCount ?? 0,
    adminCount: counts[0]?.adminCount ?? 0,
  };
}

/**
 * Count of admins in an org. Cheap helper for last-admin checks.
 */
export async function countAdmins(organizationId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(organizationMemberships)
    .where(
      sql`${organizationMemberships.organizationId} = ${organizationId} and ${organizationMemberships.role} = 'admin'`,
    );
  return rows[0]?.count ?? 0;
}
