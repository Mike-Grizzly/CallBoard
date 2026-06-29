import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, profiles } from "@/db/schema";
import { stripe, planForPriceId, designerPlanForPriceId } from "@/lib/stripe";
import { isDesignerPlanId, isDesignerTool } from "@/features/designer/constants";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const syncSubscription = async (sub: Stripe.Subscription) => {
    const orgId =
      typeof sub.metadata?.organizationId === "string"
        ? sub.metadata.organizationId
        : null;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    // current_period_end has moved across API versions — read defensively.
    const periodEnd =
      (sub as unknown as { current_period_end?: number | null }).current_period_end ??
      sub.items?.data?.[0]?.current_period_end ??
      null;

    // Derive the plan from the subscribed price (fall back to the checkout
    // metadata). While the subscription is in a paying/trialing/dunning state
    // the org sits on that plan; once it's truly gone (canceled, unpaid,
    // expired) it drops back to 'free' so the concurrency limit reapplies —
    // access during a canceled-but-not-yet-lapsed period is governed by
    // subscriptionStatus + currentPeriodEnd in billingState, not by plan.
    const priceId = sub.items?.data?.[0]?.price?.id;
    const mapped = priceId ? planForPriceId(priceId) : null;
    const metaPlan =
      typeof sub.metadata?.plan === "string" ? sub.metadata.plan : null;
    const activeish = ["active", "trialing", "past_due"].includes(sub.status);
    const plan = activeish ? (mapped?.plan ?? metaPlan ?? "free") : "free";

    const where = orgId
      ? eq(organizations.id, orgId)
      : eq(organizations.stripeCustomerId, customerId);

    await db
      .update(organizations)
      .set({
        stripeSubscriptionId: sub.id,
        stripeCustomerId: customerId,
        subscriptionStatus: sub.status,
        plan,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        updatedAt: new Date(),
      })
      .where(where);
  };

  // Studio (designer-seat) subscriptions are billed to a PERSON, not an org, so
  // they update the per-user entitlement on `profiles` rather than an org plan.
  const syncDesignerSubscription = async (sub: Stripe.Subscription) => {
    const profileId =
      typeof sub.metadata?.profileId === "string" ? sub.metadata.profileId : null;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    const periodEnd =
      (sub as unknown as { current_period_end?: number | null }).current_period_end ??
      sub.items?.data?.[0]?.current_period_end ??
      null;

    const priceId = sub.items?.data?.[0]?.price?.id;
    const mapped = priceId ? designerPlanForPriceId(priceId) : null;
    const metaPlan =
      typeof sub.metadata?.designerPlan === "string" ? sub.metadata.designerPlan : null;
    const metaTool =
      typeof sub.metadata?.tool === "string" ? sub.metadata.tool : null;

    // Keep the tier even when canceled/lapsed so access-after-cancel knows which
    // plan it was; the entitlement helper decides actual access from status +
    // period end. `tool` only applies to the single-tool tier.
    const plan = mapped?.plan ?? (isDesignerPlanId(metaPlan) ? metaPlan : null);
    const tool =
      plan === "single_tool" && isDesignerTool(metaTool) ? metaTool : null;

    const where = profileId
      ? eq(profiles.id, profileId)
      : eq(profiles.designerStripeCustomerId, customerId);

    await db
      .update(profiles)
      .set({
        designerStripeSubscriptionId: sub.id,
        designerStripeCustomerId: customerId,
        designerSubscriptionStatus: sub.status,
        designerPlan: plan,
        designerTool: tool,
        designerCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        updatedAt: new Date(),
      })
      .where(where);
  };

  // A subscription is a designer seat if it's tagged as one at checkout, or its
  // price maps to a designer tier (defensive fallback if metadata is missing).
  const isDesignerSubscription = (sub: Stripe.Subscription): boolean => {
    if (sub.metadata?.kind === "designer") return true;
    const priceId = sub.items?.data?.[0]?.price?.id;
    return !!(priceId && designerPlanForPriceId(priceId));
  };

  const routeSubscription = async (sub: Stripe.Subscription) => {
    if (isDesignerSubscription(sub)) await syncDesignerSubscription(sub);
    else await syncSubscription(sub);
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (typeof session.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          await routeSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await routeSubscription(event.data.object as Stripe.Subscription);
        break;
    }
  } catch {
    // Returning 500 makes Stripe retry; a malformed event shouldn't loop forever.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
