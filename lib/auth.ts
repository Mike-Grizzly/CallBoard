import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  profiles,
  organizationMemberships,
  productionMemberships,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrganization } from "@/lib/organization";
import { can } from "@/lib/permissions";
import type { Role } from "@/types/roles";

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
};

function fallbackOrgName(firstName: string, lastName: string, email: string) {
  const personal = [firstName, lastName].filter(Boolean).join(" ").trim();
  const label = personal || email.split("@")[0] || "New";
  return `${label}'s organization`;
}

/**
 * Resolves the signed-in user, their org, and their role.
 *
 * Wrapped in `cache()`: the layout and the page of one request each call
 * `requireCurrentUser()`, and without dedup this whole chain — an auth
 * network call plus several DB queries — would run twice per navigation.
 *
 * Multi-org: a user's org is determined by their `organization_memberships`
 * row. Invited users get a profile + membership at invite time (see
 * `features/members/actions.ts`). Self-signup lands here without either,
 * and we create a fresh org with this user as admin.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, authUser.id))
    .limit(1);

  if (existing.length === 0) {
    // Self-signup: no profile yet. Create a new org with this user as admin.
    const meta = authUser.user_metadata ?? {};
    const firstName = (meta.first_name as string) || "";
    const lastName = (meta.last_name as string) || "";
    const email = authUser.email ?? "";
    const requestedOrgName = ((meta.organization_name as string) || "").trim();
    const orgName =
      requestedOrgName || fallbackOrgName(firstName, lastName, email);

    const org = await createOrganization(orgName);

    await db.insert(profiles).values({
      id: authUser.id,
      email,
      firstName,
      lastName,
    });

    await db.insert(organizationMemberships).values({
      userId: authUser.id,
      organizationId: org.id,
      role: "admin",
    });

    return {
      id: authUser.id,
      email,
      firstName,
      lastName,
      role: "admin",
      organizationId: org.id,
    };
  }

  // An invited user signing in for the first time already has a profile
  // (created at invite time). Promote them from "invited" to "active".
  if (existing[0].status === "invited") {
    await db
      .update(profiles)
      .set({ status: "active", lastActiveAt: new Date() })
      .where(eq(profiles.id, authUser.id));
  }

  const membership = await db
    .select()
    .from(organizationMemberships)
    .where(eq(organizationMemberships.userId, authUser.id))
    .limit(1);

  if (membership.length === 0) {
    // Profile exists but no org membership — shouldn't normally happen
    // (invites create both atomically). Recover by giving them a fresh org
    // as admin so they aren't stuck in a broken state.
    const org = await createOrganization(
      fallbackOrgName(
        existing[0].firstName,
        existing[0].lastName,
        existing[0].email,
      ),
    );

    await db.insert(organizationMemberships).values({
      userId: authUser.id,
      organizationId: org.id,
      role: "admin",
    });

    return {
      id: existing[0].id,
      email: existing[0].email,
      firstName: existing[0].firstName,
      lastName: existing[0].lastName,
      role: "admin",
      organizationId: org.id,
    };
  }

  return {
    id: existing[0].id,
    email: existing[0].email,
    firstName: existing[0].firstName,
    lastName: existing[0].lastName,
    role: membership[0].role as Role,
    organizationId: membership[0].organizationId,
  };
});

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Whether the user may access a production's data. Mirrors the page-level
 * gate: holders of `productions:manage` reach any production; everyone else
 * needs a production membership. Used to guard signed-URL generation so a
 * caller cannot pull files for a production they are not part of.
 */
export async function userCanAccessProduction(
  user: CurrentUser,
  productionId: string,
): Promise<boolean> {
  if (can(user.role, "productions:manage")) return true;

  const rows = await db
    .select({ id: productionMemberships.id })
    .from(productionMemberships)
    .where(
      and(
        eq(productionMemberships.userId, user.id),
        eq(productionMemberships.productionId, productionId),
      ),
    )
    .limit(1);

  return rows.length > 0;
}
