import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { calls } from "./calls";
import { profiles } from "./users";

/**
 * A cast/crew member's RSVP to a scheduled call. One row per (call, user);
 * the row's presence means the user has responded, and `status` records the
 * response. The dashboard's focal-call panel reads these to show
 * "N of M confirmed" against the production's membership count.
 *
 * Uniqueness of (callId, userId) is enforced in app code (delete-then-insert
 * on toggle) — see the known-issues note in CLAUDE.md about composite unique
 * constraints hanging `drizzle-kit push`.
 */
export const callConfirmations = pgTable("call_confirmations", {
  id: uuid("id").primaryKey().defaultRandom(),
  callId: uuid("call_id")
    .notNull()
    .references(() => calls.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  // "confirmed" | "declined". A "declined" row still counts as a response.
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type CallConfirmation = typeof callConfirmations.$inferSelect;
export type NewCallConfirmation = typeof callConfirmations.$inferInsert;
