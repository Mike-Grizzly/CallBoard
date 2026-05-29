import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { productions } from "./productions";

/**
 * Departments enabled for a production. Each row is one active functional
 * area (e.g. "music", "costumes") chosen in the setup wizard. Enabled
 * departments get a section in rehearsal reports, a document folder, and a
 * notification channel. Departments are added/removed rather than toggled, so
 * the presence of a row means the department is active.
 *
 * Uniqueness of (productionId, key) is enforced in app code — see the
 * known-issues note in CLAUDE.md about composite unique constraints hanging
 * `drizzle-kit push`.
 */
export const productionDepartments = pgTable("production_departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProductionDepartment = typeof productionDepartments.$inferSelect;
export type NewProductionDepartment = typeof productionDepartments.$inferInsert;
