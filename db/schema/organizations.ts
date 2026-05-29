import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Organizations are the top-level tenant in Show Portal.
 * Every show-scoped record descends from an organization.
 *
 * Multi-org is live; a user's "current org" is resolved via
 * `profiles.selected_organization_id` (see `lib/auth.ts`).
 */
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  // Optional workspace logo. Stored as a Supabase Storage path inside the
  // `attachments` bucket (e.g. `org-logos/{orgId}/{ts}.png`); display
  // surfaces sign the URL on demand. Null = render the default building
  // glyph.
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
