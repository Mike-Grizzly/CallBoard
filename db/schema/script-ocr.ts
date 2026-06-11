import { pgTable, uuid, text, jsonb, integer, timestamp } from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { documents } from "./documents";
import { profiles } from "./users";

/**
 * OCR text layer for a scanned/image-only script, produced in the browser by
 * tesseract.js (see `lib/ocr.ts`). A scanned PDF has no extractable text, so
 * the Script tool's selection / copy / search / line-highlighting tools are
 * dead. Running OCR fills `pages` with per-word boxes which the viewer paints
 * as the transparent text layer, turning those tools back on.
 *
 * The result is a property of the FILE, not the user — so it's keyed by
 * `storage_path` + `script_version` and reused for everyone in the production
 * (OCR runs once, not per viewer). There is no per-page text drift because
 * boxes are stored normalized (0..1 of page width/height), so they map to any
 * render scale.
 *
 * Server-only table (RLS enabled, no policies) — reached exclusively through
 * the Drizzle service connection, like `script_parses` / `push_subscriptions`.
 * App code enforces one row per (storage_path, script_version); no composite
 * unique constraint (those hang `drizzle-kit push`).
 */
export const scriptOcr = pgTable("script_ocr", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id").references(() => productions.id, {
    onDelete: "cascade",
  }),
  documentId: uuid("document_id").references(() => documents.id, {
    onDelete: "cascade",
  }),
  // Identity of the OCR'd file. `script_version` bumps when the default script
  // is replaced, so a new upload re-OCRs rather than reusing stale boxes.
  storagePath: text("storage_path").notNull(),
  scriptVersion: integer("script_version").notNull().default(1),
  // processing (a viewer is running it) → ready; or failed.
  status: text("status").notNull().default("processing"),
  pageCount: integer("page_count"),
  // OcrPage[] — [{ page, words: [{ t, x0, y0, x1, y1 }] }] with normalized
  // (0..1) coordinates. See features/scripts/constants.ts.
  pages: jsonb("pages"),
  createdBy: uuid("created_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ScriptOcrRow = typeof scriptOcr.$inferSelect;
export type NewScriptOcr = typeof scriptOcr.$inferInsert;
