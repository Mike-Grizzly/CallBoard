import { pgTable, uuid, text, jsonb, integer, timestamp } from "drizzle-orm/pg-core";
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
  // Nullable: a "wizard" parse runs during new-production setup, before the
  // production (and its document) exist. Those rows are owned by `requestedBy`
  // and carry `storagePath` instead; they're linked to a production later by
  // `attachWizardScript`.
  productionId: uuid("production_id").references(() => productions.id, {
    onDelete: "cascade",
  }),
  documentId: uuid("document_id").references(() => documents.id, {
    onDelete: "cascade",
  }),
  // Temp storage path of the uploaded PDF for a wizard parse (no document row
  // yet). Null once a document_id is set.
  storagePath: text("storage_path"),
  // processing → ready (awaiting review) → applied; or failed.
  status: text("status").notNull().default("processing"),
  // The model's proposal: { title, roles[], scenes[], bookmarks[] }.
  result: jsonb("result"),
  // Failure detail when status = 'failed'.
  error: text("error"),
  // Anthropic token usage for this parse — for cost visibility and monitoring.
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
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
