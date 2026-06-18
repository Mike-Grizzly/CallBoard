import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { profiles } from "./users";

export const productionMemberships = pgTable("production_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  characterName: text("character_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("prod_memberships_user_idx").on(table.userId),
  index("prod_memberships_production_idx").on(table.productionId),
]);

export type ProductionMembership = typeof productionMemberships.$inferSelect;
export type NewProductionMembership = typeof productionMemberships.$inferInsert;
