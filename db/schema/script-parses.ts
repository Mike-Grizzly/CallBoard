import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { documents } from "./documents";
import { profiles } from "./users";

/**
 * One AI script-analysis job per request. This is a STAGING artifact, not the
 * source of truth: the model's proposed cast list, scene breakdown, and
 * bookmarks land here as `result` and are only written into
 * `production_roles` / `production_scenes` / `script_annotations` once a human
 * approves them (see `applyScriptParse`). That keeps unreviewed AI output out
 * of the production's real tables.
 *
 * Server-only table (RLS enabled, no policies) — reached exclusively through
 * the Drizzle service connection, like `push_subscriptions`.
 */
export const scriptParses = pgTable("script_parses", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  // The script document that was analysed.
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  // processing → ready (awaiting review) → applied; or failed.
  status: text("status").notNull().default("processing"),
  // The model's proposal: { title, roles[], scenes[], bookmarks[] }.
  result: jsonb("result"),
  // Failure detail when status = 'failed'.
  error: text("error"),
  requestedBy: uuid("requested_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ScriptParse = typeof scriptParses.$inferSelect;
export type NewScriptParse = typeof scriptParses.$inferInsert;
