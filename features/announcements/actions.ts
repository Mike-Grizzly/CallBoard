"use server";

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";

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

  const org = await getOrCreateDefaultOrganization();

  await db.insert(announcements).values({
    organizationId: org.id,
    productionId,
    createdBy: user.id,
    title,
    body,
  });

  revalidatePath("/announcements");
  if (productionId) {
    revalidatePath("/productions");
  }

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
  revalidatePath("/productions");

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
  revalidatePath("/productions");

  return { success: true };
}
