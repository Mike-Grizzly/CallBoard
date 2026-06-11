import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { profiles } from "./users";

/**
 * A reusable rehearsal template: a named set of default call fields that can
 * prefill a single call or be projected across a date range to generate a
 * recurring schedule. Scoped to one production (mirrors `calls`).
 */
export const callTemplates = pgTable("call_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  callTime: text("call_time"),
  endTime: text("end_time"),
  location: text("location"),
  focus: text("focus"),
  scenes: text("scenes"),
  castCalled: text("cast_called"),
  schedule: text("schedule"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type CallTemplate = typeof callTemplates.$inferSelect;
export type NewCallTemplate = typeof callTemplates.$inferInsert;
