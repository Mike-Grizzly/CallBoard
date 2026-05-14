import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { productions } from "./productions";

export const productionScenes = pgTable("production_scenes", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  actNumber: integer("act_number").notNull().default(1),
  sceneNumber: integer("scene_number").notNull().default(1),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sceneBeats = pgTable("scene_beats", {
  id: uuid("id").primaryKey().defaultRandom(),
  sceneId: uuid("scene_id")
    .notNull()
    .references(() => productionScenes.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  notes: text("notes"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProductionScene = typeof productionScenes.$inferSelect;
export type NewProductionScene = typeof productionScenes.$inferInsert;
export type SceneBeat = typeof sceneBeats.$inferSelect;
export type NewSceneBeat = typeof sceneBeats.$inferInsert;
