"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireCurrentUser } from "@/lib/auth";
import {
  stripe,
  designerPriceIdFor,
  type BillingInterval,
} from "@/lib/stripe";
import { BILLING_ENABLED } from "@/features/billing/constants";
import {
  isDesignerPlanId,
  isDesignerTool,
  DESIGNER_PLANS,
  type DesignerPlanId,
  type DesignerTool,
} from "./constants";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.proscene.app";

const BETA_PAUSED_MSG =
  "Proscene is free during our open beta, so there's nothing to pay right now.";

/**
 * Start a Studio (designer-seat) subscription Checkout for the CURRENT USER.
 * Unlike the org checkout, the subscription is billed to the person: a personal
 * Stripe customer is stored on the profile, and `subscription_data.metadata`
 * carries `kind:"designer"` + `profileId` so the webhook routes it to the
 * per-user entitlement instead of an org's `plan`. No free trial in v1 —
 * the seat charges on subscribe and can be canceled any time.
 */
export async function createDesignerCheckoutSession(
  plan: DesignerPlanId,
  interval: BillingInterval,
  tool?: DesignerTool | null,
): Promise<{ url?: string; error?: string }> {
  if (!BILLING_ENABLED) return { error: BETA_PAUSED_MSG };
  const user = await requireCurrentUser();
  if (!stripe) return { error: "Billing isn't set up yet." };
  if (!isDesignerPlanId(plan)) return { error: "Unknown plan." };

  // Single Tool must pick exactly one tool; the bundles include both, so any
  // passed tool is ignored for them.
  const chosenTool =
    plan === DESIGNER_PLANS.SINGLE_TOOL && isDesignerTool(tool) ? tool : null;
  if (plan === DESIGNER_PLANS.SINGLE_TOOL && !chosenTool) {
    return { error: "Choose Script or Blocking for the Single Tool plan." };
  }

  const priceId = designerPriceIdFor(plan, interval);
  if (!priceId) return { error: "That plan isn't available yet." };

  const [row] = await db
    .select({
      stripeCustomerId: profiles.designerStripeCustomerId,
      subscriptionStatus: profiles.designerSubscriptionStatus,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!row) return { error: "Profile not found." };

  // Already have a live seat → send them to the portal instead of stacking subs.
  if (["active", "trialing", "past_due"].includes(row.subscriptionStatus ?? "")) {
    return {
      error: "You already have an active Studio seat — manage it from billing.",
    };
  }

  let customerId = row.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
      metadata: { profileId: user.id, kind: "designer" },
    });
    customerId = customer.id;
    await db
      .update(profiles)
      .set({ designerStripeCustomerId: customerId })
      .where(eq(profiles.id, user.id));
  }

  const base = siteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    subscription_data: {
      metadata: {
        kind: "designer",
        profileId: user.id,
        designerPlan: plan,
        ...(chosenTool ? { tool: chosenTool } : {}),
      },
    },
    allow_promotion_codes: true,
    success_url: `${base}/focus?checkout=success`,
    cancel_url: `${base}/focus?checkout=cancel`,
  });

  return { url: session.url ?? undefined };
}

/** Open the Stripe Customer Portal for the current user's Studio seat. */
export async function createDesignerPortalSession(): Promise<{
  url?: string;
  error?: string;
}> {
  if (!BILLING_ENABLED) return { error: BETA_PAUSED_MSG };
  const user = await requireCurrentUser();
  if (!stripe) return { error: "Billing isn't set up yet." };

  const [row] = await db
    .select({ stripeCustomerId: profiles.designerStripeCustomerId })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!row?.stripeCustomerId) {
    return { error: "No billing account yet — subscribe first." };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${siteUrl()}/focus`,
  });
  return { url: session.url };
}
