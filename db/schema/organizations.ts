import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Organizations are the top-level tenant in Show Portal.
 * Every show-scoped record descends from an organization.
 *
 * MVP note: we only support a single seeded organization during testing.
 * Org creation UI and org switching are explicitly out of scope.
 */
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
