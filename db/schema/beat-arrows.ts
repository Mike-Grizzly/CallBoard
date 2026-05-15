import {
  pgTable,
  uuid,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sceneBeats } from "./scenes";

export const beatArrows = pgTable("beat_arrows", {
  id: uuid("id").primaryKey().defaultRandom(),
  beatId: uuid("beat_id")
    .notNull()
    .references(() => sceneBeats.id, { onDelete: "cascade" }),
  fromX: real("from_x").notNull(),
  fromY: real("from_y").notNull(),
  toX: real("to_x").notNull(),
  toY: real("to_y").notNull(),
  color: text("color").notNull().default("#374151"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type BeatArrow = typeof beatArrows.$inferSelect;
