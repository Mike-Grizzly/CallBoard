// Org billing/entitlement logic. The 60-day trial is app-managed (counted
// from signup); a Stripe subscription takes over once the org subscribes.
// Grandfathered orgs (everyone existing at launch) always have access.

export type BillingStatus =
  | "grandfathered"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled" // canceled but still inside the paid period
  | "trial_expired"
  | "none";

export type BillingState = {
  hasAccess: boolean;
  status: BillingStatus;
  trialEndsAt: Date | null;
  daysLeftInTrial: number | null;
};

export type OrgBillingFields = {
  grandfathered: boolean;
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
};

const DAY = 86_400_000;

export function billingState(org: OrgBillingFields): BillingState {
  const now = Date.now();

  if (org.grandfathered) {
    return { hasAccess: true, status: "grandfathered", trialEndsAt: null, daysLeftInTrial: null };
  }

  switch (org.subscriptionStatus) {
    case "active":
      return { hasAccess: true, status: "active", trialEndsAt: null, daysLeftInTrial: null };
    case "past_due":
      // Keep access during Stripe's dunning/retry window.
      return { hasAccess: true, status: "past_due", trialEndsAt: null, daysLeftInTrial: null };
    case "canceled": {
      const inPeriod = !!org.currentPeriodEnd && org.currentPeriodEnd.getTime() > now;
      return {
        hasAccess: inPeriod,
        status: inPeriod ? "canceled" : "none",
        trialEndsAt: null,
        daysLeftInTrial: null,
      };
    }
  }

  // No active subscription → fall back to the app-managed trial.
  if (org.trialEndsAt && org.trialEndsAt.getTime() > now) {
    return {
      hasAccess: true,
      status: "trialing",
      trialEndsAt: org.trialEndsAt,
      daysLeftInTrial: Math.ceil((org.trialEndsAt.getTime() - now) / DAY),
    };
  }

  return {
    hasAccess: false,
    status: org.trialEndsAt ? "trial_expired" : "none",
    trialEndsAt: org.trialEndsAt,
    daysLeftInTrial: 0,
  };
}

export const TRIAL_DAYS = 60;

/** Trial end for a brand-new org (now + 60 days). */
export function newTrialEnd(from: Date = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * DAY);
}
