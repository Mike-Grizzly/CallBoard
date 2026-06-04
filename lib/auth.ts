import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  profiles,
  organizations,
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
  organizationName: string;
  organizationLogoUrl: string | null;
};

function fallbackOrgName(firstName: string, lastName: string, email: string) {
  const personal = [firstName, lastName].filter(Boolean).join(" ").trim();
  const label = personal || email.split("@")[0] || "New";
  return `${label}'s organization`;
}

async function resolveActiveMembership(
  userId: string,
  selectedOrgId: string | null,
) {
  const memberships = await db
    .select({
      id: organizationMemberships.id,
      organizationId: organizationMemberships.organizationId,
      role: organizationMemberships.role,
      organizationName: organizations.name,
      organizationLogoUrl: organizations.logoUrl,
    })
    .from(organizationMemberships)
    .innerJoin(
      organizations,
      eq(organizations.id, organizationMemberships.organizationId),
    )
    .where(eq(organizationMemberships.userId, userId));

  if (memberships.length === 0) return null;

  const selected =
    selectedOrgId &&
    memberships.find((m) => m.organizationId === selectedOrgId);

  return selected ?? memberships[0];
}

/**
 * Resolves the signed-in user, their org, and their role.
 *
 * Wrapped in `cache()`: the layout and the page of one request each call
 * `requireCurrentUser()`, and without dedup this whole chain — an auth
 * network call plus several DB queries — would run twice per navigation.
 *
 * Multi-org: a user's "current org" is `profiles.selected_organization_id`
 * if it points at one of their active memberships; otherwise it falls back
 * to their first membership (so a user can be in multiple orgs and switch
 * between them, but a stale or missing selection is self-healing). Invited
 * users get a profile + membership at invite time (see
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
    //
    // SECURITY: profiles are matched to logins by auth UID ONLY (above) — never
    // by email. Do NOT "fix" duplicate/orphan profiles here by looking up an
    // existing profile by `authUser.email` and adopting it: a login-less or
    // pre-seeded profile may carry org memberships and a role, so adopting it on
    // self-signup would let anyone who can verify an email inherit that role —
    // an account-takeover vector. Email-based reconciliation belongs only in the
    // admin-gated invite flow (features/members/actions.ts → inviteMembers).
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
      selectedOrganizationId: org.id,
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
      organizationName: org.name,
      organizationLogoUrl: org.logoUrl ?? null,
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

  const membership = await resolveActiveMembership(
    authUser.id,
    existing[0].selectedOrganizationId,
  );

  if (!membership) {
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

    await db
      .update(profiles)
      .set({ selectedOrganizationId: org.id })
      .where(eq(profiles.id, authUser.id));

    return {
      id: existing[0].id,
      email: existing[0].email,
      firstName: existing[0].firstName,
      lastName: existing[0].lastName,
      role: "admin",
      organizationId: org.id,
      organizationName: org.name,
      organizationLogoUrl: org.logoUrl ?? null,
    };
  }

  // If the stored selection didn't resolve (org deleted, user removed from
  // it, or never set), persist the fallback we just picked so future
  // requests are deterministic and the column accurately reflects what the
  // user is looking at.
  if (existing[0].selectedOrganizationId !== membership.organizationId) {
    await db
      .update(profiles)
      .set({ selectedOrganizationId: membership.organizationId })
      .where(eq(profiles.id, authUser.id));
  }

  return {
    id: existing[0].id,
    email: existing[0].email,
    firstName: existing[0].firstName,
    lastName: existing[0].lastName,
    role: membership.role as Role,
    organizationId: membership.organizationId,
    organizationName: membership.organizationName,
    organizationLogoUrl: membership.organizationLogoUrl ?? null,
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
 * Returns the user's previous `last_active_at` and stamps it to now in one go.
 * Used by the dashboard to detect "welcome back" (a gap since the last visit).
 * The read happens before the write, so the caller sees the prior timestamp.
 * Best-effort: a failure here must never break the dashboard, so it swallows
 * errors and returns null.
 */
export async function markActiveAndGetPrevious(
  userId: string,
): Promise<Date | null> {
  try {
    const [row] = await db
      .select({ lastActiveAt: profiles.lastActiveAt })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    const previous = row?.lastActiveAt ?? null;

    await db
      .update(profiles)
      .set({ lastActiveAt: new Date() })
      .where(eq(profiles.id, userId));

    return previous;
  } catch {
    return null;
  }
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
