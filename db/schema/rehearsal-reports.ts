import {
  pgTable,
  uuid,
  text,
  date,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { profiles } from "./users";
import type {
  Break,
  SceneWorked,
  ScheduleChange,
  AttendanceNote,
  LineNote,
  Injury,
  ReportStatus,
} from "@/features/reports/types";

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
  status: text("status").$type<ReportStatus>().notNull().default("draft"),
  scheduledCall: text("scheduled_call"),
  actualStart: text("actual_start"),
  endTime: text("end_time"),
  generalNotes: text("general_notes").notNull().default(""),
  scheduleNotes: text("schedule_notes").notNull().default(""),
  nextRehearsalDate: date("next_rehearsal_date"),
  nextRehearsalTime: text("next_rehearsal_time"),
  nextRehearsalLocation: text("next_rehearsal_location"),
  nextRehearsalNotes: text("next_rehearsal_notes"),
  attendancePresent: integer("attendance_present").notNull().default(0),
  attendanceAbsent: integer("attendance_absent").notNull().default(0),
  attendanceLate: integer("attendance_late").notNull().default(0),
  breaks: jsonb("breaks").$type<Break[]>().notNull().default([]),
  scenesWorked: jsonb("scenes_worked").$type<SceneWorked[]>().notNull().default([]),
  scheduleChanges: jsonb("schedule_changes").$type<ScheduleChange[]>().notNull().default([]),
  attendanceNotes: jsonb("attendance_notes").$type<AttendanceNote[]>().notNull().default([]),
  lineNotes: jsonb("line_notes").$type<LineNote[]>().notNull().default([]),
  injuries: jsonb("injuries").$type<Injury[]>().notNull().default([]),
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
  // Per-report notes for CUSTOM departments (key → HTML). The 12 standard
  // departments above keep their own columns; this only holds user-added ones.
  deptNotes: jsonb("dept_notes").$type<Record<string, string>>().notNull().default({}),
  distributedAt: timestamp("distributed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("rehearsal_reports_production_idx").on(table.productionId),
]);

export type RehearsalReport = typeof rehearsalReports.$inferSelect;
export type NewRehearsalReport = typeof rehearsalReports.$inferInsert;
