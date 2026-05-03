import { db } from "@/db";
import { productions } from "@/db/schema";
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
