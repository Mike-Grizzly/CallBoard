import "server-only";
import Stripe from "stripe";
import {
  DESIGNER_PLAN_IDS,
  type DesignerPlanId,
} from "@/features/designer/constants";

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

// ─── Designer seats (Proscene Studio) — per-user subscriptions ──────────────
// A separate set of products/prices from the org plans above. The Stripe
// webhook routes a checkout to the per-user entitlement (profiles.designer_*)
// rather than an org's `plan` when the subscribed price matches one of these.
// Six prices: 3 tiers × {monthly, annual}. Like the org price ids, these are
// env-var-driven so the money path never depends on CMS content.
export const STRIPE_DESIGNER_PRICE_IDS: Record<
  DesignerPlanId,
  Record<BillingInterval, string | undefined>
> = {
  single_tool: {
    monthly: process.env.STRIPE_PRICE_SINGLE_TOOL_MONTHLY,
    annual: process.env.STRIPE_PRICE_SINGLE_TOOL_ANNUAL,
  },
  studio: {
    monthly: process.env.STRIPE_PRICE_STUDIO_MONTHLY,
    annual: process.env.STRIPE_PRICE_STUDIO_ANNUAL,
  },
  studio_pro: {
    monthly: process.env.STRIPE_PRICE_STUDIO_PRO_MONTHLY,
    annual: process.env.STRIPE_PRICE_STUDIO_PRO_ANNUAL,
  },
};

export function designerPriceIdFor(
  plan: DesignerPlanId,
  interval: BillingInterval,
): string | undefined {
  return STRIPE_DESIGNER_PRICE_IDS[plan]?.[interval];
}

/** Reverse-map a Stripe price id to a designer plan + interval (for the webhook). */
export function designerPlanForPriceId(
  priceId: string,
): { plan: DesignerPlanId; interval: BillingInterval } | null {
  for (const plan of DESIGNER_PLAN_IDS) {
    for (const interval of INTERVALS) {
      if (STRIPE_DESIGNER_PRICE_IDS[plan][interval] === priceId) {
        return { plan, interval };
      }
    }
  }
  return null;
}

/** Designer tiers with at least one configured price — purchasable right now. */
export function availableDesignerPlans(): DesignerPlanId[] {
  return DESIGNER_PLAN_IDS.filter(
    (p) =>
      STRIPE_DESIGNER_PRICE_IDS[p].monthly || STRIPE_DESIGNER_PRICE_IDS[p].annual,
  );
}
