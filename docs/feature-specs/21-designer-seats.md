# Feature 21 — Designer Seats (à la carte sub-product)

**Status:** IMPLEMENTED (2026-06-29) — billing built; pending the Stripe-workflow
security audit and a typecheck/build (no deps in the build clone). The seat lives
on `profiles.designer_*`; the tier constants (`features/designer/constants.ts`),
checkout/portal (`features/designer/actions.ts`), the shared-webhook routing, the
entitlement gate (`features/designer/entitlement.ts` + delegation from the org
guards), the in-Focus subscribe/manage UI, and the `/signup?account=designer`
funnel are all in. **Deferred:** the referral incentive (below), per-write tool
gating for the Single Tool tier (route-gated only), storage enforcement. See
`decision-log.md` (2026-06-29) and `open-questions.md`. Visual direction lives in
`docs/mockups/designer-focus-view.html` (v1) and
`docs/mockups/designer-focus-view-v2.html` (v2 — layers panel + margin view).

> Public product brand is **Proscene** (see `app/(marketing)/pricing/content.ts`).
> Use "Proscene Script" / "Proscene Blocking" in any designer-facing chrome; the
> mockups currently say "CallBoard Script" and should be relabeled when built.

## Purpose

Capture revenue from a persona who pays **$0 today**: the itinerant designer
(lighting/set/sound/projection) who hops show to show and company to company.
They love the Script and Blocking tools but won't buy the full stage-management
suite — they don't care about scheduling, call boards, reports, or the document
center that a stage manager lives in. And they routinely design for companies
that aren't Proscene subscribers, so today they can't use our tools at all.

The Designer sub-product lets that individual pay for **just the one or two
tools they actually use**, in their **own private single-player workspace**,
independent of whether any org is paying.

## The persona (from reviewer interviews, 2026-06)

Designers who work across many companies a year said: the script tooling is the
draw, but they "couldn't justify the full price" and would only ever want one or
two features. They'd use it if every org they worked with subscribed — but most
don't. So the gap is: **a personal, low-cost way to keep the design tools across
gigs, regardless of the org's plan.**

## What it is

### 1. A self-contained, single-player workspace

A Designer-seat subscriber gets a **private workspace** — NOT access into any
org's data:

- **Script tool + Blocking tool only.**
- They **upload their own script** and **AI-parse it** (cast / scenes /
  bookmarks), exactly like the existing pipeline (Feature 19).
- They get **one ground plan** for the Blocking tool.
- **No Document Center / document layout.** No folders, no media library.
- **Caps: one active script + one active ground plan, swap-and-replace.**
  One production at a time; when they move to the next show they replace the
  script + ground plan. (Designer Pro lifts this — see pricing.)

This single-player design is deliberate. Because the workspace is **siloed**
(no sharing, no team, no scheduling, no reports), it is useless as a cheap
substitute for an org plan, which kills the cannibalization risk by
construction (see "Anti-cannibalization").

### 2. The Focus view (a "pro / fullsize" layout)

A curated, tool-forward chrome that makes Script + Blocking feel like a
standalone design app: no global sidebar, no production tabs. See the mockups.
Key elements:

- **Slim top bar:** brand lockup · **gig switcher** · Script/Blocking toggle ·
  Margin-view toggle · account/billing.
- **Gig switcher** is the spine of the experience and includes a **"My
  workspace"** entry (their own single script) alongside any org productions
  they've been invited to.
- **Left tool rail** (select/find/highlight/pen/note/bookmark/AI/download) with
  an **active-layer indicator** showing where new marks land.
- **Right panel = Layers** (per-layer visibility toggles: My highlights / My
  notes / My cues / AI line-highlights (Beta) / AI bookmarks) + a Bookmarks tab.
- **Margin annotation view** with **orthogonal elbow leader lines** (a
  CallBoard/Proscene-specific treatment — NOT the straight-diagonal connectors
  the reference apps use) connecting margin cue/note cards to anchored text.
  **Cards are draggable; the line stays anchored to the text** (only the
  vertical step segment re-routes). Preserve this behavior — it is a
  differentiator.
- **Copyright watermark** on licensed scripts.

**The Focus view is for everyone, not just designers.** It is the *default and
only* shell for a Designer-seat-only user, and an *optional toggle* for
full-suite users who want to maximize the script/blocking surface (e.g. during
tech). One view, two entry conditions — build once.

## Pricing

Full-suite org plans, for reference (org subscribes; participants always free;
annual ≈ 10× monthly, ~20% off):

| Plan | Monthly | Annual | Productions at once |
|---|---|---|---|
| Season | $25 | $249 | 1 |
| Repertory | $49 | $499 | 3 |
| Company | $79 | $799 | Unlimited |

Designer tiers (a deliberate, separate exception to "pay for shows, never for
people" — billed to the **individual**):

| Designer tier | Monthly | Annual (~) | Tools | Productions |
|---|---|---|---|---|
| Single tool | $5.99 | $59 | Script **or** Blocking | 1 (swap & replace) |
| Designer (bundle) | $9.99 | $99 | Script **+** Blocking | 1 (swap & replace) |
| **Designer Pro** | **$14.99** | **$149** | Script + Blocking | **Unlimited concurrent** |

- The $4 step from single → bundle nudges most to the bundle.
- **Designer Pro** ($14.99) is "stop swapping, run all your shows at once,"
  priced clearly under Season's $25. Different value axis from the org plans:
  a designer pays for *many shows / two tools / solo*; an org pays $25 for *one
  show / the whole toolset / shared with the team*.
- **Monthly + annual** on all three (designers' work is bursty gig-to-gig, so
  monthly is the default CTA; annual serves the year-round worker).

## Org invitation is additive (and free)

When a (paying) org **invites** a designer into its production, the designer
slots in as a **normal member** and gains whatever the org's plan provides —
scheduling, announcements/email updates, reports, documents — on top of the
tools they already know. This makes it easy to roll into that org's production
methods.

- **No extra charge to the designer; no discount to the org.** Two independent
  billing relationships that simply coexist. (Consistent with "we never charge
  per seat" — the org's plan already covers everyone it invites.)
- A designer whose companies all subscribe wouldn't strictly need a seat; the
  seat earns its keep specifically for the **non-paying** companies and for
  solo prep, where they fall back to their own private workspace.

## Referral incentive (designers as a distribution channel)

Designers touch many companies a year, each a high-trust warm intro to a
potential org subscriber — arguably the most valuable thing about this whole
sub-product. So reward designers for converting the orgs they work with.

- **Two-sided.** The referred org gets a first-term discount (reuse the planned
  "15% off first term" coupon from Feature 18); the designer earns seat credit.
  Two-sided referrals convert materially better than one-sided.
- **Stacking reward (decided):** **3 months free** on the designer's seat **per
  org** that subscribes, **stacking up to 12 months / year.** This rewards the
  designers who refer *several* orgs — their actual strength — rather than a
  one-and-done bonus. Reward is **comped time / account credit, not cash**
  (avoids affiliate-payout fraud + tax overhead for a small company).
- **Anti-fraud — lockstep vesting (the load-bearing rule).** Do NOT grant the
  free months upfront. **Grant 1 free designer-month per month the referred org
  actually stays paid, in arrears, capped at 3.** Because an org-month ($25) >
  a designer-month ($9.99–14.99), every paid org-month an attacker buys to
  unlock a free designer-month is a **guaranteed net loss** — so a "subscribe a
  fake org for one month, claim 3 free months, cancel" exploit is structurally
  unprofitable, with no need to detect whether the org is "real." (An earlier
  draft vesting "after the first invoice clears" was insufficient: one invoice
  does clear, then they cancel — net positive for the attacker.)
  - **Annual org subs may vest upfront** — a $249+ prepay dwarfs the ~$45
    reward, so grant all 3 immediately; this also nudges referred orgs to annual.
  - **Claw back** vested credit on refund/chargeback; **exclude
    education/heavily-discounted orgs** whose monthly rate could fall below a
    Pro seat and reopen the price gap; self-referral heuristics (matching
    card/billing email) as a tripwire, not the primary defense.
  - Attribution via a **referral code the org applies at checkout**.

**Economics.** A designer seat is ~$99–179/yr of forgone revenue; an org sub is
$249–799/yr — so comping seat time to land an org subscriber is strongly
net-positive. Note the reward mostly benefits the designer on their *other*
(non-paying) gigs, since a converted org already loops them into its full suite
for free.

**Build note.** This is likely the change that finally justifies real Stripe
coupon / promotion-code infrastructure (Feature 18 left the 15%-off nudge as a
manual reply-for-a-code stub).

## Caps & cost guardrails

- **1 active script + 1 active ground plan** on Single/Bundle (swap-and-replace).
- **Designer Pro:** unlimited concurrent productions, each with its own script +
  ground plan. This lifts the two guardrails below, which the 1-production tiers
  don't stress:
  - **AI parse allowance must scale.** The per-user 5-parses / 30-days cap
    (reused from the wizard path, Feature 19) is fine for one show but will
    legitimately block a Pro user running several. Give Pro a higher monthly
    parse allowance (or a small per-active-production budget) so real Anthropic
    cost stays bounded without blocking honest use. Parse cost (~$0.30–$2/script)
    is borne by us, not billed through Stripe.
  - **Storage ceiling.** One script + one ground plan is trivial; "unlimited
    productions" is unbounded. Give the designer workspace a modest flat cap
    (~10–25 GB — plenty for scripts + ground-plan images, nowhere near video).

## Anti-cannibalization (why this is safe)

An org cannot meaningfully dodge a plan by having everyone buy Designer seats:
each seat is a **siloed, single-player** workspace with **no sharing, no shared
blocking, no scheduling, no reports, no document center.** It is self-defeating
as a team tool, so the collaborative product (the actual org value) is
untouched. The designer tiers only ever convert $0 users.

## Architecture implications (to design when built)

- **New entitlement axis, orthogonal to org plan and to roles.** Today
  `assertCanMutate` (`features/billing/guard.ts`) reads only the **org** plan;
  the designer seat is a **per-user** entitlement that must layer *on top* of
  `can(role, capability)` exactly like billing does — it never grants a
  capability a role lacks, and it never discounts/charges the org. Likely a new
  `features/designer/` module + entitlement lookup, with constants (tier ids,
  caps, prices) in a non-`"use server"` `constants.ts` (CLAUDE.md rule #6).
- **Designer is a persona, not a 7th role.** Do not extend the 6-role matrix.
  When invited to an org the person is still `cast`/`crew`; the personal seat is
  a separate entitlement source.
- **Personal accounts already exist** — the signup individual/personal-workspace
  split (Feature 18) gives us an account to hang a personal subscription on.
- **Stripe:** new *personal* products/prices (3 tiers × monthly/annual),
  separate from the org's subscription; the webhook flips a **per-user**
  entitlement, not a per-org `plan`.
- **The Focus view is a shell variant**, not a fork of the tools — same
  `ScriptViewer` / blocking canvas, different chrome. Hiding tabs is the
  degenerate case of the existing capability-filtered production tabs; the
  tool-forward re-skin + Layers panel + margin/leader-line behavior is the
  bespoke build.
- **AI parse pipeline (Feature 19) is reused** for the designer's own-script
  upload; it already supports a production-less "wizard parse" owned by
  `requested_by`, which is the closest existing analogue to a personal-workspace
  parse.

## Open questions

- **Migrating prep into an org.** If a designer later joins a paying org for a
  show they already prepped solo, do we offer to carry their script + blocking
  notes into the org production, or do they start fresh? (Lean: out of scope for
  v1; possible later nicety.)
- **Exact Designer Pro parse allowance and storage cap** numbers — set with the
  parse-cost model once we have token data.
- **`pricing-strategy.md` still does not exist** though the decision log cites
  it. It should finally be written, with the org price points above + the
  designer ladder, as the single marketing/strategy source of truth.

## Decision log references

- Designer-seat concept, single-player scope, swap-and-replace, additive org
  invite, and the $5.99 / $9.99 / $14.99 ladder were agreed 2026-06-15.
- Builds on Feature 18 (plans/trial), Feature 19 (AI script analysis + parse
  caps), and the existing layer-based Blocking tool.
