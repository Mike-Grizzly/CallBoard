import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { users } from "./users";

export const productionMemberships = pgTable(
  "production_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productionId: uuid("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.userId, table.productionId)],
);

export type ProductionMembership = typeof productionMemberships.$inferSelect;
export type NewProductionMembership = typeof productionMemberships.$inferInsert;
