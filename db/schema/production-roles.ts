import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { productions } from "./productions";

/**
 * The cast list / character roles for a production, captured in the setup
 * wizard. This is the planning artifact (who plays what); actual access for
 * cast members lives in `production_memberships`. `actor` is free text so a
 * role can be cast before the person has an account — it is intentionally not
 * a foreign key.
 */
export const productionRoles = pgTable("production_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  // Character / role name, e.g. "Frederic".
  name: text("name").notNull(),
  // Optional actor name (free text — may not be an org member yet).
  actor: text("actor"),
  // One of the wizard's role types: Principal, Supporting, Ensemble, etc.
  type: text("type").notNull().default("Principal"),
  // Display order as entered in the wizard.
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProductionRole = typeof productionRoles.$inferSelect;
export type NewProductionRole = typeof productionRoles.$inferInsert;
