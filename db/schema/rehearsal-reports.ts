import { pgTable, uuid, text, date, integer, timestamp } from "drizzle-orm/pg-core";
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
  reportNumber: integer("report_number"),
  reportDate: date("report_date").notNull(),
  scheduledCall: text("scheduled_call"),
  actualStart: text("actual_start"),
  endTime: text("end_time"),
  generalNotes: text("general_notes").notNull().default(""),
  scheduleNotes: text("schedule_notes").notNull().default(""),
  nextRehearsalDate: date("next_rehearsal_date"),
  nextRehearsalTime: text("next_rehearsal_time"),
  nextRehearsalLocation: text("next_rehearsal_location"),
  nextRehearsalNotes: text("next_rehearsal_notes"),
  deptScenery: text("dept_scenery"),
  deptProps: text("dept_props"),
  deptCostumes: text("dept_costumes"),
  deptHairMakeup: text("dept_hair_makeup"),
  deptLighting: text("dept_lighting"),
  deptSound: text("dept_sound"),
  deptSoundEffects: text("dept_sound_effects"),
  deptMusic: text("dept_music"),
  deptChoreography: text("dept_choreography"),
  deptVideo: text("dept_video"),
  deptCrew: text("dept_crew"),
  deptOther: text("dept_other"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RehearsalReport = typeof rehearsalReports.$inferSelect;
export type NewRehearsalReport = typeof rehearsalReports.$inferInsert;
