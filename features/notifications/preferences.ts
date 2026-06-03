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
 * push off (push has no delivery path yet — see notification-preferences schema).
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationChannels = {
  inApp: true,
  email: true,
  push: false,
};

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
