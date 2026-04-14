import { pgTable, uuid, text, date, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

/**
 * A production is a single show/workspace. Every feature-scoped record
 * (reports, documents, announcements, activity) will descend from a production.
 *
 * Minimum fields only — additional columns are added when the feature that
 * needs them is built.
 */
export const productions = pgTable("productions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  status: text("status").notNull().default("draft"),
  openingDate: date("opening_date"),
  closingDate: date("closing_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Production = typeof productions.$inferSelect;
export type NewProduction = typeof productions.$inferInsert;
