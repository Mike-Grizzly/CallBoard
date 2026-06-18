import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

/**
 * Per-organization cache of verified script breakdowns, keyed by a content
 * fingerprint (hash of the extracted text) within an org. When an upload
 * matches a previously human-applied parse of the identical file *in the same
 * org*, we reuse the result instead of re-calling the model — instant and free.
 *
 * Scoped per org on purpose: a script can carry prompt-injection that steers
 * the model's output, so a breakdown produced (and applied) in one org must
 * never be served to another. Identical files across orgs simply re-parse.
 *
 * PRIVACY: `result` holds ONLY the derived structural breakdown
 * ({ title, roles, scenes, bookmarks }) — never any user's personal annotations
 * (highlights/notes/cues/ink), casting, production data, or the script text.
 *
 * Server-only (RLS enabled, no policies), reached via the Drizzle service
 * connection.
 */
export const scriptCache = pgTable(
  "script_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fingerprint: text("fingerprint").notNull(),
    title: text("title"),
    result: jsonb("result").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("script_cache_org_fingerprint_key").on(
      t.organizationId,
      t.fingerprint,
    ),
  ],
);

export type ScriptCache = typeof scriptCache.$inferSelect;
export type NewScriptCache = typeof scriptCache.$inferInsert;
