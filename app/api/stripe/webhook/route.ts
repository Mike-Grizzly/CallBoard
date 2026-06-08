import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { stripe } from "@/lib/stripe";

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

    const where = orgId
      ? eq(organizations.id, orgId)
      : eq(organizations.stripeCustomerId, customerId);

    await db
      .update(organizations)
      .set({
        stripeSubscriptionId: sub.id,
        stripeCustomerId: customerId,
        subscriptionStatus: sub.status,
        plan: "company",
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        updatedAt: new Date(),
      })
      .where(where);
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (typeof session.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
    }
  } catch {
    // Returning 500 makes Stripe retry; a malformed event shouldn't loop forever.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
