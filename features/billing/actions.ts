"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  stripe,
  priceIdFor,
  isPaidPlanId,
  type BillingInterval,
  type PaidPlanId,
} from "@/lib/stripe";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.proscene.app";

/** Start a subscription Checkout for the caller's org. Returns a redirect URL. */
export async function createCheckoutSession(
  plan: PaidPlanId,
  interval: BillingInterval,
): Promise<{ url?: string; error?: string }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "settings:manage")) {
    return { error: "Only an admin can manage billing." };
  }
  if (!stripe) return { error: "Billing isn't set up yet." };
  if (!isPaidPlanId(plan)) return { error: "Unknown plan." };

  const priceId = priceIdFor(plan, interval);
  if (!priceId) return { error: "That plan isn't available yet." };

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);
  if (!org) return { error: "Organization not found." };

  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: org.name,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
    await db
      .update(organizations)
      .set({ stripeCustomerId: customerId })
      .where(eq(organizations.id, org.id));
  }

  // If they subscribe DURING their free trial, collect the card now but defer
  // the first charge to the end of the 60-day trial — so "add a card now"
  // honors the remaining free days and auto-starts the plan at trial end.
  // Stripe requires trial_end to be at least ~48h out; otherwise charge now.
  const now = Date.now();
  const trialEndMs = org.trialEndsAt ? org.trialEndsAt.getTime() : 0;
  const deferToTrialEnd =
    !org.grandfathered &&
    !["active", "past_due", "trialing"].includes(org.subscriptionStatus ?? "") &&
    trialEndMs > now + 48 * 3600 * 1000;

  const base = siteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: org.id,
    subscription_data: {
      metadata: { organizationId: org.id, plan },
      ...(deferToTrialEnd ? { trial_end: Math.floor(trialEndMs / 1000) } : {}),
    },
    allow_promotion_codes: true,
    success_url: `${base}/settings/billing?checkout=success`,
    cancel_url: `${base}/settings/billing?checkout=cancel`,
  });

  return { url: session.url ?? undefined };
}

/** Open the Stripe Customer Portal so an admin can manage/cancel the plan. */
export async function createPortalSession(): Promise<{ url?: string; error?: string }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "settings:manage")) {
    return { error: "Only an admin can manage billing." };
  }
  if (!stripe) return { error: "Billing isn't set up yet." };

  const [org] = await db
    .select({ stripeCustomerId: organizations.stripeCustomerId })
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);
  if (!org?.stripeCustomerId) return { error: "No billing account yet — subscribe first." };

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${siteUrl()}/settings/billing`,
  });

  return { url: session.url };
}
