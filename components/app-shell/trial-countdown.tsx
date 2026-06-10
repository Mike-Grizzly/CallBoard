import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { trialPhase } from "@/lib/billing";

/**
 * Small fixed pill in the upper-right that counts down the free trial. Shows
 * days left until the trial ends (active/nudge/ending) or until read-only
 * (grace). Hidden for subscribed/grandfathered orgs and once fully locked
 * (the banner covers that). Links to billing so it doubles as a subscribe CTA.
 */
export async function TrialCountdown() {
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

  if (org.grandfathered) return null;
  if (
    ["active", "trialing", "past_due", "canceled"].includes(
      org.subscriptionStatus ?? "",
    )
  ) {
    return null;
  }

  const { phase, daysRemaining, graceDaysRemaining } = trialPhase(org);

  let label: string | null = null;
  let urgent = false;
  if (phase === "active" || phase === "nudge") {
    label = `${daysRemaining}d left in trial`;
  } else if (phase === "ending") {
    label = `Trial ends in ${daysRemaining}d`;
    urgent = true;
  } else if (phase === "grace") {
    label = `${graceDaysRemaining}d until read-only`;
    urgent = true;
  }
  if (!label) return null;

  return (
    <Link
      href="/settings/billing"
      title="View billing"
      className="trial-countdown"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        textDecoration: "none",
        background: urgent ? "#fff7e6" : "var(--bg-elev)",
        color: urgent ? "#7a4e00" : "var(--ink-2)",
        border: `1px solid ${urgent ? "#f1d9a8" : "var(--border)"}`,
        boxShadow: "var(--shadow-1)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: urgent ? "#d98a00" : "var(--accent)",
        }}
      />
      {label}
    </Link>
  );
}
