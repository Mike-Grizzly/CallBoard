import { pgTable, uuid, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { documents } from "./documents";
import { profiles } from "./users";
import { productions } from "./productions";

export const scriptAnnotations = pgTable("script_annotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  scriptId: uuid("script_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  annotations: jsonb("annotations").notNull().default([]),
  pageOverrides: jsonb("page_overrides").notNull().default({}),
  hasStalePages: boolean("has_stale_pages").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ScriptAnnotation = typeof scriptAnnotations.$inferSelect;
export type NewScriptAnnotation = typeof scriptAnnotations.$inferInsert;
