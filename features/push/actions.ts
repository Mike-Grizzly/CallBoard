"use server";

import { db } from "@/db";
import { pushSubscriptions, notificationPreferences } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";

export type PushSubInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
};

export type PushActionResult = { error?: string; success?: boolean };

/**
 * Register the current browser/device for push and flip the user's push
 * preference on. Endpoint uniqueness is enforced here (delete-then-insert)
 * rather than a DB constraint — see the push-subscriptions schema note.
 */
export async function savePushSubscription(
  input: PushSubInput,
): Promise<PushActionResult> {
  const user = await requireCurrentUser();
  if (!input?.endpoint || !input.p256dh || !input.auth) {
    return { error: "Invalid push subscription." };
  }

  // A device's endpoint can be re-registered (e.g. by a different account on a
  // shared browser); clear any prior owner before claiming it for this user.
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, input.endpoint));

  await db.insert(pushSubscriptions).values({
    userId: user.id,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
    userAgent: input.userAgent ?? null,
  });

  await setPushPreference(user.id, true);
  revalidatePath("/settings/notifications");
  return { success: true };
}

/**
 * Unregister a device. If it was the user's last one, also turn the push
 * preference off so the data model and UI stay consistent.
 */
export async function deletePushSubscription(
  endpoint: string,
): Promise<PushActionResult> {
  const user = await requireCurrentUser();

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.endpoint, endpoint),
        eq(pushSubscriptions.userId, user.id),
      ),
    );

  const remaining = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, user.id))
    .limit(1);

  if (remaining.length === 0) {
    await setPushPreference(user.id, false);
  }

  revalidatePath("/settings/notifications");
  return { success: true };
}

/** Upsert just the push channel flag, preserving in-app/email choices. */
async function setPushPreference(userId: string, push: boolean): Promise<void> {
  const [existing] = await db
    .select({ id: notificationPreferences.id })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(notificationPreferences)
      .set({ push, updatedAt: new Date() })
      .where(eq(notificationPreferences.id, existing.id));
  } else {
    await db.insert(notificationPreferences).values({ userId, push });
  }
}
