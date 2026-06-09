import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { trialPhase } from "@/lib/billing";
import { TrialBannerClient, type TrialTone } from "./trial-banner-client";

/**
 * Top-of-content banner that surfaces the org's trial state: the day-30 nudge,
 * the day-55 warning, the "finish your run" grace notice, and the read-only
 * lock. Reads the same trialPhase() the server gates use, so the banner can
 * never disagree with what's actually enforced. Hidden for subscribed and
 * grandfathered orgs (nothing to nudge) and during the healthy early trial.
 */
export async function TrialBanner() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [org] = await db
    .select({
      grandfathered: organizations.grandfathered,
      subscriptionStatus: organizations.subscriptionStatus,
      trialStartedAt: organizations.trialStartedAt,
    })
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);
  if (!org) return null;

  // Subscribed (in any state) or grandfathered → nothing to nudge here; the
  // settings → billing page covers those cases.
  if (org.grandfathered) return null;
  if (
    ["active", "trialing", "past_due", "canceled"].includes(
      org.subscriptionStatus ?? "",
    )
  ) {
    return null;
  }

  const { phase, daysRemaining, graceDaysRemaining } = trialPhase(org);
  // 'no_production' = trial hasn't started; nothing to show until they begin.
  if (phase === "no_production") return null;

  const isAdmin = can(user.role, "settings:manage");
  const d = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

  let tone: TrialTone;
  let message: string;
  let dismissible = false;

  switch (phase) {
    case "active":
      tone = "info";
      message = `You're on your 60-day free trial — full access to everything, ${d(daysRemaining)} left. Subscribe any time in Settings → Billing, or add a card now and we'll start your plan automatically when the trial ends.`;
      dismissible = true;
      break;
    case "nudge":
      tone = "info";
      message = `You're ${d(60 - daysRemaining)} into your free trial — ${d(daysRemaining)} left. Subscribe any time to lock in your access.`;
      dismissible = true;
      break;
    case "ending":
      tone = "warn";
      message = `Your free trial ends in ${d(daysRemaining)}. Subscribe to keep full access.`;
      dismissible = true;
      break;
    case "grace":
      tone = "warn";
      message = `Your free trial has ended. You can still send reports, announcements and schedules to finish your run, but scripts, blocking and uploads are locked. ${d(graceDaysRemaining)} until your workspace becomes read-only.`;
      break;
    case "locked":
      tone = "lock";
      message =
        "Your workspace is read-only. Subscribe to edit again — you can still view and export everything.";
      break;
    default:
      return null;
  }

  return (
    <TrialBannerClient
      phase={phase}
      tone={tone}
      message={message}
      dismissible={dismissible}
      isAdmin={isAdmin}
    />
  );
}
