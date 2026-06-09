# Pricing Strategy

**Status:** Draft — workshopped 2026-06-09. Not yet committed to launch. Pricing numbers are recommendations grounded in competitor research, not final list prices.

**Purpose:** Persistent record of the pricing thinking for CallBoard so future sessions can pick up the strategy without re-deriving it. Captures the competitive landscape, segment analysis, tier ladder, and the reasoning behind each design choice.

---

## TL;DR

- The market is real but **price-anchored low** — direct comps charge $20–150/mo (small co.) up to $200–300/mo (regional). Broadway/professional pays via tools like Stage Write at ~$100/yr/seat.
- CallBoard's wedge is **consolidation**: no competitor combines rehearsal reports + scheduling + docs + blocking + script annotation in one place. That justifies modest premium over single-purpose tools.
- **Never price per seat.** Cast/crew are mostly volunteers. Price the *organization*, charge by **active productions** (concurrency).
- **No perpetual free *organization* tier.** Permanent free tier for organizations running their own productions is the freemium trap — most companies are sequential (1 active at a time) and would stay free forever. Replace with **"first production free, then read-only"** + permanently free *individual/performer* seats.
- **Two different constraints up the ladder:** the bottom is price-constrained, the top is feature- and trust-constrained. Build a wide ladder, not a narrow band.
- **High tiers are a roadmap, not a launch menu.** Multi-org, SSO, security hardening, sanitization, tests, and support SLAs gate Company/Enterprise pricing.

---

## Competitive research (2026)

Confidence levels noted; numbers were extracted from search snippets of official pricing pages — automated WebFetch was blocked on most vendor sites, so verify load-bearing numbers in a browser before publishing prices.

### Direct competitors

| Tool | Coverage | Price | Model | Confidence |
|---|---|---|---|---|
| **VirtualCallboard** | Reports, scheduling, comms — *closest analog to CallBoard's core* | $20/mo (1 prod) + $10/mo each extra, **capped $150/mo** | Per-active-production, members free, 30-day trial, **no free tier** | High |
| **Stage Write** | Digital blocking + calling script — *closest analog to CallBoard's blocking/script* | Free view-only · $59.99/yr (1 prod) · **$99.99/yr unlimited** · $249/yr team (3 Pro) · $599/yr edu (10 seats) | Per-user + bundles | High |
| **ProductionPro** | Script breakdown + collaboration | Free Basic (1 prod, 3 collaborators) · **$199 flat per show** via MTI | Per-show-title | High |
| **Cast98** | Community-theatre management | Free tier · paid **from $50/mo** | Per-org | Medium |
| **Propared** | Production planning (bigger orgs — ACT, Joffrey) | **$112–299/mo** | Per editing-manager, viewers free | Medium |
| **On The Stage** | Ticketing + production tools (K-12, community) | "Free to org" · per-ticket fee (~$1.85–3.85 est.) + premium plans (~$50–250/mo est.) | Consumer-funded ticket fees | Low (vendor hides pricing) |
| **Scenechronize** (EP) | Film/TV doc management | Quote-only | Per-project/month, budget-tiered | Low |
| **Yesplan** | Enterprise venue/event planning | Quote-only · est. €320–990/mo | Enterprise per-org license | Low |
| **Scriptation** | Per-user PDF script annotation | Free · **$60/yr** individual · **$37/user/yr** team · 50% .edu | Per-user | High |
| **Rehearsal Pro** | iOS line-learning | **$19.99 one-time** | One-time purchase | High |
| **ShowTool SM** | iOS SM utility | **$4.99 one-time** | One-time purchase | High |

### Education-segment pricing (for the Education tier)

| Tool | Price | Notes |
|---|---|---|
| Stage Write Educational Bundle | **$599/yr** | 10 reassignable seats |
| Dramallama | **$299/yr** | Unlimited, campus-wide |
| Digital Theatre+ | from ~$340/yr (US) | Quote-based, scales by school size |
| Scriptation Education | 50% off Industry Pro (~$30/yr/user) OR free via On Campus partnerships | Per-user discount |

Pattern: **flat per-school/per-program annual license** with a bundled seat pool wins over per-student metering. School budgets are fixed and annual.

### Productivity-app floor

Generic "build it yourself" alternative — per-user pricing on paid tiers (2026):

| Tool | Entry | Mid | Notes |
|---|---|---|---|
| Trello | $5/user/mo | $10/user/mo Premium | Free tier |
| Notion | $10/user/mo (annual) | $20/user/mo Business | Free tier; AI bundled into Business |
| Asana | $10.99/user/mo (annual) | $24.99/user/mo Advanced | Min. 2 seats |
| Monday.com | $9/seat/mo Basic | $12 Std / $19 Pro | 3-seat minimum |

Floor a small theatre would compare against: **$5–12/user/month**. All four enforce seat minimums — CallBoard's "members free" undercuts them for orgs with many cast/crew.

### Unreliable sources — explicitly excluded

AI-generated listicles (zipdo.co, wifitalents.com, worldmetrics.org) circulate confident but contradictory numbers ("$29/$49/mo ProductionPro," "$49/$99/mo Stage Write," "DramaBook $19-99/mo"). These contradict verified pricing and at least one product name ("DramaBook") appears fabricated. Ignore.

---

## Strategic framing

### 1. Two different constraints across the segment

| Segment | Constraint | What sells them |
|---|---|---|
| Community / youth / education | **Price** | Cheap entry, generous free trial, predictable annual flat |
| Active regional nonprofits | **Features + concurrency** | Multi-program support, AI, archiving, priority support |
| LORT / professional / touring / Broadway | **Trust + capability** | SSO, security, SLAs, references, "used on X show" |

At the top, **price is a rounding error.** A $400/show fee on an $80–100k production budget is 0.5%. The blocker isn't dollars — it's whether the product is good enough and secure enough.

### 2. Consolidation is the wedge

No competitor combines reports + scheduling + documents + announcements + personal calendar + @mentions + digital blocking + PDF script annotation. The closest stack today is **VirtualCallboard + Stage Write bought separately** (~$490–730/yr combined for two disconnected tools). CallBoard at $300–500/yr in one integrated product is a clear deal *and* a stronger product (no app-hopping, no folder-sharing, theatre-specific vocabulary).

The pricing implication: **don't gate the integration apart** — the core bundle has pricing power. Blocking tool and script editor should be included in the main paid tier (Company tier), not held back as a premium gate. The premium gate is AI script parsing + unlimited concurrency, not the differentiated features themselves.

### 3. The freemium trap

A free tier that is **perpetual AND complete** generates no revenue from sequential companies (who run 1 production at a time — the dominant small-theatre profile). VirtualCallboard solves this by having **no free tier at all** (only a 30-day trial). That's not an oversight — it's deliberate.

You get to pick two of {perpetual, complete, revenue-generating}. We pick **complete + revenue-generating** by making the free *organization* tier scope-bound rather than permanent.

**The fix — separate "free individual" from "free organization":**

- **Permanent free for individuals:** performers/cast/crew who are members of someone else's paid production. Personal calendar, My Notes, @mentions, viewing. Costs ~nothing to serve. Drives word-of-mouth. No revenue risk.
- **Scope-bound free for organizations:** "your first production is on us." Full product, one complete show start to finish. After it closes, the production stays read-only/archived. **Starting production #2 requires a paid plan.** "First production free" beats a 60-day clock because productions have natural lifecycles — a calendar trial can expire mid-rehearsal, which is a terrible first impression.

---

## Recommended tier ladder

| Tier | Price | Productions | Segment |
|---|---|---|---|
| **Performer** (free, permanent) | $0 | — | Individual members of someone else's show |
| **First Production** (free, once) | $0 | 1 complete show, then read-only | Org's first show — full product trial |
| **Season** | ~$249/yr (or $25/mo metered, 1 concurrent) | 1 concurrent, unlimited sequential | Small sequential community cos. |
| **Repertory** | ~$549/yr | up to 3 concurrent | Busy community / small regional |
| **Company (Institutional)** | **~$1,200–1,800/yr** | Unlimited concurrent, multi-program | Active regional nonprofits (e.g. organizations running 4 mainstage + youth + ArtReach + senior + camps) |
| **Enterprise / Professional** | Quote (~$3k–15k+) | Unlimited + SSO + security + SLA + dedicated support | LORT, professional, touring, Broadway |
| **Education** | ~$399/yr flat | Unlimited, academic year | Schools / universities |

### Metered alternative

For sporadic users who don't want an annual commitment:
- **$25/mo** for the first active production
- **+$15/mo** per additional concurrent production
- Dark months = $0
- Annual flat plans give predictability + PO/check-friendly billing; metered serves bursty/single-show use.

### AI script parsing

Real per-action cost (~$0.20–1.00 per parse with current model pricing). Gate it as follows:
- **Season:** metered add-on / credit packs (~$0.99/parse or bundles)
- **Repertory / Company / Education:** included with monthly credit allowance, overage as credits
- **Enterprise:** included, generous limits

Use prompt caching + a cheap-model first pass before escalating, and meter usage so a handful of power users can't erode margin.

---

## Profile revenue worked examples

Illustrative annual revenue per customer profile under the recommended tiers:

| Profile | Activity | Best plan | **Annual revenue** |
|---|---|---|---|
| Hobbyist / single-show group | 1 show/yr | Metered or stays at first-show-free | **$0–75** (often never converts — funnel, not revenue) |
| Small sequential community co. | 4–12 shows/yr, 1 concurrent | Season | **~$249** |
| Two-stage company | 8 shows/yr, often 2 concurrent | Repertory | **~$499–549** |
| **Active regional nonprofit** | 4 mainstage ($80–100k each) + youth + ArtReach + senior + camps + cabarets; ~3 concurrent in rehearsal/planning | Company | **~$1,200–1,800** (≈0.4% of mainstage budget alone) |
| School drama department | 4–6 productions, academic year | Education | **~$399** |
| Busy semi-pro / multi-venue | 10+ shows, 3–4 concurrent | Repertory + overage, or Company | **~$700–1,500** |
| LORT / professional | Multi-show season, professional staffing | Enterprise (quote) | **~$3,000–15,000+** |

### Blended portfolio (illustrative — 100 paying orgs, low-to-mid mix)

| Segment | Count | Avg price | Subtotal |
|---|---|---|---|
| Season | 55 | $249 | $13,695 |
| Repertory | 22 | $499 | $10,978 |
| Education | 15 | $399 | $5,985 |
| Busy/semi-pro | 5 | ~$775 | $3,875 |
| AI add-on revenue (Season) | ~30 | ~$45 | $1,350 |
| **Total ARR** | | | **~$35,900** (avg ~$359/org) |

A handful of Company/Institutional customers ($1,200–1,800 each) or one Enterprise contract changes this materially — 10 Company customers ≈ 60 Season customers.

---

## Unit economics

### Infra cost (per earlier cost analysis)

- **Email (Resend):** ~$0.0004/email. A heavy production-run ≈ 1,200 emails. Negligible. **Cap free-tier sends per org for abuse**, otherwise ignore.
- **Storage at rest (Supabase):** ~$0.02/GB/month. Trivial.
- **Egress:** ~$0.09/GB. Still small per-org (pennies to ~$1/mo).
- **AI parsing:** ~$0.20–1.00 per script parse — the *only* cost that scales per-action. Meter and gate.

A typical free org costs <$1/mo to serve. A typical paid org costs $5–15/yr in infra. **Gross margin ~95%** at $300–500/yr ARR.

### Required mitigations on free tier

- **Storage cap** (e.g. 1–2 GB/org). Currently no enforcement.
- **File-type validation** — flagged in `current-status.md` as missing; it's both a security hole and a "people dump junk in the bucket" cost vector.
- **Prune or cold-archive** orgs dark for N months.
- **Send-rate cap** per free org (prevent SMTP-relay abuse).

### CAC math

- Avg ARR ~$359/org → **CAC must stay well under ~$120/org** for sustainable economics on the low/mid segments. This is a **word-of-mouth / community / content motion**, not paid-sales.
- For Company/Institutional ($1,200–1,800), a light sales touch is affordable: demos, conference presence, references. ACV is 4–5× the volume tier.
- For Enterprise, full B2B sales motion is justified — but only after the product can support it.

### Cash-flow lag

"First production free" means new signups generate $0 until production #2 — typically 2–4 months later. **Revenue trails acquisition by one production cycle.** Plan runway accordingly.

### LTV estimates

- Season: ~4 yr retention → ~$1,000 LTV
- Education: ~5+ yr retention → ~$2,000 LTV (sticky budget line item)
- Company: harder to estimate but likely 5+ yr at lower churn — $6,000–9,000 LTV
- These are illustrative; real numbers require live data.

---

## Sequencing — what gates the higher tiers

The MVP today (per `current-status.md`) can support Free/Season/Repertory/Education at launch, but **cannot** legitimately sell Company or Enterprise contracts. Concrete gaps blocking each tier:

### Blocks Company tier
- Single hardcoded "default" organization — true multi-org support not implemented
- Broad Supabase Storage RLS (any authenticated user can access any file in `attachments` bucket)
- `getDocumentUrl()` / `getAttachmentUrl()` don't check access to parent production/report
- No HTML sanitization on rich-text rendering (`dangerouslySetInnerHTML` in `RichTextDisplay`)
- No file-type validation on uploads
- Zero tests in the repo

### Additionally blocks Enterprise tier
- No SSO/SAML
- No audit log / activity log (scaffolded but not implemented)
- No formal support SLA capacity
- No security certifications (SOC2, etc.)
- No data residency options
- README and docs would need to be audit-presentable

### Strategic implication

- **Launch with:** Free + Season + Repertory + Education.
- **Add Company tier** once multi-org, storage access control, sanitization, and a basic test suite are in.
- **Add Enterprise tier** once SSO, audit logging, and reference customers exist.
- **Broadway/LORT is a credibility halo, not a revenue center** — pursue flagship productions for the logo and case study (the way Stage Write leveraged "100+ Broadway shows"), and let that sell the volume tiers.

---

## Open pricing questions

Tracked here so future sessions don't re-litigate without new information:

- Exact Season annual price — $249 vs $279 vs $299. Market anchor is VirtualCallboard's $20/mo = ~$240/yr. Verify against final feature scope.
- Whether to publish Repertory and Company tier prices or quote them.
- AI parsing credit pack pricing and inclusion allowances per tier.
- Nonprofit "supporter" pricing — voluntary add-on, separate SKU, or ignore?
- Whether "first production free" should also include a time backstop (e.g., max 6 months) for orgs that put a show on hold indefinitely.
- Education price point: $299 vs $399 vs $499. Anchored between Dramallama and Stage Write Edu.

---

## Sources

Direct competitor pricing pages and aggregators referenced during research:

- [VirtualCallboard subscription packages](https://www.virtualcallboard.com/subscription-packages/)
- [Stage Write pricing](https://www.stagewritesoftware.com/pricing) / [Bundles](https://www.stagewritesoftware.com/bundles) / [Education](https://www.stagewritesoftware.com/edu)
- [ProductionPro Theatre](https://production.pro/theatre) / [MTI digital scripts pricing](https://www.mtishows.com/help/shows/digital-scripts-scores-powered-by-productionpro/pricing-and-flexibility-with-the-book)
- [Propared pricing](https://www.propared.com/pricing/)
- [Scriptation pricing](https://scriptation.com/pricing/) / [Education](https://scriptation.com/education/) / [On Campus](https://scriptation.com/oncampus/)
- [Cast98 pricing](https://cast98.com/pricing)
- [Dramallama license](https://dramallama.com/license/)
- [On The Stage](https://onthestage.com/)
- [Yesplan FAQ](https://yesplan.be/en/faq)
- [Notion](https://www.notion.com/pricing) / [Asana](https://asana.com/pricing) / [Monday.com](https://monday.com/pricing) / [Trello](https://trello.com/pricing)
