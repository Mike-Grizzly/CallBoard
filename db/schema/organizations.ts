import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

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

  // ─── Billing (org-level subscription) ──────────────────────────────────
  // Stripe linkage + status, synced from webhooks.
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // 'trialing' | 'active' | 'past_due' | 'canceled' | null
  subscriptionStatus: text("subscription_status"),
  // The tier the org is on (v1 has one: 'company'); null = none.
  plan: text("plan"),
  // App-managed 60-day free trial from signup (independent of Stripe).
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  // End of the current paid period (from Stripe), for access-after-cancel.
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  // Existing orgs at launch are grandfathered into full access forever.
  grandfathered: boolean("grandfathered").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
