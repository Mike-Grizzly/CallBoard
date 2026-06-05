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
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ROLES, type Role } from "@/types/roles";

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

/**
 * Hand workspace ownership to another member: promote them to admin
 * and demote the caller to a chosen role. Runs in one transaction so a
 * crash mid-way can't strand the workspace adminless.
 *
 * Admin-only by entry. The target must already be a member of the
 * workspace (we don't auto-invite). The caller cannot transfer to
 * themselves. The caller's new role must be a non-admin role —
 * "stepping down to admin" is meaningless.
 */
export async function transferWorkspaceOwnership(
  targetUserId: string,
  newSelfRole: string,
): Promise<WorkspaceActionResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "settings:manage")) {
    return { error: "You don't have permission to transfer this workspace." };
  }
  if (!targetUserId) return { error: "Pick a member to transfer to." };
  if (targetUserId === user.id) {
    return { error: "Pick a different member." };
  }
  if (!ROLES.includes(newSelfRole as Role) || newSelfRole === "admin") {
    return { error: "Pick a non-admin role for yourself." };
  }

  const targetMembership = await db
    .select({
      id: organizationMemberships.id,
      role: organizationMemberships.role,
    })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, targetUserId),
        eq(organizationMemberships.organizationId, user.organizationId),
      ),
    )
    .limit(1);

  if (targetMembership.length === 0) {
    return { error: "That person isn't a member of this workspace." };
  }

  await db.transaction(async (tx) => {
    // Promote the target first so that even if the demote step
    // somehow fails, the workspace still has at least one admin.
    if (targetMembership[0].role !== "admin") {
      await tx
        .update(organizationMemberships)
        .set({ role: "admin" })
        .where(eq(organizationMemberships.id, targetMembership[0].id));
    }

    await tx
      .update(organizationMemberships)
      .set({ role: newSelfRole })
      .where(
        and(
          eq(organizationMemberships.userId, user.id),
          eq(organizationMemberships.organizationId, user.organizationId),
        ),
      );
  });

  revalidatePath("/", "layout");
  return { success: true };
}

const LOGO_ALLOWED_TYPES = ["image/svg+xml", "image/png", "image/jpeg"];
const LOGO_MAX_SIZE = 2 * 1024 * 1024;
const LOGO_EXTENSIONS: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/jpeg": "jpg",
};

/**
 * Step 1 of the workspace-logo upload: admin requests a signed upload
 * URL scoped to a per-org path inside the existing `attachments`
 * bucket. The file goes browser → Supabase Storage directly, never
 * through the Next.js server (avoids the 25MB action body cap and
 * keeps the heavy bytes off the app server).
 */
export async function requestWorkspaceLogoUpload(
  fileName: string,
  contentType: string,
  fileSize: number,
): Promise<{ error?: string; path?: string; token?: string }> {
  const user = await requireCurrentUser();

  if (!can(user.role, "settings:manage")) {
    return { error: "Only admins can change the workspace logo." };
  }
  if (!fileName || fileSize <= 0) return { error: "Pick a file." };
  if (!LOGO_ALLOWED_TYPES.includes(contentType)) {
    return { error: "Logo must be an SVG, PNG, or JPG." };
  }
  if (fileSize > LOGO_MAX_SIZE) {
    return { error: "Logo must be 2MB or smaller." };
  }

  const ext = LOGO_EXTENSIONS[contentType] ?? "bin";
  const storagePath = `org-logos/${user.organizationId}/${Date.now()}.${ext}`;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return {
      error: `Could not start upload: ${error?.message ?? "unknown error"}`,
    };
  }

  return { path: data.path, token: data.token };
}

/**
 * Step 2: once the browser has finished the upload, point the org row
 * at the new path. Best-effort cleanup of the previous logo so we
 * don't leak files in storage.
 */
export async function finalizeWorkspaceLogoUpload(
  storagePath: string,
): Promise<WorkspaceActionResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "settings:manage")) {
    return { error: "Only admins can change the workspace logo." };
  }
  if (!storagePath) return { error: "Missing upload." };
  if (!storagePath.startsWith(`org-logos/${user.organizationId}/`)) {
    return { error: "Upload path doesn't belong to this workspace." };
  }

  const existing = await db
    .select({ logoUrl: organizations.logoUrl })
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  await db
    .update(organizations)
    .set({ logoUrl: storagePath, updatedAt: new Date() })
    .where(eq(organizations.id, user.organizationId));

  const previous = existing[0]?.logoUrl;
  if (previous && previous !== storagePath) {
    const supabase = createSupabaseAdminClient();
    await supabase.storage.from("attachments").remove([previous]);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function removeWorkspaceLogo(): Promise<WorkspaceActionResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "settings:manage")) {
    return { error: "Only admins can change the workspace logo." };
  }

  const existing = await db
    .select({ logoUrl: organizations.logoUrl })
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  await db
    .update(organizations)
    .set({ logoUrl: null, updatedAt: new Date() })
    .where(eq(organizations.id, user.organizationId));

  const previous = existing[0]?.logoUrl;
  if (previous) {
    const supabase = createSupabaseAdminClient();
    await supabase.storage.from("attachments").remove([previous]);
  }

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
