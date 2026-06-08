import Stripe from "stripe";

// Server-only. Null until STRIPE_SECRET_KEY is set, so the app builds/runs
// before Stripe is wired up. Uses the SDK's pinned API version.
const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key) : null;

export const stripeConfigured = Boolean(key);

// Recurring Price IDs (from the Stripe dashboard). Not secret.
export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
} as const;

export type BillingInterval = keyof typeof STRIPE_PRICES;
