import { pgTable, uuid, text, date, timestamp } from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { profiles } from "./users";

export const rehearsalReports = pgTable("rehearsal_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  reportDate: date("report_date").notNull(),
  generalNotes: text("general_notes").notNull().default(""),
  scheduleNotes: text("schedule_notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RehearsalReport = typeof rehearsalReports.$inferSelect;
export type NewRehearsalReport = typeof rehearsalReports.$inferInsert;
