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

// ─── Open-beta kill switch ──────────────────────────────────────────────────
// While Proscene is in open beta we are NOT charging anyone. With this set to
// `false`, every paywall is disabled site-wide and fully reversibly:
//   • all billing gates (assertCanMutate / assertCanOperate /
//     assertCanCreateProduction) become no-ops — full access, unlimited
//     productions, never read-only;
//   • the 60-day trial clock never starts (trialStartedAt is left unstamped),
//     so re-enabling later gives beta orgs a fresh trial rather than an
//     instantly-expired one;
//   • the trial countdown pill, the trial/upgrade banner, and the in-app
//     trial notices all hide;
//   • Checkout / customer-portal actions refuse politely;
//   • the daily billing-lifecycle cron does nothing (no nudge/lock/purge
//     emails, no file purges).
// The marketing pricing page stays up (with a beta disclosure) so the plans
// are previewable. To RESTORE the full trial + subscription system exactly as
// before, flip this back to `true` — no other code change is required.
export const BILLING_ENABLED = false;

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
export const LOCK_DAY = TRIAL_DAYS + GRACE_DAYS; // day 90 — full read-only

// After the read-only lock, uploaded files are retained 90 more days (so a
// read-only org can still download everything) and purged at day 180. Admins
// are warned 60 / 30 / 7 days before the purge.
export const PURGE_DAY = 180;

// Post-trial lifecycle milestones the daily cron drives, in order. `stage` is
// the integer stored on organizations.billing_lifecycle_stage; `day` is the
// day-from-first-production it fires on. PURGE is terminal (deletes files).
export const LIFECYCLE = {
  NONE: 0,
  NUDGE: 1, // day 30 — "loving it? subscribe (15% off)"
  WARNING: 2, // day 55 — "trial ends in N days"
  READ_ONLY: 3, // day 90 — "your workspace is now read-only"
  PURGE_WARN_60: 4, // day 120 — "files removed in 60 days"
  PURGE_WARN_30: 5, // day 150 — "files removed in 30 days"
  PURGE_WARN_7: 6, // day 173 — "files removed in 7 days"
  PURGED: 7, // day 180 — files deleted
} as const;

export const LIFECYCLE_DAY: Record<number, number> = {
  [LIFECYCLE.NUDGE]: NUDGE_DAY,
  [LIFECYCLE.WARNING]: WARNING_DAY,
  [LIFECYCLE.READ_ONLY]: LOCK_DAY,
  [LIFECYCLE.PURGE_WARN_60]: PURGE_DAY - 60,
  [LIFECYCLE.PURGE_WARN_30]: PURGE_DAY - 30,
  [LIFECYCLE.PURGE_WARN_7]: PURGE_DAY - 7,
  [LIFECYCLE.PURGED]: PURGE_DAY,
};

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

// ─── Storage allowances ─────────────────────────────────────────────────────
// Per-plan storage ceiling in GB (measured across the whole workspace). Like
// productions, storage scales with the plan, not seats.
//
// These are intentionally CONSERVATIVE at launch. Real usage is PDFs and
// images — rarely more than a few GB — so even a *full* tier costs only a few
// dollars a year on Supabase Storage ($0.252/GB/yr). Starting low caps our
// worst-case exposure while we learn real usage; we then raise ceilings "for
// free" later as a goodwill/retention lever. Caps only ever go UP.
//
// Large-scale video hosting is deliberately NOT included yet. That feature —
// and meaningfully bigger ceilings — is when a move to zero-egress object
// storage (Cloudflare R2) earns its keep. See docs/decision-log.md.
//
// NOTE: single source of truth for marketing copy + any future quota
// enforcement. Quota enforcement is NOT wired up yet.
export const STORAGE_LIMIT_GB: Record<PlanId, number> = {
  free: 5,
  season: 100,
  repertory: 250,
  company: 500,
};
