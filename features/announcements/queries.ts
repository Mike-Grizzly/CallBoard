import { db } from "@/db";
import { announcements, profiles, productions, productionMemberships } from "@/db/schema";
import { eq, desc, and, or, isNull, inArray, count } from "drizzle-orm";

const announcementFields = {
  id: announcements.id,
  title: announcements.title,
  body: announcements.body,
  pinned: announcements.pinned,
  createdAt: announcements.createdAt,
  productionId: announcements.productionId,
  createdById: announcements.createdBy,
  authorFirstName: profiles.firstName,
  authorLastName: profiles.lastName,
  authorEmail: profiles.email,
  productionTitle: productions.title,
};

export async function getAnnouncementsByProduction(productionId: string, orgId: string) {
  return db
    .select(announcementFields)
    .from(announcements)
    .innerJoin(profiles, eq(announcements.createdBy, profiles.id))
    .leftJoin(productions, eq(announcements.productionId, productions.id))
    .where(
      and(
        eq(announcements.organizationId, orgId),
        or(
          eq(announcements.productionId, productionId),
          isNull(announcements.productionId),
        ),
      ),
    )
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
}

/**
 * Count of announcements visible on a production page — the production's
 * own plus org-wide ones. Used for the tab badge.
 */
export async function getAnnouncementCountByProduction(
  productionId: string,
  orgId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(announcements)
    .where(
      and(
        eq(announcements.organizationId, orgId),
        or(
          eq(announcements.productionId, productionId),
          isNull(announcements.productionId),
        ),
      ),
    );
  return row?.value ?? 0;
}

export async function getAnnouncementsForUser(
  userId: string,
  orgId: string,
  canManageProductions: boolean,
) {
  if (canManageProductions) {
    return db
      .select(announcementFields)
      .from(announcements)
      .innerJoin(profiles, eq(announcements.createdBy, profiles.id))
      .leftJoin(productions, eq(announcements.productionId, productions.id))
      .where(eq(announcements.organizationId, orgId))
      .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
  }

  const memberships = await db
    .select({ productionId: productionMemberships.productionId })
    .from(productionMemberships)
    .where(eq(productionMemberships.userId, userId));

  const productionIds = memberships.map((m) => m.productionId);

  return db
    .select(announcementFields)
    .from(announcements)
    .innerJoin(profiles, eq(announcements.createdBy, profiles.id))
    .leftJoin(productions, eq(announcements.productionId, productions.id))
    .where(
      and(
        eq(announcements.organizationId, orgId),
        productionIds.length > 0
          ? or(isNull(announcements.productionId), inArray(announcements.productionId, productionIds))
          : isNull(announcements.productionId),
      ),
    )
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
}

export type AnnouncementWithMeta = Awaited<
  ReturnType<typeof getAnnouncementsByProduction>
>[number];
