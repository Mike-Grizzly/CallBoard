import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { profiles } from "./users";
import { noteTags } from "./note-tags";

export const productionNotes = pgTable("production_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  content: text("content").notNull().default(""),
  isTodo: boolean("is_todo").notNull().default(false),
  isCompleted: boolean("is_completed").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  tagId: uuid("tag_id").references(() => noteTags.id, { onDelete: "set null" }),
  dueDate: text("due_date"),
  visibility: text("visibility").notNull().default("private"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProductionNote = typeof productionNotes.$inferSelect;
export type NewProductionNote = typeof productionNotes.$inferInsert;
