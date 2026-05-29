"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  organizationMemberships,
  organizations,
  profiles,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { createOrganization } from "@/lib/organization";
import { can } from "@/lib/permissions";

export type WorkspaceActionResult = {
  error?: string;
  success?: boolean;
};

const MAX_NAME_LENGTH = 60;

export async function renameWorkspace(
  _prevState: WorkspaceActionResult | undefined,
  formData: FormData,
): Promise<WorkspaceActionResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "settings:manage")) {
    return { error: "You don't have permission to rename this workspace." };
  }

  const name = ((formData.get("name") as string) || "").trim();

  if (!name) {
    return { error: "Workspace name is required." };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Keep it under ${MAX_NAME_LENGTH} characters.` };
  }

  await db
    .update(organizations)
    .set({ name, updatedAt: new Date() })
    .where(eq(organizations.id, user.organizationId));

  // Touch every surface that renders the workspace name in the layout.
  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Spin up a brand-new workspace for the signed-in user. They become
 * its first admin and we auto-switch them into it so the next request
 * already renders inside the new org. Any user can do this — multi-org
 * membership isn't gated by role.
 */
export async function createWorkspace(
  name: string,
): Promise<WorkspaceActionResult & { organizationId?: string }> {
  const user = await requireCurrentUser();

  const trimmed = (name || "").trim();
  if (!trimmed) {
    return { error: "Workspace name is required." };
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { error: `Keep it under ${MAX_NAME_LENGTH} characters.` };
  }

  const org = await createOrganization(trimmed);

  await db.insert(organizationMemberships).values({
    userId: user.id,
    organizationId: org.id,
    role: "admin",
  });

  await db
    .update(profiles)
    .set({ selectedOrganizationId: org.id, updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  revalidatePath("/", "layout");
  return { success: true, organizationId: org.id };
}

export async function switchOrganization(
  organizationId: string,
): Promise<WorkspaceActionResult> {
  const user = await requireCurrentUser();

  if (!organizationId) {
    return { error: "Missing workspace." };
  }

  // Only let users select an org they're actually a member of.
  const membership = await db
    .select({ id: organizationMemberships.id })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, user.id),
        eq(organizationMemberships.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (membership.length === 0) {
    return { error: "You're not a member of that workspace." };
  }

  await db
    .update(profiles)
    .set({ selectedOrganizationId: organizationId, updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  revalidatePath("/", "layout");
  return { success: true };
}
