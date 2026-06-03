"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  organizationMemberships,
  organizations,
  productionMemberships,
  profiles,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/types/roles";
import { ROLES } from "@/types/roles";
import { isValidEmail } from "./validation";
import { MEMBER_STATUSES, type MemberStatus } from "./constants";

export type MemberActionResult = {
  error?: string;
};

export async function updateMemberRole(
  _prevState: MemberActionResult | undefined,
  formData: FormData,
): Promise<MemberActionResult> {
  const currentUser = await requireCurrentUser();

  if (!can(currentUser.role, "settings:manage")) {
    return { error: "You don't have permission to manage team members." };
  }

  const membershipId = formData.get("membership_id") as string;
  const newRole = formData.get("role") as string;

  if (!membershipId || !newRole) {
    return { error: "Missing required fields." };
  }

  if (!ROLES.includes(newRole as Role)) {
    return { error: "Invalid role." };
  }

  // Prevent admin from changing their own role
  const membership = await db
    .select()
    .from(organizationMemberships)
    .where(eq(organizationMemberships.id, membershipId))
    .limit(1);

  if (membership.length === 0) {
    return { error: "Member not found." };
  }

  if (membership[0].userId === currentUser.id) {
    return { error: "You cannot change your own role." };
  }

  // Last-admin safeguard: refuse to demote the sole remaining admin so the
  // workspace can't get into a zero-admin state that would lock everyone
  // out of settings.
  if (membership[0].role === "admin" && newRole !== "admin") {
    const remaining = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, currentUser.organizationId),
          eq(organizationMemberships.role, "admin"),
        ),
      );
    if ((remaining[0]?.count ?? 0) <= 1) {
      return {
        error:
          "Promote another admin first — this workspace needs at least one.",
      };
    }
  }

  await db
    .update(organizationMemberships)
    .set({ role: newRole })
    .where(eq(organizationMemberships.id, membershipId));

  revalidatePath("/settings/members");
  return {};
}

export async function removeMember(
  _prevState: MemberActionResult | undefined,
  formData: FormData,
): Promise<MemberActionResult> {
  const currentUser = await requireCurrentUser();

  if (!can(currentUser.role, "settings:manage")) {
    return { error: "You don't have permission to manage team members." };
  }

  const membershipId = formData.get("membership_id") as string;

  if (!membershipId) {
    return { error: "Missing membership ID." };
  }

  const membership = await db
    .select()
    .from(organizationMemberships)
    .where(eq(organizationMemberships.id, membershipId))
    .limit(1);

  if (membership.length === 0) {
    return { error: "Member not found." };
  }

  if (membership[0].userId === currentUser.id) {
    return { error: "You cannot remove yourself." };
  }

  if (membership[0].role === "admin") {
    const remaining = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, currentUser.organizationId),
          eq(organizationMemberships.role, "admin"),
        ),
      );
    if ((remaining[0]?.count ?? 0) <= 1) {
      return {
        error:
          "Promote another admin first — this workspace needs at least one.",
      };
    }
  }

  await db
    .delete(organizationMemberships)
    .where(eq(organizationMemberships.id, membershipId));

  revalidatePath("/settings/members");
  revalidatePath("/people");
  return {};
}

export async function assignProductionMember(
  _prevState: MemberActionResult | undefined,
  formData: FormData,
): Promise<MemberActionResult> {
  const currentUser = await requireCurrentUser();

  if (!can(currentUser.role, "productions:manage")) {
    return { error: "You don't have permission to manage productions." };
  }

  const productionId = formData.get("production_id") as string;
  const role = formData.get("role") as string;
  const userIdsJson = formData.get("user_ids") as string;

  if (!productionId || !role) {
    return { error: "Missing required fields." };
  }

  if (!ROLES.includes(role as Role)) {
    return { error: "Invalid role." };
  }

  let userIds: string[];
  try {
    userIds = JSON.parse(userIdsJson);
  } catch {
    return { error: "Invalid member selection." };
  }

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { error: "Select at least one member." };
  }

  const characterName = (formData.get("character_name") as string | null)?.trim() || null;

  for (const userId of userIds) {
    const existing = await db
      .select()
      .from(productionMemberships)
      .where(
        and(
          eq(productionMemberships.userId, userId),
          eq(productionMemberships.productionId, productionId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(productionMemberships)
        .set({ role, ...(characterName !== null ? { characterName } : {}) })
        .where(eq(productionMemberships.id, existing[0].id));
    } else {
      await db.insert(productionMemberships).values({
        userId,
        productionId,
        role,
        characterName,
      });
    }
  }

  revalidatePath(`/productions`);
  return {};
}

export async function updateCharacterName(
  _prevState: MemberActionResult | undefined,
  formData: FormData,
): Promise<MemberActionResult> {
  const currentUser = await requireCurrentUser();

  if (!can(currentUser.role, "productions:manage")) {
    return { error: "You don't have permission to manage productions." };
  }

  const membershipId = formData.get("membership_id") as string;
  const characterName =
    (formData.get("character_name") as string | null)?.trim() || null;

  if (!membershipId) return { error: "Missing membership ID." };

  await db
    .update(productionMemberships)
    .set({ characterName })
    .where(eq(productionMemberships.id, membershipId));

  revalidatePath(`/productions`);
  return {};
}

export async function removeProductionMember(
  _prevState: MemberActionResult | undefined,
  formData: FormData,
): Promise<MemberActionResult> {
  const currentUser = await requireCurrentUser();

  if (!can(currentUser.role, "productions:manage")) {
    return { error: "You don't have permission to manage productions." };
  }

  const membershipId = formData.get("membership_id") as string;

  if (!membershipId) {
    return { error: "Missing membership ID." };
  }

  await db
    .delete(productionMemberships)
    .where(eq(productionMemberships.id, membershipId));

  revalidatePath(`/productions`);
  revalidatePath(`/people`);
  return {};
}

// ─── People directory: invite & manage org members ────────────────────

export type ProductionAssignmentInput = {
  productionId: string;
  role: Role;
  characterName?: string | null;
};

export type InvitePersonInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  pronouns?: string | null;
  role: Role;
  assignments?: ProductionAssignmentInput[];
};

export type InviteMembersInput = {
  people: InvitePersonInput[];
  sendInvite: boolean;
};

export type InviteRowResult = {
  email: string;
  name: string;
  outcome: "invited" | "added" | "skipped" | "error";
  message?: string;
};

export type InviteMembersResult = {
  error?: string;
  results?: InviteRowResult[];
  summary?: {
    invited: number;
    added: number;
    skipped: number;
    errored: number;
  };
};

/** Insert production memberships, skipping any the user already has. */
async function applyAssignments(
  userId: string,
  assignments: ProductionAssignmentInput[] | undefined,
) {
  if (!assignments || assignments.length === 0) return;

  for (const a of assignments) {
    if (!a.productionId || !ROLES.includes(a.role)) continue;

    const existing = await db
      .select({ id: productionMemberships.id })
      .from(productionMemberships)
      .where(
        and(
          eq(productionMemberships.userId, userId),
          eq(productionMemberships.productionId, a.productionId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(productionMemberships)
        .set({
          role: a.role,
          characterName: a.characterName?.trim() || null,
        })
        .where(eq(productionMemberships.id, existing[0].id));
    } else {
      await db.insert(productionMemberships).values({
        userId,
        productionId: a.productionId,
        role: a.role,
        characterName: a.characterName?.trim() || null,
      });
    }
  }
}

/**
 * Bulk-invite people to the organization. Each person becomes a Supabase
 * auth user (via the Admin API) plus a `profiles` row and an org membership;
 * any production assignments are applied in the same pass.
 */
export async function inviteMembers(
  input: InviteMembersInput,
): Promise<InviteMembersResult> {
  const currentUser = await requireCurrentUser();

  if (!can(currentUser.role, "settings:manage")) {
    return { error: "You don't have permission to manage team members." };
  }

  if (!input.people || input.people.length === 0) {
    return { error: "No people to add." };
  }

  // Dedupe within the batch by email.
  const seen = new Set<string>();
  const people = input.people.filter((p) => {
    const key = p.email.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let admin: ReturnType<typeof createSupabaseAdminClient> | null = null;
  const getAdmin = () => {
    if (!admin) admin = createSupabaseAdminClient();
    return admin;
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const redirectTo = siteUrl
    ? `${siteUrl}/auth/callback?next=/invite/accept`
    : undefined;

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, currentUser.organizationId))
    .limit(1);
  const organizationName = org?.name ?? "your team";
  const invitedByName =
    `${currentUser.firstName} ${currentUser.lastName}`.trim() ||
    currentUser.email;

  const results: InviteRowResult[] = [];

  for (const person of people) {
    const email = person.email.trim();
    const firstName = person.firstName.trim();
    const lastName = person.lastName.trim();
    const name = `${firstName} ${lastName}`.trim() || email;

    if (!isValidEmail(email)) {
      results.push({
        email,
        name,
        outcome: "error",
        message: "Invalid email address.",
      });
      continue;
    }
    if (!firstName && !lastName) {
      results.push({
        email,
        name,
        outcome: "error",
        message: "Missing name.",
      });
      continue;
    }
    if (!ROLES.includes(person.role)) {
      results.push({
        email,
        name,
        outcome: "error",
        message: "Invalid role.",
      });
      continue;
    }

    try {
      const existingProfile = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(sql`lower(${profiles.email}) = ${email.toLowerCase()}`)
        .limit(1);

      if (existingProfile.length > 0) {
        const userId = existingProfile[0].id;

        // A profile row doesn't guarantee a real login: legacy/seed rows can
        // exist with no matching auth.users account. Those people can't sign
        // in or reset a password, so re-inviting must actually provision an
        // account rather than report a misleading success. Only treat the
        // profile as an existing member if it has a login.
        const { data: authLookup } =
          await getAdmin().auth.admin.getUserById(userId);

        if (authLookup?.user) {
          const existingMembership = await db
            .select({ id: organizationMemberships.id })
            .from(organizationMemberships)
            .where(
              and(
                eq(organizationMemberships.userId, userId),
                eq(
                  organizationMemberships.organizationId,
                  currentUser.organizationId,
                ),
              ),
            )
            .limit(1);

          if (existingMembership.length > 0) {
            await applyAssignments(userId, person.assignments);
            results.push({
              email,
              name,
              outcome: "skipped",
              message: "Already in your organization.",
            });
            continue;
          }

          await db.insert(organizationMemberships).values({
            userId,
            organizationId: currentUser.organizationId,
            role: person.role,
          });
          await applyAssignments(userId, person.assignments);
          results.push({
            email,
            name,
            outcome: "added",
            message: "Existing account added to your organization.",
          });
          continue;
        }

        // Login-less orphan profile — remove it (cascades its memberships)
        // and fall through to the create path below, which provisions a real
        // auth account + invite email.
        await db.delete(profiles).where(eq(profiles.id, userId));
      }

      const metadata = {
        first_name: firstName,
        last_name: lastName,
        invited_by_name: invitedByName,
        organization_name: organizationName,
      };

      const { data, error } = input.sendInvite
        ? await getAdmin().auth.admin.inviteUserByEmail(email, {
            data: metadata,
            redirectTo,
          })
        : await getAdmin().auth.admin.createUser({
            email,
            email_confirm: false,
            user_metadata: metadata,
          });

      if (error || !data.user) {
        results.push({
          email,
          name,
          outcome: "error",
          message: error?.message ?? "Could not create account.",
        });
        continue;
      }

      const userId = data.user.id;
      await db.insert(profiles).values({
        id: userId,
        email,
        firstName,
        lastName,
        phone: person.phone?.trim() || null,
        pronouns: person.pronouns?.trim() || null,
        status: input.sendInvite ? "invited" : "active",
      });
      await db.insert(organizationMemberships).values({
        userId,
        organizationId: currentUser.organizationId,
        role: person.role,
      });
      await applyAssignments(userId, person.assignments);

      results.push({
        email,
        name,
        outcome: input.sendInvite ? "invited" : "added",
      });
    } catch (err) {
      results.push({
        email,
        name,
        outcome: "error",
        message:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  revalidatePath("/people");

  return {
    results,
    summary: {
      invited: results.filter((r) => r.outcome === "invited").length,
      added: results.filter((r) => r.outcome === "added").length,
      skipped: results.filter((r) => r.outcome === "skipped").length,
      errored: results.filter((r) => r.outcome === "error").length,
    },
  };
}

export async function updatePersonProfile(
  _prevState: MemberActionResult | undefined,
  formData: FormData,
): Promise<MemberActionResult> {
  const currentUser = await requireCurrentUser();

  if (!can(currentUser.role, "settings:manage")) {
    return { error: "You don't have permission to manage team members." };
  }

  const userId = formData.get("user_id") as string;
  if (!userId) return { error: "Missing user ID." };

  const firstName = ((formData.get("first_name") as string) ?? "").trim();
  const lastName = ((formData.get("last_name") as string) ?? "").trim();
  const phone = ((formData.get("phone") as string) ?? "").trim() || null;
  const pronouns = ((formData.get("pronouns") as string) ?? "").trim() || null;

  if (!firstName && !lastName) {
    return { error: "A name is required." };
  }

  await db
    .update(profiles)
    .set({ firstName, lastName, phone, pronouns, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  revalidatePath("/people");
  return {};
}

export async function setMemberStatus(
  userId: string,
  status: MemberStatus,
): Promise<MemberActionResult> {
  const currentUser = await requireCurrentUser();

  if (!can(currentUser.role, "settings:manage")) {
    return { error: "You don't have permission to manage team members." };
  }

  if (!MEMBER_STATUSES.includes(status)) {
    return { error: "Invalid status." };
  }
  if (userId === currentUser.id) {
    return { error: "You cannot change your own status." };
  }

  await db
    .update(profiles)
    .set({ status, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  revalidatePath("/people");
  return {};
}

/**
 * Permanently delete a person. Removes their profile row (which cascades to
 * org/production memberships, mentions, reports, documents, announcements,
 * notes, notifications, pins) and then deletes their auth user. There is no
 * FK from auth.users to profiles in this project, so both sides must be
 * cleared explicitly. Deletes are destructive — any content they authored
 * goes with them.
 */
export async function deletePerson(
  userId: string,
): Promise<MemberActionResult> {
  const currentUser = await requireCurrentUser();

  if (!can(currentUser.role, "settings:manage")) {
    return { error: "You don't have permission to manage team members." };
  }

  if (userId === currentUser.id) {
    return { error: "You cannot delete your own account." };
  }

  try {
    await db.delete(profiles).where(eq(profiles.id, userId));

    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    // Ignore "user not found" — the auth user may already be gone (e.g.
    // deleted from the Supabase dashboard); the profile cleanup above is
    // what actually clears them from /people.
    if (error && !/not\s*found/i.test(error.message)) {
      return { error: error.message };
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not delete person.",
    };
  }

  revalidatePath("/people");
  revalidatePath("/settings/members");
  return {};
}

export async function resendInvite(
  userId: string,
): Promise<MemberActionResult> {
  const currentUser = await requireCurrentUser();

  if (!can(currentUser.role, "settings:manage")) {
    return { error: "You don't have permission to manage team members." };
  }

  const rows = await db
    .select({ email: profiles.email })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (rows.length === 0) return { error: "Person not found." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const redirectTo = siteUrl
    ? `${siteUrl}/auth/callback?next=/invite/accept`
    : undefined;

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, currentUser.organizationId))
    .limit(1);
  const organizationName = org?.name ?? "your team";
  const invitedByName =
    `${currentUser.firstName} ${currentUser.lastName}`.trim() ||
    currentUser.email;

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.inviteUserByEmail(rows[0].email, {
      data: {
        invited_by_name: invitedByName,
        organization_name: organizationName,
      },
      redirectTo,
    });
    if (error) return { error: error.message };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not resend invite.",
    };
  }

  revalidatePath("/people");
  return {};
}
