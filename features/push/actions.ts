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
 * A push endpoint is a URL the server later POSTs to (features/push/send.ts).
 * Reject anything that isn't a public HTTPS URL so a user can't register an
 * endpoint pointing at an internal/metadata address and turn their own push
 * deliveries into a blind SSRF probe. Real push services (FCM, Mozilla,
 * Windows) are always public HTTPS hosts.
 */
function isSafePushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  // Block loopback, link-local, and RFC1918 private ranges by name/IP.
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]" ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") || // link-local (incl. cloud metadata 169.254.169.254)
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.startsWith("[fd") || // unique-local IPv6
    host.startsWith("[fe80") // link-local IPv6
  ) {
    return false;
  }
  return true;
}

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
  if (!isSafePushEndpoint(input.endpoint)) {
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
