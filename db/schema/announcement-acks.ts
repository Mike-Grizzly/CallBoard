import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { announcements } from "./announcements";
import { profiles } from "./users";

/**
 * A reader's acknowledgement of an announcement. One row per
 * (announcement, user); presence means the user clicked "Acknowledge". The
 * dashboard and announcement cards read these to show "N / M acknowledged",
 * where M is the announcement's audience (org members for org-wide, production
 * members for production-scoped).
 *
 * Uniqueness of (announcementId, userId) is enforced in app code (idempotent
 * insert) — see the known-issues note in CLAUDE.md about composite unique
 * constraints hanging `drizzle-kit push`.
 */
export const announcementAcks = pgTable("announcement_acks", {
  id: uuid("id").primaryKey().defaultRandom(),
  announcementId: uuid("announcement_id")
    .notNull()
    .references(() => announcements.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  ackedAt: timestamp("acked_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AnnouncementAck = typeof announcementAcks.$inferSelect;
export type NewAnnouncementAck = typeof announcementAcks.$inferInsert;
