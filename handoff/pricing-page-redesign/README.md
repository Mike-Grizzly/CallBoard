# Handoff: Pricing page redesign

**Status:** Unprocessed

This is a **content/pricing brief** for redoing the public pricing page
(`/pricing`). It is not a UI mockup — it's the source-of-truth pricing the new
page must reflect. Current page copy/markup lives in
`app/(marketing)/pricing/content.ts`; plan limits in
`features/billing/constants.ts`; designer spec in
`docs/feature-specs/21-designer-seats.md`.

> **Brand:** public product brand is **Proscene** (tools: "Proscene Script" /
> "Proscene Blocking"). Some code/mockups still say "CallBoard" — use Proscene.

## Core positioning (keep)
**"Pay for the shows you run. Never for the people in them."**
The *organization* subscribes; cast, crew, designers, and stage management are
**always free** on every org plan. Org tiers differ **only by how many
productions you can run at once** — every paid org tier includes the full
toolset. The **Designer package is the one deliberate exception** — billed to an
individual.

## 1. Organization plans (live / implemented)
Annual ≈ 10× monthly (~15–20% off). New orgs get a **60-day free trial** that
starts at their **first production** (not signup); no card required.

| Plan | Monthly | Annual | Productions at once | Storage | Notable |
|---|---|---|---|---|---|
| **Season** | $25 | $249 | 1 active | 100 GB | Full toolset, unlimited cast & crew, mobile app |
| **Repertory** ⭐ Most popular | $49 | $499 | 3 active | 250 GB | + email support |
| **Company** | $79 | $799 | Unlimited | 500 GB | + custom branding + priority support |

- **Participant / Free:** anyone invited to a show works free, no plan (free
  workspace baseline = 1 production all-time, 5 GB). Presented as "participants
  are free," not a sold card.
- **Education:** discounted, hand-verified — contact sales
  (`/contact?reason=school`).
- Every paid tier includes: Script & scene breakdown, Blocking & ground plans,
  auto reports & PDF export, calls/calendar/confirmations, document & media
  library, mobile app.

## 2. Designer package (planned — specced, not yet built / no Stripe products)
Personal, low-cost sub-product for the itinerant designer. **Private,
single-player workspace** — Script + Blocking only, own uploaded script + AI
parse + one ground plan. **No Document Center, no scheduling/reports/sharing.**
Billed to the **individual**. Monthly is the default CTA; annual ≈ 10×.

| Designer tier | Monthly | Annual (~) | Tools | Productions |
|---|---|---|---|---|
| **Single tool** | $5.99 | $59 | Script **or** Blocking | 1 (swap & replace) |
| **Designer (bundle)** | $9.99 | $99 | Script **+** Blocking | 1 (swap & replace) |
| **Designer Pro** | $14.99 | $149 | Script + Blocking | Unlimited concurrent |

Framing:
- The $4 step single → bundle is intentional (nudges most to the bundle).
- **Designer Pro** = "stop swapping — run all your shows at once," priced clearly
  under Season's $25. Different value axis: designer = *many shows / two tools /
  solo*; org = *one show / whole toolset / shared with the team*. Make the
  contrast explicit so Pro doesn't read as undercutting Season.
- **Org invitation is additive & free:** when a paying org invites a designer,
  they slot in as a normal member and get the org's full suite at **no extra
  charge to them and no discount to the org**.

## Notes for design
- Org tiers are live; **designer tiers are not sold yet** (no Stripe products).
  Decide whether to show now ("New"/"Coming soon") or hold until billing ships.
- Reuse the existing monthly/annual toggle (annual default, "save ~20%").
- Likely a separate **"For designers" band** rather than a 4th column next to
  the org tiers — different buyer (individual vs org); mixing muddies the "we
  don't charge per person" message.
