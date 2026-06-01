"use server";

import { db } from "@/db";
import { announcements, announcementAcks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { writeMentions } from "@/features/mentions/write";

export type AnnouncementResult = {
  error?: string;
  success?: boolean;
};

export async function createAnnouncement(
  formData: FormData,
): Promise<AnnouncementResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "announcements:create")) {
    return { error: "You don't have permission to post announcements." };
  }

  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string) ?? "";
  const productionId = (formData.get("production_id") as string) || null;

  if (!title) {
    return { error: "Title is required." };
  }

  const [row] = await db
    .insert(announcements)
    .values({
      organizationId: user.organizationId,
      productionId,
      createdBy: user.id,
      title,
      body,
    })
    .returning({ id: announcements.id });

  if (body) {
    await writeMentions(body, {
      organizationId: user.organizationId,
      productionId,
      mentionedById: user.id,
      contextType: "announcement",
      contextId: row.id,
      contextTitle: title,
    });
  }

  revalidatePath("/announcements");
  revalidatePath("/productions", "layout");

  return { success: true };
}

export async function deleteAnnouncement(
  formData: FormData,
): Promise<AnnouncementResult> {
  const user = await requireCurrentUser();

  const announcementId = formData.get("announcement_id") as string;
  if (!announcementId) {
    return { error: "Missing announcement ID." };
  }

  const rows = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, announcementId))
    .limit(1);

  if (rows.length === 0) {
    return { error: "Announcement not found." };
  }

  const announcement = rows[0];
  const isAuthor = announcement.createdBy === user.id;
  const canManage = can(user.role, "productions:manage");

  if (!isAuthor && !canManage) {
    return { error: "You don't have permission to delete this announcement." };
  }

  await db.delete(announcements).where(eq(announcements.id, announcementId));

  revalidatePath("/announcements");
  revalidatePath("/productions", "layout");

  return { success: true };
}

export async function togglePin(
  formData: FormData,
): Promise<AnnouncementResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "productions:manage")) {
    return { error: "Only admins and producers can pin announcements." };
  }

  const announcementId = formData.get("announcement_id") as string;
  if (!announcementId) {
    return { error: "Missing announcement ID." };
  }

  const rows = await db
    .select({ pinned: announcements.pinned })
    .from(announcements)
    .where(eq(announcements.id, announcementId))
    .limit(1);

  if (rows.length === 0) {
    return { error: "Announcement not found." };
  }

  await db
    .update(announcements)
    .set({
      pinned: !rows[0].pinned,
      updatedAt: new Date(),
    })
    .where(eq(announcements.id, announcementId));

  revalidatePath("/announcements");
  revalidatePath("/productions", "layout");

  return { success: true };
}

/**
 * Toggle the current user's acknowledgement of an announcement. Idempotent
 * per (announcement, user): acknowledging again clears it, so the button
 * doubles as "Acknowledged ✓ — tap to undo". Any signed-in member who can
 * see the announcement may acknowledge.
 */
export async function acknowledgeAnnouncement(
  announcementId: string,
): Promise<AnnouncementResult> {
  const user = await requireCurrentUser();

  if (!announcementId) {
    return { error: "Missing announcement ID." };
  }

  const existing = await db
    .select({ id: announcementAcks.id })
    .from(announcementAcks)
    .where(
      and(
        eq(announcementAcks.announcementId, announcementId),
        eq(announcementAcks.userId, user.id),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(announcementAcks)
      .where(eq(announcementAcks.id, existing[0].id));
  } else {
    await db
      .insert(announcementAcks)
      .values({ announcementId, userId: user.id });
  }

  revalidatePath("/dashboard");
  revalidatePath("/announcements");
  revalidatePath("/productions", "layout");

  return { success: true };
}
