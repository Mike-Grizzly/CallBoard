import { pgTable, uuid, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

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
  // Entitlement source of truth: 'free' | 'season' | 'repertory' | 'company'.
  // New orgs start on 'free'; the Stripe webhook flips this to the paid tier
  // the org checks out on. See features/billing/constants.ts for limits.
  plan: text("plan").notNull().default("free"),
  // Write-once anchor for the app-managed 60-day trial. Set when the org
  // creates its FIRST production (NOT at signup), and never cleared — so
  // deleting/archiving that production cannot reset or farm the trial.
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true }),
  // Derived convenience = trialStartedAt + 60 days, stamped alongside it so
  // existing entitlement code can read a concrete end date.
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  // End of the current paid period (from Stripe), for access-after-cancel.
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  // Existing orgs at launch are grandfathered into full access forever.
  grandfathered: boolean("grandfathered").notNull().default(false),
  // How far through the post-trial email/purge lifecycle this org has been
  // taken — the daily cron uses it to send each milestone once and purge once.
  // See features/billing/lifecycle.ts.
  billingLifecycleStage: integer("billing_lifecycle_stage").notNull().default(0),
  // Soft-delete. Null = live, non-null = deleted: removed from the workspace
  // switcher and never resolved as a user's active org, but retained for 30
  // days so support can restore it. Hard purge is deferred.
  deletedAt: timestamp("deleted_at", { withTimezone: true }),

  // ─── Onboarding profile (captured in the create-workspace wizard) ──────
  // Self-reported company profile. Optional — every survey step is skippable,
  // so all three are nullable. Stored as the free-text bucket labels from
  // features/workspace/constants.ts; used to tailor defaults and for product
  // insight, not for any access decision.
  annualShows: text("annual_shows"),
  teamSize: text("team_size"),
  productionTypes: text("production_types").array(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
