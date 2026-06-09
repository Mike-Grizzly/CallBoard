import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { profiles } from "./users";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  // Org this alert belongs to, so it can be counted per workspace for the
  // cross-org switcher bubbles. Nullable for legacy rows.
  organizationId: uuid("organization_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
