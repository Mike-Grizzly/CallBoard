import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function uniqueSlugFor(name: string): Promise<string> {
  const base = slugify(name) || "org";
  // Try the bare slug first, then retry with a short random suffix on collision.
  // 4 hex chars = 65k namespace; collisions during the same insert window are
  // negligible. Loop bounded to avoid an unkillable retry path.
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate =
      attempt === 0 ? base : `${base}-${randomBytes(2).toString("hex")}`;
    const taken = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1);
    if (taken.length === 0) return candidate;
  }
  throw new Error("Could not generate a unique organization slug.");
}

/**
 * Creates a new organization. Caller is responsible for inserting the
 * creator's `organization_memberships` row (typically with role "admin").
 */
export async function createOrganization(name: string) {
  const trimmed = name.trim() || "New organization";
  const slug = await uniqueSlugFor(trimmed);
  const [org] = await db
    .insert(organizations)
    .values({ name: trimmed, slug })
    .returning();
  return org;
}
