import { db } from "@/db";
import { announcements, profiles, productions, productionMemberships } from "@/db/schema";
import { eq, desc, and, or, isNull, inArray } from "drizzle-orm";

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
