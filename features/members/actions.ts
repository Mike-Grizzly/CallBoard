"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  organizationMemberships,
  organizations,
  productionMemberships,
  productionRoles,
  productions,
  profiles,
} from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  requireCurrentUser,
  userCanAccessProduction,
  type CurrentUser,
} from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendOrgInviteNotification } from "@/features/notifications/announce";
import type { Role } from "@/types/roles";
import { ROLES } from "@/types/roles";
import { isValidEmail } from "./validation";
import { MEMBER_STATUSES, type MemberStatus } from "./constants";

export type MemberActionResult = {
  error?: string;
};

// Whether a user is a member of the given organization — the tenant boundary
// for people-management actions that take a target user/membership id.
async function userInOrg(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const [m] = await db
    .select({ id: organizationMemberships.id })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.organizationId, organizationId),
      ),
    )
    .limit(1);
  return !!m;
}

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
    .where(
      and(
        eq(organizationMemberships.id, membershipId),
        eq(organizationMemberships.organizationId, currentUser.organizationId),
      ),
    )
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
    .where(
      and(
        eq(organizationMemberships.id, membershipId),
        eq(organizationMemberships.organizationId, currentUser.organizationId),
      ),
    )
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

  if (!(await userCanAccessProduction(currentUser, productionId))) {
    return { error: "You don't have access to this production." };
  }

  // Only assign people who belong to the caller's organization.
  const orgMembers = await db
    .select({ userId: organizationMemberships.userId })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.organizationId, currentUser.organizationId),
        inArray(organizationMemberships.userId, userIds),
      ),
    );
  const allowed = new Set(orgMembers.map((m) => m.userId));
  userIds = userIds.filter((id) => allowed.has(id));
  if (userIds.length === 0) {
    return { error: "Select at least one member of your organization." };
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

  const [target] = await db
    .select({ productionId: productionMemberships.productionId })
    .from(productionMemberships)
    .where(eq(productionMemberships.id, membershipId))
    .limit(1);
  if (!target || !(await userCanAccessProduction(currentUser, target.productionId))) {
    return { error: "Member not found." };
  }

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

  const [target] = await db
    .select({ productionId: productionMemberships.productionId })
    .from(productionMemberships)
    .where(eq(productionMemberships.id, membershipId))
    .limit(1);
  if (!target || !(await userCanAccessProduction(currentUser, target.productionId))) {
    return { error: "Member not found." };
  }

  await db
    .delete(productionMemberships)
    .where(eq(productionMemberships.id, membershipId));

  revalidatePath(`/productions`);
  revalidatePath(`/people`);
  return {};
}

// ─── Cast assignment: bridge production_roles ↔ production_memberships ──

function personDisplayName(p: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.email;
}

/**
 * Load a production role and confirm the caller may manage casting on its
 * production. Shared by the assign/unassign/invite cast actions.
 */
async function loadRoleForCasting(currentUser: CurrentUser, roleId: string) {
  if (!roleId) return { error: "Missing role." as const };
  const [role] = await db
    .select({
      id: productionRoles.id,
      productionId: productionRoles.productionId,
      name: productionRoles.name,
      assignedUserId: productionRoles.assignedUserId,
    })
    .from(productionRoles)
    .where(eq(productionRoles.id, roleId))
    .limit(1);
  if (!role) return { error: "Character not found." as const };
  if (!(await userCanAccessProduction(currentUser, role.productionId))) {
    return { error: "You don't have access to this production." as const };
  }
  return { role };
}

/**
 * Cast an existing org member in a parsed character. Links the character to
 * the person AND grants production access: a new member is added as `cast`
 * with this character; an existing member keeps their production role (so a
 * director who also acts isn't demoted) but gets the character name.
 */
export async function assignRoleToMember(
  roleId: string,
  userId: string,
): Promise<MemberActionResult> {
  const currentUser = await requireCurrentUser();
  if (!can(currentUser.role, "productions:manage")) {
    return { error: "You don't have permission to manage casting." };
  }

  const loaded = await loadRoleForCasting(currentUser, roleId);
  if ("error" in loaded) return { error: loaded.error };
  const { role } = loaded;

  if (!userId) return { error: "Select a person." };
  const [person] = await db
    .select({
      id: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      email: profiles.email,
    })
    .from(profiles)
    .innerJoin(
      organizationMemberships,
      eq(organizationMemberships.userId, profiles.id),
    )
    .where(
      and(
        eq(profiles.id, userId),
        eq(organizationMemberships.organizationId, currentUser.organizationId),
      ),
    )
    .limit(1);
  if (!person) return { error: "That person isn't in your organization." };

  await db.transaction(async (tx) => {
    // Free any other character this person was assigned in this production —
    // one actor, one character (re-assigning moves them).
    await tx
      .update(productionRoles)
      .set({ assignedUserId: null, actor: null })
      .where(
        and(
          eq(productionRoles.productionId, role.productionId),
          eq(productionRoles.assignedUserId, userId),
        ),
      );

    await tx
      .update(productionRoles)
      .set({ assignedUserId: userId, actor: personDisplayName(person) })
      .where(eq(productionRoles.id, role.id));

    const [existing] = await tx
      .select({ id: productionMemberships.id })
      .from(productionMemberships)
      .where(
        and(
          eq(productionMemberships.userId, userId),
          eq(productionMemberships.productionId, role.productionId),
        ),
      )
      .limit(1);

    if (existing) {
      // Keep their existing production role; just set the character.
      await tx
        .update(productionMemberships)
        .set({ characterName: role.name })
        .where(eq(productionMemberships.id, existing.id));
    } else {
      await tx.insert(productionMemberships).values({
        userId,
        productionId: role.productionId,
        role: "cast",
        characterName: role.name,
      });
    }
  });

  revalidatePath("/productions");
  revalidatePath("/people");
  return {};
}

/**
 * Clear a character's casting. Leaves the person's production membership in
 * place (revoking access is a separate, explicit action on the team list);
 * only clears the link and the character name if it still matches this role.
 */
export async function unassignRole(
  roleId: string,
): Promise<MemberActionResult> {
  const currentUser = await requireCurrentUser();
  if (!can(currentUser.role, "productions:manage")) {
    return { error: "You don't have permission to manage casting." };
  }

  const loaded = await loadRoleForCasting(currentUser, roleId);
  if ("error" in loaded) return { error: loaded.error };
  const { role } = loaded;

  await db.transaction(async (tx) => {
    if (role.assignedUserId) {
      await tx
        .update(productionMemberships)
        .set({ characterName: null })
        .where(
          and(
            eq(productionMemberships.userId, role.assignedUserId),
            eq(productionMemberships.productionId, role.productionId),
            eq(productionMemberships.characterName, role.name),
          ),
        );
    }
    await tx
      .update(productionRoles)
      .set({ assignedUserId: null, actor: null })
      .where(eq(productionRoles.id, role.id));
  });

  revalidatePath("/productions");
  return {};
}

/**
 * Invite a brand-new person and cast them in a character in one step. Inviting
 * provisions an org account, so this needs the same `settings:manage` gate as
 * the People directory invite; it reuses `inviteMembers` (which creates the
 * account + the `cast` production membership with this character), then links
 * the character to the freshly-created profile.
 */
export async function inviteAndAssignRole(input: {
  roleId: string;
  firstName: string;
  lastName: string;
  email: string;
  sendInvite?: boolean;
}): Promise<MemberActionResult> {
  const currentUser = await requireCurrentUser();
  if (!can(currentUser.role, "settings:manage")) {
    return { error: "Only workspace admins can invite new people." };
  }

  const loaded = await loadRoleForCasting(currentUser, input.roleId);
  if ("error" in loaded) return { error: loaded.error };
  const { role } = loaded;

  const email = input.email.trim();
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };
  if (!input.firstName.trim() && !input.lastName.trim()) {
    return { error: "Enter the person's name." };
  }

  const result = await inviteMembers({
    people: [
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        role: "cast",
        assignments: [
          {
            productionId: role.productionId,
            role: "cast",
            characterName: role.name,
          },
        ],
      },
    ],
    sendInvite: input.sendInvite ?? true,
  });

  if (result.error) return { error: result.error };
  const row = result.results?.[0];
  if (row?.outcome === "error") {
    return { error: row.message ?? "Could not invite that person." };
  }

  // Link the character to the now-existing profile (created or pre-existing).
  const [person] = await db
    .select({ id: profiles.id, firstName: profiles.firstName, lastName: profiles.lastName, email: profiles.email })
    .from(profiles)
    .where(sql`lower(${profiles.email}) = ${email.toLowerCase()}`)
    .limit(1);
  if (person) {
    await db
      .update(productionRoles)
      .set({ assignedUserId: person.id, actor: personDisplayName(person) })
      .where(eq(productionRoles.id, role.id));
  }

  revalidatePath("/productions");
  revalidatePath("/people");
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
  organizationId: string,
) {
  if (!assignments || assignments.length === 0) return;

  for (const a of assignments) {
    if (!a.productionId || !ROLES.includes(a.role)) continue;

    // Skip assignments to productions outside the caller's organization.
    const [prod] = await db
      .select({ id: productions.id })
      .from(productions)
      .where(
        and(
          eq(productions.id, a.productionId),
          eq(productions.organizationId, organizationId),
        ),
      )
      .limit(1);
    if (!prod) continue;

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
            await applyAssignments(userId, person.assignments, currentUser.organizationId);
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
          await applyAssignments(userId, person.assignments, currentUser.organizationId);
          // They already have an account, so there's no Supabase invite email
          // with a set-password link — let them know they were added (in-app +
          // email, respecting their prefs). Best-effort.
          await sendOrgInviteNotification({
            userId,
            email,
            organizationId: currentUser.organizationId,
            organizationName,
            invitedByName,
          });
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
      await applyAssignments(userId, person.assignments, currentUser.organizationId);

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

  if (!(await userInOrg(userId, currentUser.organizationId))) {
    return { error: "Member not found." };
  }

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

  if (!(await userInOrg(userId, currentUser.organizationId))) {
    return { error: "Member not found." };
  }

  await db
    .update(profiles)
    .set({ status, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  revalidatePath("/people");
  return {};
}

/**
 * Remove a person from the CALLER'S organization. Deletes their org membership
 * and their production memberships within this org's productions. Only when
 * this was their LAST organization do we fully delete the global profile row
 * (which cascades to mentions, reports, documents, announcements, notes,
 * notifications, pins) and the auth user — so a person who belongs to other
 * workspaces is never nuked across all of them. There is no FK from
 * auth.users to profiles, so both sides are cleared explicitly on full delete.
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

  const orgId = currentUser.organizationId;
  if (!(await userInOrg(userId, orgId))) {
    return { error: "Member not found." };
  }

  try {
    // Remove their production memberships within this org's productions.
    const orgProductionIds = (
      await db
        .select({ id: productions.id })
        .from(productions)
        .where(eq(productions.organizationId, orgId))
    ).map((p) => p.id);
    if (orgProductionIds.length > 0) {
      await db
        .delete(productionMemberships)
        .where(
          and(
            eq(productionMemberships.userId, userId),
            inArray(productionMemberships.productionId, orgProductionIds),
          ),
        );
    }

    // Remove their membership in this organization.
    await db
      .delete(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.organizationId, orgId),
        ),
      );

    // Only when they belong to no organization at all do we delete the global
    // account. Otherwise they stay intact in their other workspaces.
    const remaining = await db
      .select({ id: organizationMemberships.id })
      .from(organizationMemberships)
      .where(eq(organizationMemberships.userId, userId))
      .limit(1);

    if (remaining.length === 0) {
      await db.delete(profiles).where(eq(profiles.id, userId));

      const admin = createSupabaseAdminClient();
      const { error } = await admin.auth.admin.deleteUser(userId);
      // Ignore "user not found" — the auth user may already be gone (e.g.
      // deleted from the Supabase dashboard).
      if (error && !/not\s*found/i.test(error.message)) {
        return { error: error.message };
      }
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

  if (!(await userInOrg(userId, currentUser.organizationId))) {
    return { error: "Person not found." };
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
