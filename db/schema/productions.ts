import { pgTable, uuid, text, date, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

/**
 * A production is a single show/workspace. Every feature-scoped record
 * (reports, documents, announcements, activity) will descend from a production.
 *
 * The setup wizard (`/productions/new`) captures the planning fields below.
 * All are optional except title — a production can be created with just a
 * title (quick add) and fleshed out later.
 */
export const productions = pgTable("productions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  status: text("status").notNull().default("draft"),
  color: text("color"),
  // Where the show is performed. Rehearsal rooms are tracked separately.
  venue: text("venue"),
  // Free-text grouping label used in the season archive (e.g. "Spring 2026").
  season: text("season"),
  openingDate: date("opening_date"),
  closingDate: date("closing_date"),
  // Additional key dates surfaced by the dashboard countdown.
  firstRehearsalDate: date("first_rehearsal_date"),
  techStartDate: date("tech_start_date"),
  // Default rehearsal pattern used to pre-fill call windows. `rehearsalDays`
  // is a { Mon: boolean, Tue: boolean, ... } map; start/end are stored as the
  // human-readable strings the user typed (e.g. "7:00 PM").
  rehearsalDays: jsonb("rehearsal_days").$type<Record<string, boolean>>(),
  rehearsalStart: text("rehearsal_start"),
  rehearsalEnd: text("rehearsal_end"),
  // Soft-archive. Null = active (shows in workspace lists), non-null =
  // archived (hidden from default queries but reachable from the
  // archived view and restorable). We never hard-delete productions —
  // they carry too much downstream history (reports, calls, blocking).
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  // Soft-delete ("trash"), distinct from archive. Null = live, non-null =
  // deleted: hidden from every list (including the archived view) and from
  // production access checks, but recoverable by an admin from the
  // "Recently deleted" view for 30 days. Hard purge is deferred.
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("productions_org_idx").on(table.organizationId),
]);

export type Production = typeof productions.$inferSelect;
export type NewProduction = typeof productions.$inferInsert;
