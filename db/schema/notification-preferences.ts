import { pgTable, uuid, boolean, timestamp } from "drizzle-orm/pg-core";
import { profiles } from "./users";

/**
 * Per-user delivery preferences for notifications. One row per user; a missing
 * row means "use defaults" (see DEFAULT_NOTIFICATION_PREFERENCES in
 * features/notifications/preferences.ts), so we never require a row to exist.
 *
 * Uniqueness of userId is enforced in app code (read-then-upsert) rather than a
 * DB unique constraint — see the known-issues note in CLAUDE.md about unique
 * constraints hanging `drizzle-kit push`.
 *
 * `push` is modeled now but inert: there is no PWA/web-push delivery yet, so
 * nothing reads it for sending. It exists so the preferences UI and data model
 * are ready when Web Push (Phase 2) lands.
 */
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  inApp: boolean("in_app").notNull().default(true),
  email: boolean("email").notNull().default(true),
  push: boolean("push").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference =
  typeof notificationPreferences.$inferInsert;
