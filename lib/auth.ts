import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, organizationMemberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import type { Role } from "@/types/roles";

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
};

/**
 * Resolves the signed-in user, their org, and their role.
 *
 * Wrapped in `cache()`: the layout and the page of one request each call
 * `requireCurrentUser()`, and without dedup this whole chain — an auth
 * network call plus several DB queries — would run twice per navigation.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const [org, existing] = await Promise.all([
    getOrCreateDefaultOrganization(),
    db.select().from(profiles).where(eq(profiles.id, authUser.id)).limit(1),
  ]);

  if (existing.length === 0) {
    const meta = authUser.user_metadata ?? {};
    await db.insert(profiles).values({
      id: authUser.id,
      email: authUser.email ?? "",
      firstName: (meta.first_name as string) || "",
      lastName: (meta.last_name as string) || "",
      requestedRole: (meta.requested_role as string) || null,
    });

    const memberCount = await db
      .select()
      .from(organizationMemberships)
      .where(eq(organizationMemberships.organizationId, org.id))
      .limit(1);

    // First user in the org becomes admin
    const role: Role = memberCount.length === 0 ? "admin" : "cast";

    await db.insert(organizationMemberships).values({
      userId: authUser.id,
      organizationId: org.id,
      role,
    });

    return {
      id: authUser.id,
      email: authUser.email ?? "",
      firstName: (meta.first_name as string) || "",
      lastName: (meta.last_name as string) || "",
      role,
      organizationId: org.id,
    };
  }

  const membership = await db
    .select()
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, authUser.id),
        eq(organizationMemberships.organizationId, org.id),
      ),
    )
    .limit(1);

  if (membership.length === 0) {
    const memberCount = await db
      .select()
      .from(organizationMemberships)
      .where(eq(organizationMemberships.organizationId, org.id))
      .limit(1);

    const role: Role = memberCount.length === 0 ? "admin" : "cast";

    await db.insert(organizationMemberships).values({
      userId: authUser.id,
      organizationId: org.id,
      role,
    });

    return {
      id: existing[0].id,
      email: existing[0].email,
      firstName: existing[0].firstName,
      lastName: existing[0].lastName,
      role,
      organizationId: org.id,
    };
  }

  return {
    id: existing[0].id,
    email: existing[0].email,
    firstName: existing[0].firstName,
    lastName: existing[0].lastName,
    role: membership[0].role as Role,
    organizationId: org.id,
  };
});

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
