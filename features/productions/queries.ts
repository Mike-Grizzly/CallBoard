import { cache } from "react";
import { db } from "@/db";
import { productions, productionMemberships } from "@/db/schema";
import { and, eq, desc, isNull, isNotNull } from "drizzle-orm";

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

export async function getUserProductions(userId: string) {
  const rows = await db
    .select({
      id: productions.id,
      title: productions.title,
      slug: productions.slug,
      status: productions.status,
      color: productions.color,
      openingDate: productions.openingDate,
      closingDate: productions.closingDate,
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
