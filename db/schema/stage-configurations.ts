import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { documents } from "./documents";

export const stageConfigurations = pgTable("stage_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  groundPlanDocumentId: uuid("ground_plan_document_id").references(
    () => documents.id,
    { onDelete: "set null" },
  ),
  prosceniumWidthFt: real("proscenium_width_ft").notNull(),
  stageDepthFt: real("stage_depth_ft").notNull(),
  // Two calibration points (percent of canvas dimensions, 0-100)
  calibrationX1: real("calibration_x1"),
  calibrationY1: real("calibration_y1"),
  calibrationX2: real("calibration_x2"),
  calibrationY2: real("calibration_y2"),
  // Which page of the ground plan PDF to render (1-indexed)
  groundPlanPage: integer("ground_plan_page").notNull().default(1),
  // Storage path to a JPEG rasterized from the chosen PDF page during setup.
  // When present, the blocking canvas renders this <img> instead of running
  // pdf.js — keeps iOS Safari from OOM'ing on vector-heavy ground plans and
  // skips PDF parsing on every page load. Falls back to live PDF render when
  // null (legacy stage configs).
  groundPlanImagePath: text("ground_plan_image_path"),
  // Derived: pixels per foot at reference render size (used for grid overlay)
  pixelsPerFoot: real("pixels_per_foot"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type StageConfiguration = typeof stageConfigurations.$inferSelect;
export type NewStageConfiguration = typeof stageConfigurations.$inferInsert;
