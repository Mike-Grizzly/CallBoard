import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, organizations } from "@/db/schema";
import { requireCurrentUser, isDesignerOnly } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  getProductionBySlug,
  getVisibleProductions,
} from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getNotificationPreferences } from "@/features/notifications/preferences";
import { billingState, type BillingStatus } from "@/lib/billing";
import { BILLING_ENABLED } from "@/features/billing/constants";
import {
  stripeConfigured,
  availablePaidPlans,
  STRIPE_PRICE_IDS,
  availableDesignerPlans,
  STRIPE_DESIGNER_PRICE_IDS,
} from "@/lib/stripe";
import { AccountProfileForm } from "@/app/(app)/(default)/settings/account/account-profile-form";
import { ChangeEmailForm } from "@/app/(app)/(default)/settings/account/change-email-form";
import { ChangePasswordForm } from "@/app/(app)/(default)/settings/account/change-password-form";
import { AccountDangerZone } from "@/app/(app)/(default)/settings/account/account-danger-zone";
import { NotificationPreferencesForm } from "@/app/(app)/(default)/settings/notifications/notification-preferences-form";
import {
  BillingButtons,
  type PlanOption,
} from "@/app/(app)/(default)/settings/billing/billing-buttons";
import { FocusShell } from "../focus-shell";
import { getDesignerSeat } from "@/features/designer/entitlement";
import { FullAppCallout } from "@/features/designer/full-app-callout";
import {
  DesignerBillingButtons,
  type DesignerPlanOption,
} from "@/features/designer/billing-buttons";
import type { DesignerPlanId } from "@/features/designer/constants";

type CurrentUserLike = {
  firstName: string | null;
  lastName: string | null;
  email: string;
};

function userInitials(user: CurrentUserLike): string {
  const a = user.firstName?.trim()?.[0] ?? "";
  const b = user.lastName?.trim()?.[0] ?? "";
  return `${a}${b}`.toUpperCase() || user.email.trim().charAt(0).toUpperCase() || "?";
}

const BILLING_HEADLINE: Record<BillingStatus, string> = {
  grandfathered: "You're an early member — full access, on us.",
  trialing: "You're on a free trial.",
  active: "You're subscribed.",
  past_due: "There's a problem with your payment.",
  canceled: "Your plan is canceled.",
  trial_expired: "Your free trial has ended.",
  none: "Choose a plan.",
};

/**
 * Self-contained settings for Focus users (designers never see the dashboard's
 * settings). Reuses the existing account / notifications / billing forms inside
 * the focus shell so the whole surface stays in /focus.
 */
export default async function FocusSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();
  const production = await getProductionBySlug(user.organizationId, slug);
  if (!production) notFound();

  if (!can(user.role, "productions:manage")) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  const [profileRows, prefs, visible] = await Promise.all([
    db
      .select({
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        email: profiles.email,
        phone: profiles.phone,
        pronouns: profiles.pronouns,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1),
    getNotificationPreferences(user.id),
    getVisibleProductions(user),
  ]);
  const profile = profileRows[0]!;

  const shellProps = {
    slug,
    showTitle: production.title,
    orgName: user.organizationName,
    posterInitial: production.title.trim().charAt(0).toUpperCase() || "•",
    userInitials: userInitials(user),
    designerOnly: isDesignerOnly(user),
    userName:
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.email,
    canCreateProjects: can(user.role, "productions:manage"),
    projects: visible.map((p) => ({ slug: p.slug, title: p.title })),
  };

  const designerOnly = isDesignerOnly(user);
  // Org billing is for full workspace admins. Designer-only users manage their
  // personal Studio seat instead (below), never the org plan. Both are hidden
  // during the open beta (no payments) — see BILLING_ENABLED.
  const canOrgBilling =
    BILLING_ENABLED && !designerOnly && can(user.role, "settings:manage");
  let billing: {
    headline: string;
    planOptions: PlanOption[];
    isSubscribed: boolean;
    available: boolean;
  } | null = null;
  if (canOrgBilling) {
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
    if (org) {
      const state = billingState(org);
      const planOptions: PlanOption[] = availablePaidPlans().map((id) => ({
        id,
        hasMonthly: !!STRIPE_PRICE_IDS[id].monthly,
        hasAnnual: !!STRIPE_PRICE_IDS[id].annual,
      }));
      const isSubscribed =
        org.subscriptionStatus === "active" ||
        org.subscriptionStatus === "trialing" ||
        org.subscriptionStatus === "past_due" ||
        org.subscriptionStatus === "canceled";
      billing = {
        headline: BILLING_HEADLINE[state.status],
        planOptions,
        isSubscribed,
        available:
          stripeConfigured && (planOptions.length > 0 || isSubscribed),
      };
    }
  }

  // Designer-only users see their personal Studio-seat billing here.
  let designerBilling: {
    hasSeat: boolean;
    currentPlan: DesignerPlanId | null;
    plans: DesignerPlanOption[];
    available: boolean;
    canceledInGrace: boolean;
    accessThrough: string | null;
  } | null = null;
  if (BILLING_ENABLED && designerOnly) {
    const seat = await getDesignerSeat(user.id);
    const plans: DesignerPlanOption[] = availableDesignerPlans().map((id) => ({
      id,
      hasMonthly: !!STRIPE_DESIGNER_PRICE_IDS[id].monthly,
      hasAnnual: !!STRIPE_DESIGNER_PRICE_IDS[id].annual,
    }));
    // Canceled-but-paid-through seats can't use the portal (no live sub left),
    // so the buttons show the plan cards with a resubscribe note instead.
    const canceledInGrace = seat.hasSeat && seat.status === "canceled";
    designerBilling = {
      hasSeat: seat.hasSeat,
      currentPlan: seat.plan,
      plans,
      available: stripeConfigured && (plans.length > 0 || seat.hasSeat),
      canceledInGrace,
      accessThrough:
        canceledInGrace && seat.periodEnd
          ? seat.periodEnd.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : null,
    };
  }

  return (
    <FocusShell {...shellProps} mode="script">
      <div className="fx-settings">
        <div className="fx-settings-inner">
          <h1>Settings</h1>

          <section className="fx-settings-section">
            <h2>Your profile</h2>
            <AccountProfileForm
              initial={{
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone ?? "",
                pronouns: profile.pronouns ?? "",
              }}
            />
          </section>

          <section className="fx-settings-section">
            <h2>Email address</h2>
            <ChangeEmailForm currentEmail={profile.email} />
          </section>

          <section className="fx-settings-section">
            <h2>Change password</h2>
            <ChangePasswordForm />
          </section>

          <section className="fx-settings-section">
            <h2>Notifications</h2>
            <NotificationPreferencesForm initial={prefs} />
          </section>

          {billing && (
            <section className="fx-settings-section">
              <h2>Plan &amp; billing</h2>
              <div className="card card-pad">
                <h3 style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>
                  {billing.headline}
                </h3>
                {billing.available ? (
                  <BillingButtons
                    plans={billing.planOptions}
                    showManage={billing.isSubscribed}
                  />
                ) : (
                  <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                    Online billing isn&apos;t available yet — check back soon.
                  </p>
                )}
              </div>
            </section>
          )}

          {designerBilling && (
            <section className="fx-settings-section">
              <h2>Plan &amp; billing</h2>
              <div className="card card-pad">
                <h3 style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>
                  {designerBilling.hasSeat
                    ? "Your Studio plan"
                    : "Choose a Studio plan"}
                </h3>
                {designerBilling.available ? (
                  <DesignerBillingButtons
                    plans={designerBilling.plans}
                    hasSeat={designerBilling.hasSeat}
                    currentPlan={designerBilling.currentPlan}
                    canceledInGrace={designerBilling.canceledInGrace}
                    accessThrough={designerBilling.accessThrough}
                  />
                ) : (
                  <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                    Online billing isn&apos;t available yet — check back soon.
                  </p>
                )}
                <FullAppCallout />
              </div>
            </section>
          )}

          <section className="fx-settings-section">
            <h2 style={{ color: "var(--c-clay)" }}>Account</h2>
            <AccountDangerZone email={profile.email} />
          </section>
        </div>
      </div>
    </FocusShell>
  );
}
