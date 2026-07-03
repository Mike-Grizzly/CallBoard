import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  requestedRole: text("requested_role"),
  phone: text("phone"),
  pronouns: text("pronouns"),
  // "active" | "invited" | "inactive". Defaults to "active" so existing rows
  // (people who already signed up) stay correct after the migration; the
  // invite flow sets "invited" explicitly.
  status: text("status").notNull().default("active"),
  // Product surface the user is entitled to. "full" = the whole app (org
  // members). "designer" = the self-contained Focus View only (individual
  // "designer package" subscribers), gated in proxy.ts. Defaults to "full"
  // so every existing user keeps full access after the migration.
  accessMode: text("access_mode").notNull().default("full"),
  // Which org this user is currently viewing. Nullable: when null,
  // `getCurrentUser` falls back to the user's first active membership. Set
  // by the org switcher; ON DELETE SET NULL so deleting an org doesn't
  // strand its former members.
  selectedOrganizationId: uuid("selected_organization_id").references(
    () => organizations.id,
    { onDelete: "set null" },
  ),

  // ─── Designer seat (Proscene Studio) — per-user subscription ───────────────
  // The individual "designer package" entitlement, orthogonal to org plans
  // (which live on organizations.*). Synced from Stripe webhooks keyed on the
  // subscription's profileId metadata. Null designerPlan = no active seat.
  // 'single_tool' | 'studio' | 'studio_pro'.
  designerPlan: text("designer_plan"),
  // For 'single_tool' only: which tool they bought — 'script' | 'blocking'.
  designerTool: text("designer_tool"),
  // 'trialing' | 'active' | 'past_due' | 'canceled' | null (mirrors Stripe).
  designerSubscriptionStatus: text("designer_subscription_status"),
  // Personal Stripe customer/subscription for the seat — separate from any
  // org's stripeCustomerId, since a designer may also belong to paid orgs.
  designerStripeCustomerId: text("designer_stripe_customer_id"),
  designerStripeSubscriptionId: text("designer_stripe_subscription_id"),
  // End of the current paid period (from Stripe), for access-after-cancel.
  designerCurrentPeriodEnd: timestamp("designer_current_period_end", {
    withTimezone: true,
  }),

  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
