# Feature Spec: Plans & Free-Trial Gating

## Purpose

Monetize the portal without spoiling the first-show experience. A new company
gets its **first production completely free and fully featured** for a fixed
window, then converts to a paid **Company** plan to start a *second* production
or keep editing past the window. This spec defines the plan model, the trial
clock, the conversion funnel, and exactly where the gate is enforced.

## User story

- As a new company, I create my first show and use every feature (reports,
  blocking, calls, documents, announcements) with no paywall for 60 days.
- On day 30 I see a friendly "hope you're loving it — 15% off" upsell.
- On day 55 I get a "your trial ends in 3 days" warning, so I can convert
  before my run if my show is still going.
- On day 60 my production becomes read-only (I can still *view* everything
  forever); to keep editing or to start a second show I subscribe to Company.

## Status

**Partially implemented (2026-06-09).** The trial anchor, plan model, and gates
below are live. Superseded details from the original draft are noted inline.

### Implemented

- **Plans:** `free | season | repertory | company` (not just `free | company`).
  Concurrency limits 1 / 1 / 3 / unlimited. Free counts all-time productions
  (archived included, anti-farming); paid plans count only active ones.
  See `features/billing/constants.ts`.
- **Trial anchor:** write-once `organizations.trial_started_at`, stamped on the
  org's first production via `startTrialIfFirstProduction` (race-safe
  `WHERE trial_started_at IS NULL`). Migration `add_trial_started_at_and_plan_default`.
- **Graduated lock (refinement on the original hard day-60 lock):**
  - Day 0–60: full access.
  - **Day 60–90 "finish your run" grace:** the daily operational loop stays
    editable (rehearsal reports, announcements, call/rehearsal schedules,
    director's notes) so a company in tech week can complete its run; scripts,
    blocking, scenes, uploads, and settings lock immediately.
  - Day 90+ (`LOCK_DAY`): full read-only. Also the file-purge date.
- **Two gates** in `features/billing/guard.ts`: `assertCanOperate` (operational
  loop, open through grace) and `assertCanMutate` (full writes, locked at day
  60). `lib/billing.ts` exposes `trialPhase()` and pure `mutationLevel()`.
- **Concurrency gate** `assertCanCreateProduction` wired into all three create
  paths. Grandfathered orgs bypass every gate.

### Wired into actions

- Operational (`assertCanOperate`): reports create/update, announcements create,
  calls create/update, notes create/update.
- Full-lock (`assertCanMutate`): report attachment upload; document folder +
  upload; blocking stage config / save position / ground-plan + set-piece
  uploads; scripts set-default + save annotations; all scene/beat writes.

### Not yet wired (follow-up — low-stakes, no storage cost)

- Remaining blocking sub-actions: beat comments, beat arrows, remove-position,
  set-piece finalize/delete.
- Workspace settings (rename, logo upload) and member invites — judgment calls;
  member-invite gating in particular is debatable (a real show may add a
  replacement mid-run). Decide before launch.

### Still to build

- In-app upsell/warning banners reading `trialPhase()` (day-30 15%-off, day-55,
  grace) and a settings/billing surface showing the phase.
- Stripe 3-tier checkout (price ids per plan/interval) + webhook → flip `plan`.
- Day-30/55 + grace email nudges and the day-90 file purge (need Vercel Cron).
- Signup individual-vs-org split + personal "Your workspace".

---

_Original design spec follows (some specifics superseded by the above)._

## The model (decided)

One rule, one number. The trial is a **fixed clock anchored to the creation of
the org's first production** — *not* to the closing date.

| Lever | Value | Notes |
|-------|-------|-------|
| Free tier | 1 production, all features | No people/seat cap on the free production |
| Trial length | **60 days** from first production's creation | `trialStartedAt + 60d` |
| Soft upsell | **Day 30** | In-app banner/dialog, "15% off" (first term only) |
| Trial-ending warning | **Day 55** | "3 days left" nudge so long-running shows convert before the lock |
| Hard lock | **Day 60** | Production → read-only; creating a 2nd production requires Company |

### Why a from-creation clock (the anti-gaming rationale)

Earlier designs tied the lock to `closingDate + grace`. That is gameable two
ways: set a closing date 5 years out, or nudge the closing date forward every
time it approaches — running an unlimited sequence of shows in one shell.

**Anchoring the clock to first-production `createdAt` defeats both by
construction:** gating never reads the closing date, so there is nothing to
push. The closing date becomes purely cosmetic for billing purposes. The
day-60 read-only lock also closes the in-place **recycle exploit** (wipe the
cast/blocking/dates and reuse the shell for the next show), because an expired
production can no longer be edited at all.

The one accepted trade-off: a show whose life runs *past* 60 days from creation
(e.g. a 6-week rehearsal + 4-week run, created at rehearsal start) could be
locked mid-run. The **day-55 warning** mitigates this — it gives the company a
chance to convert *before* performances. 60 days comfortably covers the
5–6-week rehearse-and-run cycle of most small-theatre shows.

## Data model (proposed)

### `organizations` additions (`db/schema/organizations.ts`)

| Column | Type | Notes |
|--------|------|-------|
| `plan` | text, NOT NULL, default `'free'` | `'free'` \| `'company'`. Source of truth for entitlement. |
| `trial_started_at` | timestamptz (nullable) | Set **once**, when the org's first production is created. Null until then. The trial clock = this + 60 days. |

`trial_started_at` is stored explicitly (rather than derived from
`MIN(productions.created_at)`) so the clock is stable and ungameable: archiving
or deleting the first production does **not** reset it. Subscription/billing
provider fields (Stripe customer id, current-period-end, discount-redeemed
flag) are deliberately **out of scope here** — see Open questions.

### Derived trial state (no column — computed)

A pure helper turns `plan` + `trial_started_at` + `now` into a phase:

```
trialState(org) -> {
  phase: 'no_production'   // trial not started yet
       | 'active'          // day 0–29
       | 'nudge'           // day 30–54  (show 15%-off upsell)
       | 'ending'          // day 55–59  (show "N days left")
       | 'expired',        // day 60+    (read-only)
  daysRemaining: number,
  isPaid: org.plan === 'company',
}
```

Paid orgs (`plan = 'company'`) short-circuit to full access regardless of the
clock.

## Enforcement — gate points

Two distinct gates, both must check `plan` + `trialState` server-side (and the
UI mirrors them for UX, per CLAUDE.md pattern #3):

1. **Create a second production** —
   `features/productions/actions.ts` → `createProduction` /
   `createProductionFull` (lines ~43 and ~127). Before insert: if
   `org.plan === 'free'` and the org already has **≥ 1 production** (counting
   archived ones — archiving must not free the slot), return a typed
   `{ error }` with an upsell code instead of creating. Also set
   `trial_started_at = now()` on the **first** production create.

2. **Edit anything after expiry** — when `trialState(org).phase === 'expired'`
   and `plan === 'free'`, all mutating actions on that production are blocked
   (read-only). This is broad — it spans reports, blocking, calls, notes,
   announcements, document upload, and production edits. **Do not** scatter the
   check across every action; centralize it:

   ```
   features/billing/guard.ts   ->  assertCanMutate(org, production)
                                    canMutate(org, production): boolean
   ```

   Call `assertCanMutate` from the shared action preamble (alongside the
   existing `requireCurrentUser()` / `can(role, capability)` checks) so every
   write inherits the lock from one place. `canMutate` is the UI-facing
   boolean used to disable/annotate controls.

### Constants location (CLAUDE.md rule #6)

Trial length, nudge/warning days, discount %, and plan ids are **constants** and
MUST live outside any `"use server"` file:

```
features/billing/constants.ts
  TRIAL_DAYS = 60
  NUDGE_DAY = 30
  WARNING_DAY = 55
  TRIAL_DISCOUNT_PCT = 15        // first term only
  PLANS = { FREE: 'free', COMPANY: 'company' }
```

## Conversion funnel (notifications)

The day-30 and day-55 touches are **time-based**, not event-based, so they need
a scheduled trigger rather than the existing event fan-out:

- A daily scheduled job (e.g. Vercel Cron) scans free orgs and, on the day the
  org crosses day 30 / day 55, writes an in-app notification (and optionally
  email/push, reusing `features/notifications` + `features/push/send.ts`).
- The day-60 lock needs **no** job — it is derived live by `trialState`, so the
  read-only state is correct the instant the clock passes, job or not.
- The in-app upsell surface (banner on dashboard / modal) reads `trialState`
  directly on render; the job only drives the *push/email* nudge.

## Permissions

Orthogonal to roles. `can(role, capability)` is unchanged — billing gates layer
*on top*: an admin still needs `productions:manage`, but on a free expired org
even an admin is read-only. Conversely, billing never *grants* a capability a
role lacks. Order in the action preamble: auth → role capability → billing
mutate guard.

## Edge cases / gotchas

- **Archived production still counts** against the 1-production free limit —
  archiving is a soft-archive (`archivedAt`), not a slot reset.
- **`trial_started_at` is write-once.** Guard against overwriting it on
  subsequent production creates (only the first sets it). Deleting/archiving the
  first show does not clear it.
- **Read-only must still allow viewing and downloading** — signed-URL document
  access, report viewing, blocking viewing all remain. Only *writes* are gated.
- **Long-run shows** can hit the lock mid-run (accepted) — day-55 warning is the
  mitigation, not a code fix.
- **Downgrade** (Company → free with multiple productions): out of scope; define
  before launch (likely: keep all read-only, require re-subscribe to edit).
- **Multi-org reality:** `organizations.ts` says multi-org is live. Plan/trial
  are **per-org**, so a user in two orgs sees each org's own trial state. Spinning
  up a fresh org to get another free trial is a known, accepted leak (same as
  any per-tenant free tier); revisit only if abused.

## Manual test checklist (when built)

- [ ] New org: `trial_started_at` is null until the first production is created
- [ ] Creating the first production sets `trial_started_at = now()`
- [ ] Free org with 1 production: creating a 2nd returns an upsell error, no row
- [ ] Archiving the only production does NOT allow a new free one (slot held)
- [ ] Day 0–29: full edit access; no upsell banner
- [ ] Day 30: 15%-off upsell appears; in-app (and email/push if enabled) fires once
- [ ] Day 55: "3 days left" warning appears/fires once
- [ ] Day 60+: every mutating action on the production is blocked with a read-only
      error; viewing/downloading still works
- [ ] Company plan: full access regardless of clock; no banners/locks
- [ ] Setting `plan = 'company'` mid-trial removes the upsell and the lock
- [ ] UI controls are disabled/annotated wherever `canMutate` is false (parity
      with the server gate)

## Open questions

- **Billing provider integration (Stripe?) is unspecified** — checkout, webhook
  → flip `plan`, proration, the "15% off first term" coupon, and discount-redeemed
  tracking all still need a design. This spec stops at entitlement state.
- **Scheduled-job infra** — the day-30/55 nudges assume a daily cron (Vercel
  Cron or similar). The project has no cron today; confirm the mechanism.
- **Downgrade/cancellation behavior** — what happens to a Company org with 3
  productions that cancels? (proposed: all read-only until re-subscribe).
- **Per-org trial farming** — creating fresh orgs to re-trial is accepted for
  now; flag if it shows up in usage.
- **Annual vs monthly Company pricing** and whether the 15% applies to both —
  product decision, not yet made.

## Architecture notes (patterns to preserve)

- New module `features/billing/` follows the house layout: `constants.ts`
  (plan ids + trial numbers, NOT in a `"use server"` file), `guard.ts`
  (`canMutate` / `assertCanMutate`), `queries.ts` (`trialState`, plan lookup).
- The mutate guard is centralized in the action preamble, never duplicated per
  action — one source of truth shared by server (security) and UI (UX).
- Schema changes to `organizations` are applied via the Supabase SQL editor/MCP,
  NOT `drizzle-kit push` (retired on this project), keeping `db/schema/*` in
  sync by hand. See CLAUDE.md and `07/17` specs.
