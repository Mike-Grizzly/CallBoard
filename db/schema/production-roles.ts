import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { profiles } from "./users";

/**
 * The cast list / character roles for a production, captured in the setup
 * wizard or written from a reviewed AI script analysis. This is the planning
 * artifact (who plays what). `actor` is free text so a role can be cast before
 * the person has an account; `assignedUserId` links the character to a real
 * org member once one is cast (see `assignRoleToMember`), which also grants
 * that person production access via `production_memberships`.
 */
export const productionRoles = pgTable("production_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  // Character / role name, e.g. "Frederic".
  name: text("name").notNull(),
  // Optional actor name (free text — may not be an org member yet). Kept in
  // sync with the assigned member's display name when one is cast.
  actor: text("actor"),
  // The org member cast in this role, if any. Null = not yet cast. ON DELETE
  // SET NULL: removing the person from the org leaves the character uncast.
  assignedUserId: uuid("assigned_user_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  // One of the wizard's role types: Principal, Supporting, Ensemble, etc.
  type: text("type").notNull().default("Principal"),
  // "ai" = written by applyScriptParse (replaced wholesale on the next parse);
  // "manual" = wizard / hand-added (preserved across re-parses).
  source: text("source").notNull().default("manual"),
  // Display order as entered in the wizard.
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProductionRole = typeof productionRoles.$inferSelect;
export type NewProductionRole = typeof productionRoles.$inferInsert;
