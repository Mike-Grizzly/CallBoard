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

/** Optional self-reported company profile gathered by the create-workspace
 *  wizard. All fields are optional; omitted ones are left null. */
export type OrganizationProfile = {
  annualShows?: string | null;
  teamSize?: string | null;
  productionTypes?: string[];
};

/**
 * Creates a new organization. Caller is responsible for inserting the
 * creator's `organization_memberships` row (typically with role "admin").
 * `profile` carries the optional onboarding survey answers, when present.
 * Pass `isPersonalWorkspace: true` for a single-person personal workspace (a
 * designer/individual signup) — it is gated by the owner's Studio seat, not org
 * billing (see features/billing/guard.ts).
 */
export async function createOrganization(
  name: string,
  profile?: OrganizationProfile,
  opts?: { isPersonalWorkspace?: boolean },
) {
  const trimmed = name.trim() || "New organization";
  const slug = await uniqueSlugFor(trimmed);
  const [org] = await db
    .insert(organizations)
    // New orgs start on the free plan with NO trial clock yet — the 60-day
    // trial is anchored to the org's first production (see
    // features/billing/guard.ts → startTrialIfFirstProduction), not signup,
    // so an empty workspace can sit at $0 indefinitely until it runs a show.
    .values({
      name: trimmed,
      slug,
      isPersonalWorkspace: opts?.isPersonalWorkspace ?? false,
      annualShows: profile?.annualShows ?? null,
      teamSize: profile?.teamSize ?? null,
      productionTypes:
        profile?.productionTypes && profile.productionTypes.length > 0
          ? profile.productionTypes
          : null,
    })
    .returning();
  return org;
}
