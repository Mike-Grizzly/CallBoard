import {
  pgTable,
  uuid,
  text,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { sceneBeats } from "./scenes";
import { profiles } from "./users";

export const blockingPositions = pgTable("blocking_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  beatId: uuid("beat_id")
    .notNull()
    .references(() => sceneBeats.id, { onDelete: "cascade" }),
  // "actor" or "set_piece"
  entityType: text("entity_type").notNull(),
  // userId for actors, set piece key (e.g. "chair") for set pieces
  entityId: text("entity_id").notNull(),
  // Position as percentage of canvas (0-100), origin = top-left
  xPercent: real("x_percent").notNull(),
  yPercent: real("y_percent").notNull(),
  rotation: real("rotation").notNull().default(0),
  updatedBy: uuid("updated_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type BlockingPosition = typeof blockingPositions.$inferSelect;
export type NewBlockingPosition = typeof blockingPositions.$inferInsert;
