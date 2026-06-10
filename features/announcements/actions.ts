"use server";

import { db } from "@/db";
import {
  announcements,
  announcementProductions,
  announcementAcks,
  productions,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { can } from "@/lib/permissions";
import type { AnnouncementPriority } from "@/db/schema";
import { assertCanOperate } from "@/features/billing/guard";
import { writeMentions } from "@/features/mentions/write";
import { fanoutAnnouncement } from "@/features/notifications/announce";
import { getAnnouncementDetailForUser, getFanoutAudience } from "./queries";
import type { AnnouncementDetail } from "./queries";

const PRIORITIES: ReadonlySet<AnnouncementPriority> = new Set([
  "normal",
  "important",
  "urgent",
]);

/** Parse the audience picker payload: org-wide flag + selected production ids. */
function parseAudience(formData: FormData): {
  orgWide: boolean;
  productionIds: string[];
} {
  const orgWide = formData.get("org_wide") === "1";
  let productionIds: string[] = [];
  const raw = formData.get("production_ids");
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        productionIds = [
          ...new Set(parsed.filter((v): v is string => typeof v === "string")),
        ];
      }
    } catch {
      // Fall back to a comma-separated list.
      productionIds = [
        ...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean)),
      ];
    }
  }
  return { orgWide, productionIds: orgWide ? [] : productionIds };
}

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
  const { orgWide, productionIds } = parseAudience(formData);

  const priorityRaw = (formData.get("priority") as string) ?? "normal";
  const priority: AnnouncementPriority = PRIORITIES.has(
    priorityRaw as AnnouncementPriority,
  )
    ? (priorityRaw as AnnouncementPriority)
    : "normal";
  const requireAck = formData.get("require_ack") === "1";
  const wantPin = formData.get("pin") === "1";

  if (!title) {
    return { error: "Title is required." };
  }

  const canManage = can(user.role, "productions:manage");

  if (orgWide) {
    // Org-wide broadcasts reach everyone, so they're limited to managers.
    if (!canManage) {
      return {
        error:
          "Only admins and producers can broadcast to the whole company.",
      };
    }
  } else {
    if (productionIds.length === 0) {
      return { error: "Choose at least one production, or post company-wide." };
    }
    // Every targeted production must exist in the org and be one the user can
    // post to.
    const owned = await db
      .select({ id: productions.id })
      .from(productions)
      .where(
        and(
          eq(productions.organizationId, user.organizationId),
          inArray(productions.id, productionIds),
        ),
      );
    if (owned.length !== productionIds.length) {
      return { error: "One or more productions are invalid." };
    }
    for (const id of productionIds) {
      if (!(await userCanAccessProduction(user, id))) {
        return { error: "You don't have access to one of those productions." };
      }
    }
  }

  // Only managers can pin.
  const pinned = wantPin && canManage;

  const lock = await assertCanOperate(user.organizationId);
  if (lock.error) return { error: lock.error };

  // Keep the legacy production_id meaningful for the common single-target case;
  // null for org-wide and multi (the join table is the source of truth).
  const legacyProductionId =
    !orgWide && productionIds.length === 1 ? productionIds[0] : null;

  const [row] = await db
    .insert(announcements)
    .values({
      organizationId: user.organizationId,
      productionId: legacyProductionId,
      createdBy: user.id,
      title,
      body,
      priority,
      requireAck,
      orgWide,
      pinned,
    })
    .returning({ id: announcements.id });

  if (!orgWide && productionIds.length > 0) {
    await db.insert(announcementProductions).values(
      productionIds.map((productionId) => ({
        announcementId: row.id,
        productionId,
      })),
    );
  }

  if (body) {
    await writeMentions(body, {
      organizationId: user.organizationId,
      // Scope mentions to the single targeted production when there is one;
      // org-wide / multi posts use the org scope (null).
      productionId: legacyProductionId,
      mentionedById: user.id,
      contextType: "announcement",
      contextId: row.id,
      contextTitle: title,
    });
  }

  // Notify the announcement's audience (deduped union across its scope). The
  // author is excluded inside fanoutAnnouncement. Single-target posts deep-link
  // to that show; org-wide / multi link to /announcements.
  let productionSlug: string | null = null;
  let productionTitle: string | null = null;
  if (legacyProductionId) {
    const [prod] = await db
      .select({ slug: productions.slug, title: productions.title })
      .from(productions)
      .where(eq(productions.id, legacyProductionId))
      .limit(1);
    productionSlug = prod?.slug ?? null;
    productionTitle = prod?.title ?? null;
  }

  const audience = await getFanoutAudience(
    orgWide,
    user.organizationId,
    productionIds,
  );

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
    audience,
  });

  revalidatePath("/announcements");
  revalidatePath("/productions", "layout");
  revalidatePath("/dashboard");

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
