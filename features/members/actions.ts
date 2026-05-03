"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  organizationMemberships,
  productionMemberships,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import type { Role } from "@/types/roles";
import { ROLES } from "@/types/roles";

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

  await db
    .delete(organizationMemberships)
    .where(eq(organizationMemberships.id, membershipId));

  revalidatePath("/settings/members");
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

  const userId = formData.get("user_id") as string;
  const productionId = formData.get("production_id") as string;
  const role = formData.get("role") as string;

  if (!userId || !productionId || !role) {
    return { error: "Missing required fields." };
  }

  if (!ROLES.includes(role as Role)) {
    return { error: "Invalid role." };
  }

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
      .set({ role })
      .where(eq(productionMemberships.id, existing[0].id));
  } else {
    await db.insert(productionMemberships).values({
      userId,
      productionId,
      role,
    });
  }

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
  return {};
}
