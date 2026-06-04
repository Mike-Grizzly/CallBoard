import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { profiles } from "./users";

/**
 * Web Push subscriptions — one row per browser/device a user has opted into
 * push on. A single user can have several (phone, laptop, …). `endpoint` is the
 * push-service URL the browser handed us; `p256dh` + `auth` are the keys needed
 * to send an *encrypted* payload to that endpoint.
 *
 * SECURITY: an endpoint is a capability — anyone holding it can push to that
 * device. Rows are only ever read/written server-side through the Drizzle
 * pooler role. The table ships with RLS enabled and no policies (matching the
 * convention in docs/decision-log.md 2026-05-22) so the anon/authenticated
 * PostgREST roles cannot read or write it. This project applies schema via the
 * Supabase SQL editor/MCP (drizzle-kit push is retired here), so the CREATE
 * TABLE + ENABLE RLS must be run by hand — see
 * docs/feature-specs/17-push-notifications.md.
 *
 * Uniqueness of `endpoint` is enforced in app code (delete-then-insert on save)
 * rather than a DB unique constraint — see the CLAUDE.md note about composite
 * unique constraints hanging `drizzle-kit push`.
 */
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscriptionRow = typeof pushSubscriptions.$inferInsert;
