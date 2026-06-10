import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { productions } from "./productions";
import { profiles } from "./users";

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  // Legacy single-production pointer. Superseded by `orgWide` + the
  // `announcement_productions` join table, which are the source of truth for
  // audience. Kept (and still written for single-target posts) as a safety net
  // and for backward compatibility; new multi-target / org-wide posts leave it
  // null. Do NOT read it for audience resolution — use orgWide + the join.
  productionId: uuid("production_id").references(() => productions.id, {
    onDelete: "cascade",
  }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  // Priority drives the card rail colour + tag: normal | important | urgent.
  // Constrained by a CHECK in the DB (see migration).
  priority: text("priority").notNull().default("normal"),
  // When true, recipients see an "Acknowledge" action and managers get the
  // ack rollup. When false, the announcement is informational only.
  requireAck: boolean("require_ack").notNull().default(false),
  // Audience flag: true = everyone in the org; false = the set of productions
  // in `announcement_productions`. Source of truth alongside the join table.
  orgWide: boolean("org_wide").notNull().default(false),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type AnnouncementPriority = "normal" | "important" | "urgent";
