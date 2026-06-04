import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { inArray } from "drizzle-orm";

let configured: boolean | null = null;

/**
 * Lazily configure web-push with our VAPID identity. Returns false if the keys
 * aren't set, so a missing env var degrades gracefully (push simply no-ops)
 * rather than throwing — push is best-effort, exactly like announcement email.
 */
function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }
  const subject =
    process.env.VAPID_SUBJECT ?? "mailto:notifications@proscene.app";
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  /** Relative path opened when the notification is tapped (e.g. "/announcements"). */
  url?: string;
  /** Optional dedupe tag — a newer push with the same tag replaces the old one. */
  tag?: string;
};

/**
 * Send a Web Push to every device subscription belonging to the given users.
 *
 * Best-effort: per-send failures are logged, never thrown, so a dead device can
 * never fail the calling action. Subscriptions the push service reports as gone
 * (404 / 410) are pruned, so the table self-heals over time.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<void> {
  if (userIds.length === 0) return;
  if (!ensureConfigured()) return;

  let subs: (typeof pushSubscriptions.$inferSelect)[];
  try {
    subs = await db
      .select()
      .from(pushSubscriptions)
      .where(inArray(pushSubscriptions.userId, userIds));
  } catch (err) {
    console.error("Failed to load push subscriptions:", err);
    return;
  }
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);
  const stale: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (err: unknown) {
        const status =
          typeof err === "object" && err !== null && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        if (status === 404 || status === 410) {
          stale.push(s.id);
        } else {
          console.error("Web push failed:", status, err);
        }
      }
    }),
  );

  if (stale.length > 0) {
    try {
      await db
        .delete(pushSubscriptions)
        .where(inArray(pushSubscriptions.id, stale));
    } catch (err) {
      console.error("Failed to prune stale push subscriptions:", err);
    }
  }
}
