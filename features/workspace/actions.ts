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
