import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPreferencesForUsers } from "@/features/notifications/preferences";
import { sendPushToUsers } from "@/features/push/send";

async function resolveAuthorName(userId: string): Promise<string> {
  try {
    const [row] = await db
      .select({
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        email: profiles.email,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    if (!row) return "Someone";
    const name = `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
    return name || row.email || "Someone";
  } catch {
    return "Someone";
  }
}

/**
 * Send a phone push for @mentions, keyed on each recipient's `push` preference.
 *
 * Batching: `countsByUser` is the number of times a user was mentioned in THIS
 * write. A user mentioned several times in one save (e.g. across multiple
 * sections of one rehearsal report) gets a single "N new mentions" push rather
 * than one per mention. A per-user `tag` also collapses repeated saves of the
 * same context on the device.
 *
 * Best-effort: this never throws, so a push failure can't fail the underlying
 * comment/report/announcement save. The author is always excluded.
 */
export async function pushMentionNotifications(opts: {
  mentionedById: string;
  countsByUser: Record<string, number>;
  contextLabel: string;
  /** Where tapping the notification lands. Defaults to the dashboard, where the
   *  Mentions list lives. */
  link?: string;
}): Promise<void> {
  try {
    const userIds = Object.keys(opts.countsByUser).filter(
      (id) => id && id !== opts.mentionedById,
    );
    if (userIds.length === 0) return;

    const prefs = await getPreferencesForUsers(userIds);
    const pushUsers = userIds.filter((id) => prefs[id]?.push);
    if (pushUsers.length === 0) return;

    const author = await resolveAuthorName(opts.mentionedById);
    const link = opts.link ?? "/dashboard";

    await Promise.all(
      pushUsers.map((userId) => {
        const count = opts.countsByUser[userId] ?? 1;
        const title = count > 1 ? `${count} new mentions` : "New mention";
        return sendPushToUsers([userId], {
          title,
          body: `${author} mentioned you in ${opts.contextLabel}`,
          url: link,
          tag: `mentions-${userId}`,
        });
      }),
    );
  } catch (err) {
    console.error("Failed to send mention push notifications:", err);
  }
}
