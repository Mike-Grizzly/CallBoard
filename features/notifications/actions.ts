"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, isNull, and, desc } from "drizzle-orm";
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
