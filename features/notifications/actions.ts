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
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.recipientId, user.id),
          ),
        );
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
 * Upsert the current user's email notification preference. Uniqueness on userId
 * is enforced here (read-then-update/insert) rather than a DB constraint — see
 * the notification-preferences schema note.
 *
 * `in_app` is always on (not user-configurable — the acknowledge banner is the
 * baseline channel) so it is forced true here. `push` is NOT touched: it is
 * driven per-device by the subscribe/unsubscribe flow (features/push/actions.ts),
 * which keeps the flag in sync with whether the user has any registered device.
 */
export async function updateNotificationPreferences(
  _prevState: PreferencesResult | undefined,
  formData: FormData,
): Promise<PreferencesResult> {
  const user = await requireCurrentUser();

  const email = formData.get("email") != null;

  await upsertEmailPreference(user.id, email);
  revalidatePath("/settings/notifications");

  return { success: true };
}

/**
 * Persist the channel choice made during signup onboarding. Email comes from
 * the dialog; in-app is always on; push is handled separately by the device
 * subscribe flow. Writing this row is also what marks the user as onboarded
 * (see hasNotificationPreferences), so the prompt won't show again.
 */
export async function completeOnboarding(email: boolean): Promise<void> {
  const user = await requireCurrentUser();
  await upsertEmailPreference(user.id, email);
  revalidatePath("/dashboard");
}

/** Shared in-app(=true)+email upsert, preserving any existing push flag. */
async function upsertEmailPreference(
  userId: string,
  email: boolean,
): Promise<void> {
  const [existing] = await db
    .select({ id: notificationPreferences.id })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(notificationPreferences)
      .set({ inApp: true, email, updatedAt: new Date() })
      .where(eq(notificationPreferences.id, existing.id));
  } else {
    await db
      .insert(notificationPreferences)
      .values({ userId, inApp: true, email });
  }
}
