import { db } from "@/db";
import {
  organizationMemberships,
  organizations,
  profiles,
  mentions,
  notifications,
} from "@/db/schema";
import { and, count, eq, gt, isNull, sql } from "drizzle-orm";
import type { Role } from "@/types/roles";

export type UserMembership = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: Role;
};

/**
 * Per-workspace "new activity" counts for the cross-org switcher bubbles:
 * mentions + notifications addressed to the user that arrived since they last
 * switched into that workspace (organization_memberships.last_viewed_at).
 * Returns a map of organizationId → count (only orgs with a non-zero count).
 */
export async function getWorkspaceAlertCounts(
  userId: string,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const add = (orgId: string, n: number) => {
    counts[orgId] = (counts[orgId] ?? 0) + n;
  };

  const mentionRows = await db
    .select({ orgId: organizationMemberships.organizationId, n: count() })
    .from(organizationMemberships)
    .innerJoin(
      mentions,
      and(
        eq(mentions.organizationId, organizationMemberships.organizationId),
        eq(mentions.mentionedUserId, organizationMemberships.userId),
        gt(mentions.createdAt, organizationMemberships.lastViewedAt),
      ),
    )
    .where(eq(organizationMemberships.userId, userId))
    .groupBy(organizationMemberships.organizationId);
  for (const r of mentionRows) add(r.orgId, Number(r.n));

  const notifRows = await db
    .select({ orgId: organizationMemberships.organizationId, n: count() })
    .from(organizationMemberships)
    .innerJoin(
      notifications,
      and(
        eq(notifications.organizationId, organizationMemberships.organizationId),
        eq(notifications.recipientId, organizationMemberships.userId),
        gt(notifications.createdAt, organizationMemberships.lastViewedAt),
      ),
    )
    .where(eq(organizationMemberships.userId, userId))
    .groupBy(organizationMemberships.organizationId);
  for (const r of notifRows) add(r.orgId, Number(r.n));

  return counts;
}

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
    .where(
      and(
        eq(organizationMemberships.userId, userId),
        isNull(organizations.deletedAt),
      ),
    )
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
