import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { profiles } from "./users";

export const productionLogs = pgTable("production_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProductionLog = typeof productionLogs.$inferSelect;
export type NewProductionLog = typeof productionLogs.$inferInsert;
