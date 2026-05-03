import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_ORG_SLUG = "default";

/**
 * Returns the default organization, creating it if it doesn't exist.
 *
 * MVP: we operate with a single organization. This helper removes
 * the need for a manual seed step — the org is created lazily on
 * first use.
 */
export async function getOrCreateDefaultOrganization() {
  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, DEFAULT_ORG_SLUG))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [org] = await db
    .insert(organizations)
    .values({
      name: "Default Organization",
      slug: DEFAULT_ORG_SLUG,
    })
    .returning();

  return org;
}
