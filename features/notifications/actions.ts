"use server";

import { db } from "@/db";
import { notifications, notificationPreferences } from "@/db/schema";
import { eq, isNull, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";

export async function getNotifications() {
  const user = await requireCurrentUser();
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.recipientId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await requireCurrentUser();
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, user.id),
        isNull(notifications.readAt),
      ),
    );
  return rows.length;
}

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  const user = await requireCurrentUser();
  const now = new Date();

  if (ids && ids.length > 0) {
    for (const id of ids) {
      await db
        .update(notifications)
        .set({ readAt: now })
        .where(eq(notifications.id, id));
    }
  } else {
    await db
      .update(notifications)
      .set({ readAt: now })
      .where(
        and(
          eq(notifications.recipientId, user.id),
          isNull(notifications.readAt),
        ),
      );
  }
}

export type PreferencesResult = {
  error?: string;
  success?: boolean;
};

/**
 * Upsert the current user's notification channel preferences. Uniqueness on
 * userId is enforced here (read-then-update/insert) rather than a DB constraint
 * — see the notification-preferences schema note.
 */
export async function updateNotificationPreferences(
  _prevState: PreferencesResult | undefined,
  formData: FormData,
): Promise<PreferencesResult> {
  const user = await requireCurrentUser();

  const inApp = formData.get("in_app") != null;
  const email = formData.get("email") != null;
  const push = formData.get("push") != null;

  const [existing] = await db
    .select({ id: notificationPreferences.id })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, user.id))
    .limit(1);

  if (existing) {
    await db
      .update(notificationPreferences)
      .set({ inApp, email, push, updatedAt: new Date() })
      .where(eq(notificationPreferences.id, existing.id));
  } else {
    await db
      .insert(notificationPreferences)
      .values({ userId: user.id, inApp, email, push });
  }

  revalidatePath("/settings/notifications");

  return { success: true };
}
