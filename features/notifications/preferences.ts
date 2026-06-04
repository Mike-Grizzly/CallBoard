import { db } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export type NotificationChannels = {
  inApp: boolean;
  email: boolean;
  push: boolean;
};

/**
 * Defaults applied when a user has no preferences row yet: in-app and email on,
 * push off. In-app is always on (not user-configurable); push is opt-in per
 * device via the subscribe flow.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationChannels = {
  inApp: true,
  email: true,
  push: false,
};

/**
 * Whether the user has ever saved notification preferences. Used to decide if
 * the one-time signup onboarding prompt should appear — a row is written when
 * they finish (or skip) onboarding, save prefs, or enable push, so "no row"
 * cleanly means "hasn't chosen yet."
 */
export async function hasNotificationPreferences(
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: notificationPreferences.id })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return !!row;
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationChannels> {
  const [row] = await db
    .select({
      inApp: notificationPreferences.inApp,
      email: notificationPreferences.email,
      push: notificationPreferences.push,
    })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  return row ?? DEFAULT_NOTIFICATION_PREFERENCES;
}

/**
 * Bulk preferences lookup for a fan-out audience. Users without a row fall back
 * to DEFAULT_NOTIFICATION_PREFERENCES so a brand-new member still gets alerts.
 */
export async function getPreferencesForUsers(
  userIds: string[],
): Promise<Record<string, NotificationChannels>> {
  const out: Record<string, NotificationChannels> = {};
  if (userIds.length === 0) return out;

  for (const id of userIds) {
    out[id] = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const rows = await db
    .select({
      userId: notificationPreferences.userId,
      inApp: notificationPreferences.inApp,
      email: notificationPreferences.email,
      push: notificationPreferences.push,
    })
    .from(notificationPreferences)
    .where(inArray(notificationPreferences.userId, userIds));

  for (const r of rows) {
    out[r.userId] = { inApp: r.inApp, email: r.email, push: r.push };
  }

  return out;
}
