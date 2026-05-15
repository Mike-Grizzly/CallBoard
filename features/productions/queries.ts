import { db } from "@/db";
import { productions, productionMemberships } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

export async function getProductionsByOrganization(organizationId: string) {
  return db
    .select()
    .from(productions)
    .where(eq(productions.organizationId, organizationId))
    .orderBy(desc(productions.createdAt));
}

export async function getProductionBySlug(
  organizationId: string,
  slug: string,
) {
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
}

export async function getUserProductions(userId: string) {
  const rows = await db
    .select({
      id: productions.id,
      title: productions.title,
      slug: productions.slug,
      status: productions.status,
      openingDate: productions.openingDate,
      closingDate: productions.closingDate,
      role: productionMemberships.role,
    })
    .from(productionMemberships)
    .innerJoin(
      productions,
      eq(productionMemberships.productionId, productions.id),
    )
    .where(eq(productionMemberships.userId, userId))
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
