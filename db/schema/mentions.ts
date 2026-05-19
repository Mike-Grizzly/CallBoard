import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { productions } from "./productions";
import { profiles } from "./users";

export const mentions = pgTable("mentions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  productionId: uuid("production_id").references(() => productions.id, {
    onDelete: "cascade",
  }),
  mentionedUserId: uuid("mentioned_user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  mentionedById: uuid("mentioned_by_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  // 'report' | 'note' | 'announcement' | 'log'
  contextType: text("context_type").notNull(),
  contextId: uuid("context_id").notNull(),
  contextTitle: text("context_title"),
  snippet: text("snippet"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Mention = typeof mentions.$inferSelect;
