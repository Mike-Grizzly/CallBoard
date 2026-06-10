import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { announcements } from "./announcements";
import { productions } from "./productions";

/**
 * The audience of a multi-target announcement: one row per (announcement,
 * production) the announcement is broadcast to. An announcement is either
 * `orgWide` (everyone in the org — no rows here) or scoped to the set of
 * productions listed here. The combined reach/ack audience is the deduped
 * union of those productions' members.
 *
 * Replaces the old single `announcements.production_id` pointer. The unique
 * (announcement_id, production_id) constraint is created in the DB migration —
 * see the known-issues note in CLAUDE.md about composite unique constraints
 * hanging `drizzle-kit push` (this feature is applied via Supabase migration,
 * not push).
 */
export const announcementProductions = pgTable(
  "announcement_productions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    announcementId: uuid("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    productionId: uuid("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniquePair: unique("announcement_productions_unique").on(
      t.announcementId,
      t.productionId,
    ),
  }),
);

export type AnnouncementProduction = typeof announcementProductions.$inferSelect;
export type NewAnnouncementProduction =
  typeof announcementProductions.$inferInsert;
