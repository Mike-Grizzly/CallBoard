import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { profiles } from "./users";

export const userPins = pgTable("user_pins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  // 'document' | 'report' | 'note'
  itemType: text("item_type").notNull(),
  itemId: uuid("item_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserPin = typeof userPins.$inferSelect;
