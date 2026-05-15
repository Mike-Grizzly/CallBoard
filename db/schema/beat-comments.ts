import {
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sceneBeats } from "./scenes";
import { profiles } from "./users";

export const beatComments = pgTable("beat_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  beatId: uuid("beat_id")
    .notNull()
    .references(() => sceneBeats.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  mentionedUserIds: text("mentioned_user_ids").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type BeatComment = typeof beatComments.$inferSelect;
export type NewBeatComment = typeof beatComments.$inferInsert;
