import Stripe from "stripe";

// Server-only. Null until STRIPE_SECRET_KEY is set, so the app builds/runs
// before Stripe is wired up. Uses the SDK's pinned API version.
const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key) : null;

export const stripeConfigured = Boolean(key);

export type BillingInterval = "monthly" | "annual";
export type PaidPlanId = "season" | "repertory" | "company";

const PAID_PLANS: PaidPlanId[] = ["season", "repertory", "company"];
const INTERVALS: BillingInterval[] = ["monthly", "annual"];

// Recurring Price IDs from the Stripe dashboard (not secret). Six total:
// 3 plans × {monthly, annual}. Stored as env vars rather than in the CMS so
// the money path never depends on Sanity content being populated, and the
// webhook can reverse-map a price → plan cheaply.
export const STRIPE_PRICE_IDS: Record<
  PaidPlanId,
  Record<BillingInterval, string | undefined>
> = {
  season: {
    monthly: process.env.STRIPE_PRICE_SEASON_MONTHLY,
    annual: process.env.STRIPE_PRICE_SEASON_ANNUAL,
  },
  repertory: {
    monthly: process.env.STRIPE_PRICE_REPERTORY_MONTHLY,
    annual: process.env.STRIPE_PRICE_REPERTORY_ANNUAL,
  },
  company: {
    monthly: process.env.STRIPE_PRICE_COMPANY_MONTHLY,
    annual: process.env.STRIPE_PRICE_COMPANY_ANNUAL,
  },
};

export function isPaidPlanId(value: string): value is PaidPlanId {
  return (PAID_PLANS as string[]).includes(value);
}

// ─── Designer package (individual-billed sub-product) ───────────────────────
// A separate billing axis from the org plans: billed to the USER, not the org.
// Three tiers × {monthly, annual} = six prices, created in the Stripe dashboard
// and wired in via env. See docs/feature-specs/21-designer-seats.md.
export type DesignerTier = "single" | "bundle" | "pro";

const DESIGNER_TIERS: DesignerTier[] = ["single", "bundle", "pro"];

export const DESIGNER_PRICE_IDS: Record<
  DesignerTier,
  Record<BillingInterval, string | undefined>
> = {
  single: {
    monthly: process.env.STRIPE_PRICE_DESIGNER_SINGLE_MONTHLY,
    annual: process.env.STRIPE_PRICE_DESIGNER_SINGLE_ANNUAL,
  },
  bundle: {
    monthly: process.env.STRIPE_PRICE_DESIGNER_BUNDLE_MONTHLY,
    annual: process.env.STRIPE_PRICE_DESIGNER_BUNDLE_ANNUAL,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_DESIGNER_PRO_MONTHLY,
    annual: process.env.STRIPE_PRICE_DESIGNER_PRO_ANNUAL,
  },
};

export function isDesignerTier(value: string): value is DesignerTier {
  return (DESIGNER_TIERS as string[]).includes(value);
}

export function designerPriceIdFor(
  tier: DesignerTier,
  interval: BillingInterval,
): string | undefined {
  return DESIGNER_PRICE_IDS[tier]?.[interval];
}

/** Reverse-map a Stripe price id to a designer tier + interval (for the webhook). */
export function designerTierForPriceId(
  priceId: string,
): { tier: DesignerTier; interval: BillingInterval } | null {
  for (const tier of DESIGNER_TIERS) {
    for (const interval of INTERVALS) {
      if (DESIGNER_PRICE_IDS[tier][interval] === priceId) {
        return { tier, interval };
      }
    }
  }
  return null;
}

/** Designer tiers with at least one configured price — purchasable right now. */
export function availableDesignerTiers(): DesignerTier[] {
  return DESIGNER_TIERS.filter(
    (t) => DESIGNER_PRICE_IDS[t].monthly || DESIGNER_PRICE_IDS[t].annual,
  );
}

export function priceIdFor(
  plan: PaidPlanId,
  interval: BillingInterval,
): string | undefined {
  return STRIPE_PRICE_IDS[plan]?.[interval];
}

/** Reverse-map a Stripe price id back to our plan + interval (for the webhook). */
export function planForPriceId(
  priceId: string,
): { plan: PaidPlanId; interval: BillingInterval } | null {
  for (const plan of PAID_PLANS) {
    for (const interval of INTERVALS) {
      if (STRIPE_PRICE_IDS[plan][interval] === priceId) {
        return { plan, interval };
      }
    }
  }
  return null;
}

/** Paid plans with at least one configured price — i.e. purchasable right now. */
export function availablePaidPlans(): PaidPlanId[] {
  return PAID_PLANS.filter(
    (p) => STRIPE_PRICE_IDS[p].monthly || STRIPE_PRICE_IDS[p].annual,
  );
}
