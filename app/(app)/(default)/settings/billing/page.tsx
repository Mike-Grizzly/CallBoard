import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Icon } from "@/components/ui/icon";
import { billingState, type BillingStatus } from "@/lib/billing";
import { stripeConfigured, STRIPE_PRICES } from "@/lib/stripe";
import { BillingButtons } from "./billing-buttons";

function fmtDate(d: Date | null) {
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const HEADLINE: Record<BillingStatus, string> = {
  grandfathered: "You're an early member — full access, on us.",
  trialing: "You're on a free trial.",
  active: "You're subscribed.",
  past_due: "There's a problem with your payment.",
  canceled: "Your plan is canceled.",
  trial_expired: "Your free trial has ended.",
  none: "Choose a plan.",
};

export default async function BillingSettingsPage() {
  const user = await requireCurrentUser();
  if (!can(user.role, "settings:manage")) redirect("/dashboard");

  const [org] = await db
    .select({
      name: organizations.name,
      grandfathered: organizations.grandfathered,
      subscriptionStatus: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt,
      currentPeriodEnd: organizations.currentPeriodEnd,
      stripeCustomerId: organizations.stripeCustomerId,
    })
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);
  if (!org) redirect("/dashboard");

  const state = billingState(org);
  const hasMonthly = !!STRIPE_PRICES.monthly;
  const hasAnnual = !!STRIPE_PRICES.annual;
  const isSubscribed = state.status === "active" || state.status === "past_due" || state.status === "canceled";

  let detail = "";
  switch (state.status) {
    case "grandfathered":
      detail = "Thanks for being here early — your workspace has full access to every feature, with nothing to pay. You're welcome to start a subscription below if you'd like, but you don't have to.";
      break;
    case "trialing":
      detail = `${state.daysLeftInTrial} day${state.daysLeftInTrial === 1 ? "" : "s"} left${state.trialEndsAt ? ` — your trial ends ${fmtDate(state.trialEndsAt)}.` : "."} Subscribe any time to keep your access after that.`;
      break;
    case "active":
      detail = "Your Company subscription is active. Manage your plan, payment method, or invoices below.";
      break;
    case "past_due":
      detail = "We couldn't process your latest payment. Update your card to keep your access.";
      break;
    case "canceled":
      detail = org.currentPeriodEnd
        ? `Your subscription is canceled. You keep access until ${fmtDate(org.currentPeriodEnd)}.`
        : "Your subscription is canceled. Resubscribe any time to restore access.";
      break;
    case "trial_expired":
      detail = "Subscribe to restore full access for your workspace.";
      break;
    default:
      detail = "Subscribe to unlock Company features for your whole workspace.";
  }

  return (
    <div className="page-narrow anim-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Link href="/settings" className="muted" style={{ fontSize: 13, textDecoration: "none" }}>
        <Icon name="ChevronLeft" size={14} aria-hidden /> Settings
      </Link>

      <div>
        <div className="h-eyebrow">Billing</div>
        <h1 className="h-section">Plan &amp; billing</h1>
      </div>

      <div className="card card-pad">
        <h3 style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>{HEADLINE[state.status]}</h3>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>
          {detail}
        </p>

        {!stripeConfigured ? (
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
            Online billing isn&apos;t available yet — check back soon.
          </p>
        ) : (
          <BillingButtons
            hasMonthly={hasMonthly}
            hasAnnual={hasAnnual}
            showManage={isSubscribed}
          />
        )}
      </div>
    </div>
  );
}
