// Org billing/entitlement logic. The 60-day trial is app-managed and anchored
// to the org's FIRST production (trialStartedAt), NOT signup; a Stripe
// subscription takes over once the org subscribes. Grandfathered orgs
// (everyone existing at launch) always have access.

import { TRIAL_DAYS, NUDGE_DAY, WARNING_DAY } from "@/features/billing/constants";

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

  // A live subscription takes display precedence — so a grandfathered org that
  // chooses to subscribe still sees its real subscription state.
  switch (org.subscriptionStatus) {
    case "active":
      return { hasAccess: true, status: "active", trialEndsAt: null, daysLeftInTrial: null };
    case "past_due":
      // Keep access during Stripe's dunning/retry window.
      return { hasAccess: true, status: "past_due", trialEndsAt: null, daysLeftInTrial: null };
    case "canceled": {
      const inPeriod = !!org.currentPeriodEnd && org.currentPeriodEnd.getTime() > now;
      if (inPeriod) {
        return { hasAccess: true, status: "canceled", trialEndsAt: null, daysLeftInTrial: null };
      }
      break; // lapsed → fall through to grandfathered / trial
    }
  }

  // Grandfathered → full access (when not actively subscribed).
  if (org.grandfathered) {
    return { hasAccess: true, status: "grandfathered", trialEndsAt: null, daysLeftInTrial: null };
  }

  // No subscription / not grandfathered → fall back to the app-managed trial.
  // trialEndsAt is null until the org creates its first production: a fresh
  // free workspace that hasn't started a show yet has nothing to gate, so it
  // keeps access (the concurrency gate, not the read-only lock, governs there).
  if (!org.trialEndsAt) {
    return { hasAccess: true, status: "none", trialEndsAt: null, daysLeftInTrial: null };
  }

  if (org.trialEndsAt.getTime() > now) {
    return {
      hasAccess: true,
      status: "trialing",
      trialEndsAt: org.trialEndsAt,
      daysLeftInTrial: Math.ceil((org.trialEndsAt.getTime() - now) / DAY),
    };
  }

  return {
    hasAccess: false,
    status: "trial_expired",
    trialEndsAt: org.trialEndsAt,
    daysLeftInTrial: 0,
  };
}

// ─── Trial phase (pure, for in-app banners / read-only lock UI) ─────────────
// Derived live from the write-once anchor so the lock is correct the instant
// the clock passes day 60 — no scheduled job required for the lock itself
// (the day-30/55 nudges are what need a cron).

export type TrialPhase =
  | "no_production" // trial hasn't started (no first production yet)
  | "active" // day 0–29
  | "nudge" // day 30–54 — show 15%-off upsell
  | "ending" // day 55–59 — show "N days left"
  | "expired"; // day 60+ — read-only

export type TrialState = {
  phase: TrialPhase;
  daysRemaining: number | null;
};

export function trialPhase(
  org: { trialStartedAt: Date | null },
  now: Date = new Date(),
): TrialState {
  if (!org.trialStartedAt) return { phase: "no_production", daysRemaining: null };

  const dayN = Math.floor((now.getTime() - org.trialStartedAt.getTime()) / DAY);
  const daysRemaining = Math.max(0, TRIAL_DAYS - dayN);

  let phase: TrialPhase;
  if (dayN >= TRIAL_DAYS) phase = "expired";
  else if (dayN >= WARNING_DAY) phase = "ending";
  else if (dayN >= NUDGE_DAY) phase = "nudge";
  else phase = "active";

  return { phase, daysRemaining };
}

export { TRIAL_DAYS };

/** Trial end = anchor + 60 days. Stamped alongside trialStartedAt. */
export function newTrialEnd(from: Date = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * DAY);
}
