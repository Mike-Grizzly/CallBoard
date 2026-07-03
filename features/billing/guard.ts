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
import { getCurrentUser, isDesignerOnly, type CurrentUser } from "@/lib/auth";
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
  isPersonalWorkspace: boolean;
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
      isPersonalWorkspace: organizations.isPersonalWorkspace,
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
 * The billing axis for a designer-only caller is chosen by WHERE they're acting:
 * inside their OWN personal workspace (`is_personal_workspace`), their per-user
 * Studio SEAT governs; inside a COMPANY org they belong to (designers can be
 * invited to the companies they design for), that org's own billing governs —
 * exactly as for any other member. This keeps the two axes strictly separate:
 * a seat never buys writes in a lapsed company, and a seatless designer is never
 * locked out of a paid company. `is_personal_workspace` is set at signup and
 * flipped to false on conversion (upgradeToFullApp).
 */
function seatGoverns(user: CurrentUser, org: OrgBillingRow | null): boolean {
  return isDesignerOnly(user) && (!org || org.isPersonalWorkspace);
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
  // to, that org's billing governs (see seatGoverns). When the write belongs to
  // a specific tool, enforce that the seat includes it — the Single Tool tier
  // buys only one of Script / Blocking. Calls without a `tool` (shared surfaces
  // like documents/scenes) fall back to the active-seat check.
  const org = await getOrgBilling(orgId);
  const designer = await getCurrentUser();
  if (designer && seatGoverns(designer, org)) {
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
  // to is gated by that org (see seatGoverns / assertCanMutate).
  const org = await getOrgBilling(orgId);
  const designer = await getCurrentUser();
  if (designer && seatGoverns(designer, org)) {
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
  // company org they belong to they can't start productions at all (below).
  const org = await getOrgBilling(orgId);
  const designer = await getCurrentUser();
  if (designer && isDesignerOnly(designer)) {
    if (org && !org.isPersonalWorkspace) {
      // A designer participates in a company's shows but can't START new
      // productions inside its paid suite — that would spend the company's
      // entitlement on the designer's own / outside work. Their own productions
      // live in their personal workspace, gated by their Studio seat.
      return {
        error:
          "Only this organization's managers can start new productions here. " +
          "Start your own productions in your personal Studio workspace.",
      };
    }
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
        // Personal workspaces are seat-gated and never run the org trial clock;
        // only a company org's first production starts it. (A designer can't
        // create a production in a company anyway — see assertCanCreateProduction
        // — but this keeps the invariant true regardless of the call path.)
        eq(organizations.isPersonalWorkspace, false),
      ),
    )
    .returning({ id: organizations.id });
  // Non-empty only when this call actually stamped the anchor — i.e. this was
  // the org's very first production and the trial just began now.
  return rows.length > 0;
}
