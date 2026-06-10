import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * Global, cross-org cache of verified script breakdowns, keyed by a content
 * fingerprint (hash of the extracted text). When an upload matches a previously
 * human-applied parse of the identical file, we reuse the result instead of
 * re-calling the model — instant and free. Licensing houses distribute the same
 * PDF to every company, so identical-file matches happen across orgs.
 *
 * PRIVACY: `result` holds ONLY the derived structural breakdown
 * ({ title, roles, scenes, bookmarks }) — never any user's personal annotations
 * (highlights/notes/cues/ink), casting, production data, or the script text.
 * That is the only thing shared across orgs.
 *
 * Server-only (RLS enabled, no policies), reached via the Drizzle service
 * connection. No org column — the cache is intentionally global.
 */
export const scriptCache = pgTable("script_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  fingerprint: text("fingerprint").notNull().unique(),
  title: text("title"),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ScriptCache = typeof scriptCache.$inferSelect;
export type NewScriptCache = typeof scriptCache.$inferInsert;
