// Centralized billing gate. One source of truth shared by server actions
// (security) and UI (UX) — never duplicate these checks per action.
//
// Two distinct gates:
//   1. assertCanCreateProduction — concurrency limit per plan (the monetization
//      lever). Also where the trial clock is started, set-once.
//   2. assertCanMutate (full writes) / assertCanOperate (daily run loop) — the
//      graduated read-only lock after the trial expires (grace then locked).
//
// Both layer ON TOP of role capabilities: billing never grants a capability a
// role lacks, and a role never bypasses the billing gate. Preamble order in an
// action is: auth → role capability → billing gate.

import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { organizations, productions } from "@/db/schema";
import {
  mutationLevel,
  newTrialEnd,
  type OrgBillingFields,
} from "@/lib/billing";
import {
  BILLING_ENABLED,
  PRODUCTION_LIMIT,
  PLAN_LABELS,
  PLANS,
  TRIAL_DAYS,
  LOCK_DAY,
  isPlanId,
  limitCountsArchived,
  type PlanId,
} from "./constants";
import { getCurrentUser, isDesignerOnly } from "@/lib/auth";
import {
  assertDesignerCanMutate,
  assertDesignerCanUseTool,
  assertDesignerCanCreateProduction,
} from "@/features/designer/entitlement";
import type { DesignerTool } from "@/features/designer/constants";

const DAY = 86_400_000;

type OrgBillingRow = OrgBillingFields & {
  plan: string;
  trialStartedAt: Date | null;
};

async function getOrgBilling(orgId: string): Promise<OrgBillingRow | null> {
  const [row] = await db
    .select({
      grandfathered: organizations.grandfathered,
      subscriptionStatus: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt,
      currentPeriodEnd: organizations.currentPeriodEnd,
      plan: organizations.plan,
      trialStartedAt: organizations.trialStartedAt,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return row ?? null;
}

function planOf(row: OrgBillingRow): PlanId {
  return isPlanId(row.plan) ? row.plan : PLANS.FREE;
}

async function countProductions(
  orgId: string,
  includeArchived: boolean,
): Promise<number> {
  const where = includeArchived
    ? and(
        eq(productions.organizationId, orgId),
        isNull(productions.deletedAt),
      )
    : and(
        eq(productions.organizationId, orgId),
        isNull(productions.archivedAt),
        isNull(productions.deletedAt),
      );
  const [row] = await db.select({ n: count() }).from(productions).where(where);
  return row?.n ?? 0;
}

const FULL_LOCK_MSG =
  "Your free trial has ended. You can still send rehearsal reports, " +
  "announcements and schedules to finish your run, but scripts, blocking, " +
  "uploads and settings need a subscription.";

const READ_ONLY_MSG =
  "This workspace is read-only. Subscribe to edit again — you can still " +
  "view and download everything.";

/**
 * A designer-only caller is gated by their personal Studio SEAT only inside
 * their OWN personal workspace. Once they act inside a COMPANY org they belong
 * to (designers can be invited to the companies they design for), that org's
 * own billing governs — exactly as it does for any other member. Otherwise a
 * seat would let a designer write into a LAPSED company (paywall bypass), and a
 * seatless designer would be wrongly locked out of a PAID one.
 *
 * We identify a "company" org by its billing footprint: grandfathered, a
 * subscription, or a started trial. A designer's personal workspace has none of
 * these — it never subscribes to an org plan, and (by design) no longer starts
 * the org trial on production-create — so it falls through to the seat. This is
 * an interim heuristic; an explicit `is_personal_workspace` flag supersedes it
 * when the designer→company join/switch flow is built (see open-questions.md
 * 2026-07-03). The one benign edge — a brand-new company that hasn't started
 * billing yet gates a designer member on their seat — is harmless.
 */
function orgIsCompany(row: {
  grandfathered: boolean;
  subscriptionStatus: string | null;
  trialStartedAt: Date | null;
}): boolean {
  return row.grandfathered || !!row.subscriptionStatus || !!row.trialStartedAt;
}

/**
 * Full-access gate — for creative/config/storage writes (scripts, blocking,
 * scenes, document & report uploads, production/workspace settings, member
 * invites). Blocked the instant the trial expires (grace and locked phases).
 */
export async function assertCanMutate(
  orgId: string,
  tool?: DesignerTool,
): Promise<{ error?: string }> {
  if (!BILLING_ENABLED) return {}; // open beta: no write gating
  // Designer-only users are governed by their personal Studio seat — but ONLY
  // inside their own personal workspace. Acting inside a company org they belong
  // to, that org's billing governs (see orgIsCompany). When the write belongs to
  // a specific tool, enforce that the seat includes it — the Single Tool tier
  // buys only one of Script / Blocking. Calls without a `tool` (shared surfaces
  // like documents/scenes) fall back to the active-seat check.
  const org = await getOrgBilling(orgId);
  const designer = await getCurrentUser();
  if (designer && isDesignerOnly(designer) && (!org || !orgIsCompany(org))) {
    return tool
      ? assertDesignerCanUseTool(designer.id, tool)
      : assertDesignerCanMutate(designer.id);
  }
  if (!org) return { error: "Organization not found." };
  const level = mutationLevel(org);
  if (level === "full") return {};
  return { error: level === "locked" ? READ_ONLY_MSG : FULL_LOCK_MSG };
}

/**
 * Operational gate — for the daily "run the show" loop (rehearsal reports,
 * announcements, call/rehearsal schedules, director's notes). Stays open
 * through the grace window so a company in tech week can finish its run;
 * blocked only once fully locked (day 90+).
 */
export async function assertCanOperate(
  orgId: string,
): Promise<{ error?: string }> {
  if (!BILLING_ENABLED) return {}; // open beta: no operational gating
  // Designer seat governs only their own workspace; a company org they belong
  // to is gated by that org (see orgIsCompany / assertCanMutate).
  const org = await getOrgBilling(orgId);
  const designer = await getCurrentUser();
  if (designer && isDesignerOnly(designer) && (!org || !orgIsCompany(org))) {
    return assertDesignerCanMutate(designer.id);
  }
  if (!org) return { error: "Organization not found." };
  if (mutationLevel(org) === "locked") return { error: READ_ONLY_MSG };
  return {};
}

/**
 * Concurrency gate for creating a production. Grandfathered orgs are unlimited.
 * Free counts all-time productions (archived included) so the single free show
 * can't be recycled; paid plans count only active ones.
 */
export async function assertCanCreateProduction(
  orgId: string,
): Promise<{ error?: string }> {
  if (!BILLING_ENABLED) return {}; // open beta: unlimited productions
  // Designer seat's per-tier cap governs only their own workspace; inside a
  // company org they belong to, that org's plan limit governs (orgIsCompany).
  const org = await getOrgBilling(orgId);
  const designer = await getCurrentUser();
  if (designer && isDesignerOnly(designer) && (!org || !orgIsCompany(org))) {
    return assertDesignerCanCreateProduction(designer.id, orgId);
  }
  if (!org) return { error: "Organization not found." };
  if (org.grandfathered) return {}; // existing orgs: unlimited, never gated

  // Past trial without an active subscription → no new productions, even if
  // `plan` still names a paid tier from a now-lapsed subscription.
  if (mutationLevel(org) !== "full") {
    return {
      error:
        "Your access is read-only. Subscribe to start a new production.",
    };
  }

  const plan = planOf(org);
  const limit = PRODUCTION_LIMIT[plan];
  if (limit === null) return {}; // unlimited (Company)

  const current = await countProductions(orgId, limitCountsArchived(plan));
  if (current < limit) return {};

  if (plan === PLANS.FREE) {
    return {
      error:
        "Your free trial includes one production. Subscribe to start another.",
    };
  }
  return {
    error: `Your ${PLAN_LABELS[plan]} plan includes ${limit} active ${
      limit === 1 ? "production" : "productions"
    }. Upgrade your plan to run more at once.`,
  };
}

/**
 * Announcement shown on the launch screen when an org creates its FIRST
 * production and its 60-day trial begins. Tells them the trial started and how
 * to subscribe, and folds in a heads-up if the show's closing date runs past
 * the trial. Returns null for grandfathered/subscribed orgs (no trial gate).
 * The caller gates this on `startTrialIfFirstProduction` returning true.
 */
export async function firstProductionTrialNotice(
  orgId: string,
  closingDate: string | null,
): Promise<string | null> {
  if (!BILLING_ENABLED) return null; // open beta: no trial messaging
  const org = await getOrgBilling(orgId);
  if (!org || org.grandfathered || !org.trialStartedAt) return null;
  // Already subscribed / pre-authorized → no trial messaging.
  if (["active", "past_due", "trialing"].includes(org.subscriptionStatus ?? "")) {
    return null;
  }

  let msg =
    "Your 60-day free trial just started — you have full access to every " +
    "feature. Subscribe any time from Settings → Billing. You can even add a " +
    "card now and we'll start your plan automatically when the trial ends.";

  if (closingDate) {
    const close = new Date(closingDate).getTime();
    const day60 = org.trialStartedAt.getTime() + TRIAL_DAYS * DAY;
    const day90 = org.trialStartedAt.getTime() + LOCK_DAY * DAY;
    if (close > day90) {
      msg +=
        " Heads up: this show closes after the trial fully ends, so part of " +
        "your run would be read-only unless you subscribe.";
    } else if (close > day60) {
      msg +=
        " Heads up: this show closes after day 60 — editing tools lock then, " +
        "though reports and scheduling continue through day 90.";
    }
  }

  return msg;
}

/**
 * Start the 60-day trial clock — set-once. The guarded `WHERE
 * trial_started_at IS NULL` makes this idempotent and race-safe: only the
 * org's very first production stamps the anchor, and it's never moved
 * afterward (so deleting/archiving that production can't reset the trial).
 */
export async function startTrialIfFirstProduction(
  orgId: string,
): Promise<boolean> {
  // Open beta: don't start the trial clock. Leaving trialStartedAt unstamped
  // means re-enabling billing later gives the org a fresh trial instead of one
  // that's already expired from a date during the free beta.
  if (!BILLING_ENABLED) return false;
  const now = new Date();
  const rows = await db
    .update(organizations)
    .set({
      trialStartedAt: now,
      trialEndsAt: newTrialEnd(now),
      updatedAt: now,
    })
    .where(
      and(
        eq(organizations.id, orgId),
        isNull(organizations.trialStartedAt),
      ),
    )
    .returning({ id: organizations.id });
  // Non-empty only when this call actually stamped the anchor — i.e. this was
  // the org's very first production and the trial just began now.
  return rows.length > 0;
}
