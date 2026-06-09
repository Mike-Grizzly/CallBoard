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
  PRODUCTION_LIMIT,
  PLAN_LABELS,
  PLANS,
  isPlanId,
  limitCountsArchived,
  type PlanId,
} from "./constants";

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
    ? eq(productions.organizationId, orgId)
    : and(
        eq(productions.organizationId, orgId),
        isNull(productions.archivedAt),
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
 * Full-access gate — for creative/config/storage writes (scripts, blocking,
 * scenes, document & report uploads, production/workspace settings, member
 * invites). Blocked the instant the trial expires (grace and locked phases).
 */
export async function assertCanMutate(
  orgId: string,
): Promise<{ error?: string }> {
  const org = await getOrgBilling(orgId);
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
  const org = await getOrgBilling(orgId);
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
  const org = await getOrgBilling(orgId);
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
 * Start the 60-day trial clock — set-once. The guarded `WHERE
 * trial_started_at IS NULL` makes this idempotent and race-safe: only the
 * org's very first production stamps the anchor, and it's never moved
 * afterward (so deleting/archiving that production can't reset the trial).
 */
export async function startTrialIfFirstProduction(orgId: string): Promise<void> {
  const now = new Date();
  await db
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
    );
}
