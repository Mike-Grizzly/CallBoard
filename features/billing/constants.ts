// Billing constants — plan ids, trial clock, and per-plan limits.
//
// MUST stay out of any `"use server"` file (CLAUDE.md rule #6): exporting
// constants from a server-action module causes hydration errors.

export const PLANS = {
  FREE: "free",
  SEASON: "season",
  REPERTORY: "repertory",
  COMPANY: "company",
} as const;

export type PlanId = (typeof PLANS)[keyof typeof PLANS];

export const PAID_PLANS: PlanId[] = [PLANS.SEASON, PLANS.REPERTORY, PLANS.COMPANY];

export function isPlanId(value: string | null | undefined): value is PlanId {
  return value === PLANS.FREE || PAID_PLANS.includes(value as PlanId);
}

// ─── Trial clock ──────────────────────────────────────────────────────────
// Anchored to the org's FIRST production (trialStartedAt), not signup.
export const TRIAL_DAYS = 60;
export const NUDGE_DAY = 30; // in-app "15% off" upsell appears
export const WARNING_DAY = 55; // "trial ends soon" warning appears
export const TRIAL_DISCOUNT_PCT = 15; // first term only

// "Finish your run" grace: after the trial ends, the daily operational loop
// (rehearsal reports, announcements, schedules, director's notes) stays
// editable for GRACE_DAYS so a company in tech week can complete its run,
// while creative/config/storage features (scripts, blocking, uploads, scenes,
// production settings incl. the closing date) lock immediately at day 60.
// At LOCK_DAY everything goes fully read-only and uploaded files are purged.
export const GRACE_DAYS = 30;
export const LOCK_DAY = TRIAL_DAYS + GRACE_DAYS; // day 90 — also the file-purge date

// ─── Production concurrency limits ──────────────────────────────────────────
// Cast/crew are always free — we never charge per seat. The lever is how many
// productions an org can run. `null` = unlimited.
//
// Free counts EVERY production it has ever created (archived included) so the
// single free production cannot be recycled. Paid plans count only ACTIVE
// (non-archived) productions, so a paying org can run shows sequentially —
// that sequential reuse is part of what they pay for.
export const PRODUCTION_LIMIT: Record<PlanId, number | null> = {
  free: 1,
  season: 1,
  repertory: 3,
  company: null,
};

// Whether a plan's limit is measured against all-time productions (free, to
// stop farming) or only active ones (paid, sequential reuse is allowed).
export function limitCountsArchived(plan: PlanId): boolean {
  return plan === PLANS.FREE;
}

export const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  season: "Season",
  repertory: "Repertory",
  company: "Company",
};
