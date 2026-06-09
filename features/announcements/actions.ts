"use server";

import { db } from "@/db";
import { announcements, announcementAcks, productions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { assertCanOperate } from "@/features/billing/guard";
import { writeMentions } from "@/features/mentions/write";
import {
  getOrganizationMembers,
  getProductionMembers,
} from "@/features/members/queries";
import {
  fanoutAnnouncement,
  type AnnouncementAudienceMember,
} from "@/features/notifications/announce";
import { getAnnouncementDetailForUser } from "./queries";
import type { AnnouncementDetail } from "./queries";

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

  if (productionId && !(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to that production." };
  }

  const lock = await assertCanOperate(user.organizationId);
  if (lock.error) return { error: lock.error };

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

  // Notify the announcement's audience (scope-based fan-out): org members for
  // org-wide, production members for production-scoped. The author is excluded
  // inside fanoutAnnouncement.
  let productionSlug: string | null = null;
  let productionTitle: string | null = null;
  let audience: AnnouncementAudienceMember[];
  if (productionId) {
    const [prod] = await db
      .select({ slug: productions.slug, title: productions.title })
      .from(productions)
      .where(eq(productions.id, productionId))
      .limit(1);
    productionSlug = prod?.slug ?? null;
    productionTitle = prod?.title ?? null;
    audience = await getProductionMembers(productionId);
  } else {
    audience = await getOrganizationMembers(user.organizationId);
  }

  const authorName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;

  await fanoutAnnouncement({
    announcementId: row.id,
    organizationId: user.organizationId,
    title,
    body,
    productionSlug,
    productionTitle,
    authorId: user.id,
    authorName,
    audience: audience.map((m) => ({
      userId: m.userId,
      email: m.email,
      firstName: m.firstName,
      lastName: m.lastName,
    })),
  });

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
  const canManage =
    can(user.role, "productions:manage") &&
    announcement.organizationId === user.organizationId;

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
    .select({
      pinned: announcements.pinned,
      organizationId: announcements.organizationId,
    })
    .from(announcements)
    .where(eq(announcements.id, announcementId))
    .limit(1);

  if (rows.length === 0) {
    return { error: "Announcement not found." };
  }

  if (rows[0].organizationId !== user.organizationId) {
    return { error: "You don't have permission to pin this announcement." };
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

/**
 * Fetch one announcement plus its acknowledgement roster for the detail drawer.
 * Authorization (org + audience) is enforced in the query.
 */
export async function getAnnouncementDetail(
  announcementId: string,
): Promise<{ error?: string; data?: AnnouncementDetail }> {
  const user = await requireCurrentUser();
  if (!announcementId) return { error: "Missing announcement ID." };

  const data = await getAnnouncementDetailForUser(
    user.id,
    user.organizationId,
    user.role,
    announcementId,
  );
  if (!data) return { error: "Announcement not found." };

  return { data };
}
