"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, organizations } from "@/db/schema";
import { requireCurrentUser, isDesignerOnly } from "@/lib/auth";
import { newTrialEnd } from "@/lib/billing";
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
import { requestSiteUrl } from "@/lib/site-url";

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

  const base = await requestSiteUrl();
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
    return_url: `${await requestSiteUrl()}/focus`,
  });
  return { url: session.url };
}

/**
 * Resolve everything a plan change needs: the caller's LIVE subscription, its
 * single item, and the target price — keeping the subscriber's current billing
 * interval (an annual subscriber moves to the annual price of the new tier,
 * monthly to monthly). Shared by the preview and the actual change so the
 * numbers the user confirms are exactly what runs.
 */
async function resolveDesignerPlanChange(
  userId: string,
  plan: DesignerPlanId,
): Promise<
  | { error: string; samePlan?: boolean }
  | {
      error?: undefined;
      samePlan?: boolean;
      subId: string;
      itemId: string;
      customerId: string;
      newPriceId: string;
      interval: BillingInterval;
    }
> {
  if (!stripe) return { error: "Billing isn't set up yet." };
  if (!isDesignerPlanId(plan)) return { error: "Unknown plan." };

  const [row] = await db
    .select({
      subId: profiles.designerStripeSubscriptionId,
      status: profiles.designerSubscriptionStatus,
      currentPlan: profiles.designerPlan,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  if (!row) return { error: "Profile not found." };
  if (row.currentPlan === plan) {
    return { error: "You're already on that plan.", samePlan: true };
  }

  if (
    !row.subId ||
    !["active", "trialing", "past_due"].includes(row.status ?? "")
  ) {
    return {
      error:
        "We couldn't find an active subscription to change — open billing to manage your plan.",
    };
  }

  const sub = await stripe.subscriptions.retrieve(row.subId);
  const item = sub.items?.data?.[0];
  if (!item?.id) return { error: "Couldn't read your subscription." };

  const interval: BillingInterval =
    item.price?.recurring?.interval === "year" ? "annual" : "monthly";
  const newPriceId = designerPriceIdFor(plan, interval);
  if (!newPriceId) return { error: "That plan isn't available yet." };

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  return { subId: row.subId, itemId: item.id, customerId, newPriceId, interval };
}

export type DesignerPlanChangePreview = {
  plan: DesignerPlanId;
  interval: BillingInterval;
  /** Prorated amount charged the moment they confirm, in cents (can be 0). */
  dueTodayCents: number;
  /** The new tier's recurring price in cents, on the kept interval. */
  recurringCents: number;
};

/**
 * Price a plan change WITHOUT executing it — the confirmation step. Returns the
 * exact prorated amount Stripe would invoice today plus the new recurring
 * price, so the user consents to a real number before any charge happens.
 */
export async function previewDesignerPlanChange(
  plan: DesignerPlanId,
): Promise<{ preview?: DesignerPlanChangePreview; error?: string }> {
  if (!BILLING_ENABLED) return { error: BETA_PAUSED_MSG };
  const user = await requireCurrentUser();
  const resolved = await resolveDesignerPlanChange(user.id, plan);
  if (resolved.error !== undefined || !stripe) {
    return { error: resolved.error ?? "Billing isn't set up yet." };
  }

  const [upcoming, price] = await Promise.all([
    stripe.invoices.createPreview({
      customer: resolved.customerId,
      subscription: resolved.subId,
      subscription_details: {
        items: [{ id: resolved.itemId, price: resolved.newPriceId }],
        proration_behavior: "always_invoice",
      },
    }),
    stripe.prices.retrieve(resolved.newPriceId),
  ]);

  return {
    preview: {
      plan,
      interval: resolved.interval,
      dueTodayCents: Math.max(0, upcoming.amount_due),
      recurringCents: price.unit_amount ?? 0,
    },
  };
}

/**
 * Change the caller's Studio seat to a different tier in place (e.g. Single
 * Tool -> Studio to unlock the other tool). Swaps the subscription's price
 * (prorated, keeping the current billing interval) and syncs the entitlement
 * immediately so the tool unlocks without waiting on the webhook. Requires a
 * live subscription; a lapsed/absent one is directed to checkout/portal
 * instead. Callers must show `previewDesignerPlanChange` and get explicit
 * confirmation BEFORE calling this — it charges the card on the spot.
 */
export async function changeDesignerPlan(
  plan: DesignerPlanId,
): Promise<{ ok?: boolean; error?: string }> {
  if (!BILLING_ENABLED) return { error: BETA_PAUSED_MSG };
  const user = await requireCurrentUser();
  const resolved = await resolveDesignerPlanChange(user.id, plan);
  if (resolved.samePlan) return { ok: true };
  if (resolved.error !== undefined || !stripe) {
    return { error: resolved.error ?? "Billing isn't set up yet." };
  }

  try {
    await stripe.subscriptions.update(resolved.subId, {
      items: [{ id: resolved.itemId, price: resolved.newPriceId }],
      proration_behavior: "always_invoice",
      // Fail-closed on money: if the prorated charge can't be collected right
      // now, Stripe errors and leaves the subscription on its current price
      // (no partial change) — so we never grant the higher tier on a declined
      // card. The user is directed to fix billing and retry.
      payment_behavior: "error_if_incomplete",
      metadata: { kind: "designer", profileId: user.id, designerPlan: plan },
    });
  } catch {
    return {
      error:
        "We couldn't complete the payment for that upgrade — check your card in billing and try again.",
    };
  }

  // The charge succeeded, so grant now for an instant unlock (the webhook also
  // confirms). Bundles include both tools, so clear any single-tool choice.
  await db
    .update(profiles)
    .set({ designerPlan: plan, designerTool: null, updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  return { ok: true };
}

/**
 * Convert a designer-only account to the FULL app — no re-signup, no charge.
 * Their personal workspace is already an organization (they're its admin), so
 * everything they've built carries over; this just (1) stops the Studio seat
 * from billing again (cancel at period end — they keep what they paid for),
 * (2) grants the org the standard 60-day trial FROM TODAY (a designer's
 * production may have silently started the org trial clock earlier — the
 * conversion is the org's real day one as a company workspace, and this flip
 * is one-way per account, so the re-stamp can't be farmed), and (3) flips
 * accessMode to "full" so the dashboard opens up.
 */
export async function upgradeToFullApp(): Promise<{
  ok?: boolean;
  error?: string;
}> {
  const user = await requireCurrentUser();
  if (!isDesignerOnly(user)) return { ok: true }; // already full — nothing to do

  // Stop the seat's next renewal FIRST (it's the only step touching Stripe):
  // the full app includes both tools, so the seat would be double-paying.
  // cancel_at_period_end keeps their remaining paid time and is reversible
  // from the portal. If Stripe fails, abort before any DB change — the user
  // simply retries; nothing is half-converted.
  if (stripe) {
    const [row] = await db
      .select({
        subId: profiles.designerStripeSubscriptionId,
        status: profiles.designerSubscriptionStatus,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    if (
      row?.subId &&
      ["active", "trialing", "past_due"].includes(row.status ?? "")
    ) {
      try {
        await stripe.subscriptions.update(row.subId, {
          cancel_at_period_end: true,
        });
      } catch {
        return {
          error:
            "We couldn't wind down your Studio seat — try again in a moment.",
        };
      }
    }
  }

  // Fresh 60-day trial from conversion day — unless the org is grandfathered
  // or already carries a live subscription. Skipped while billing is paused
  // (beta), matching startTrialIfFirstProduction: stamping during the free
  // beta would hand converts an already-burning clock.
  if (BILLING_ENABLED) {
    const [org] = await db
      .select({
        grandfathered: organizations.grandfathered,
        subscriptionStatus: organizations.subscriptionStatus,
      })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);
    const subscribed = ["active", "trialing", "past_due"].includes(
      org?.subscriptionStatus ?? "",
    );
    if (org && !org.grandfathered && !subscribed) {
      const now = new Date();
      await db
        .update(organizations)
        .set({
          trialStartedAt: now,
          trialEndsAt: newTrialEnd(now),
          updatedAt: now,
        })
        .where(eq(organizations.id, user.organizationId));
    }
  }

  await db
    .update(profiles)
    .set({ accessMode: "full", updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  return { ok: true };
}
