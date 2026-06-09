# Feature 19 — AI Script Analysis

**Status:** Phase 1 IMPLEMENTED (branch `claude/serene-cray-kmpjry`, not yet merged, not live-verified).
**Phase 2 (per-role highlighting):** NOT BUILT.

## Goal

When a director uploads a script, AI parses it and proposes a production
template so the team starts from a populated setup instead of a blank one.
The director's vision had four outputs; Phase 1 ships the three high-confidence
ones, **always behind a human review/approve step** — AI output never lands in
the production's real tables automatically.

| # | Output | Target table | Phase |
|---|--------|--------------|-------|
| 1 | Cast/characters + Principal/Supporting/Ensemble | `production_roles` | 1 ✅ |
| 2 | Act/Scene breakdown | `production_scenes` | 1 ✅ |
| 3 | Bookmarks for scenes + musical numbers (page-accurate) | `script_annotations.bookmarks` (per-user, seeded for all members) | 1 ✅ |
| 4 | Pre-highlight each lead/supporting role's lines | `script_annotations.annotations` | 2 ⛔ (needs per-line pixel coords; format-dependent) |

## Architecture

- **Model:** `claude-opus-4-8` via `@anthropic-ai/sdk` (new dependency, approved
  this session). Adaptive thinking; **JSON-only prompt + parse**, not
  structured outputs — `output_config.format` is beta-only in SDK 0.103.0, so
  the system prompt pins the exact JSON shape and `extractJson()` +
  `JSON.parse` reads the reply. Streamed (`messages.stream` →
  `finalMessage()`) to avoid request timeouts on long scripts.
- **Client:** `lib/anthropic.ts` — lazy, returns `null` when `ANTHROPIC_API_KEY`
  is unset (graceful, like web-push).
- **Staging table `script_parses`** (`db/schema/script-parses.ts`): one row per
  analysis — `status` (`processing`→`ready`→`applied`, or `failed`), `result`
  jsonb (the proposal), `error`, `requested_by`. Server-only: RLS enabled, no
  policies (reached only via the Drizzle service connection, like
  `push_subscriptions`). Created live via Supabase MCP migration
  `create_script_parses`.
- **Async run:** `POST /api/scripts/[parseId]/run` — `runtime=nodejs`,
  `maxDuration=300`. Authenticates the caller, verifies access + `processing`
  status, then `after(() => runScriptParse(parseId))` and returns 202 so the
  work survives the client navigating away. Chosen over a synchronous parse
  because a full script takes 30s–minutes (Vercel function-timeout risk).
- **PDF text:** `features/scripts/parse.ts` extracts per-page text with
  `pdfjs-dist/legacy/build/pdf.mjs` (Node-safe, no browser worker), tagged with
  `===== PAGE N =====` so the model can cite accurate page numbers. Capped at
  ~600k chars (~150k tokens) as a guard.
- **Document status:** the long-scaffolded `documents.processingStatus` column
  is now driven (`processing`/`ready`/`failed`/`applied`).

## User flow

1. Documents tab → script row menu → **Analyze with AI** (`startScriptParse`
   stages a row, sets the doc to `processing`, returns the parse id; the client
   fire-and-forget POSTs the run route and navigates to the review page).
2. `/productions/[slug]/script/ai` (`ai-review-client.tsx`) shows a spinner and
   polls `fetchLatestScriptParse` every 3s while `processing`. The requester
   also gets an in-app + push notification when it's ready
   (`sendScriptParseReady`).
3. On `ready`: an **editable** form — rename/retype/remove characters, edit
   act/scene rows, edit/remove bookmarks.
4. **Apply** (`applyScriptParse`) writes `production_roles` + `production_scenes`
   and seeds the shared bookmark set onto every production member's
   `script_annotations` for that script (idempotent via stable `ai-*` ids).
   **Discard** deletes the parse.

## Permissions

Gated on `documents:upload` (admin/producer/director/choreographer/stage_manager
hold it — directors included, which is the point). Non-managers still need a
production membership. Billing `assertCanMutate` applies to start + apply.

## Cost & abuse guardrails

Each parse is a real per-token Anthropic charge to the org that owns the
`ANTHROPIC_API_KEY` (≈$0.30–$0.50 for a typical script; up to ~$1 for very long
ones). It is **not** billed through Stripe to end users. Guardrails in
`startScriptParse`:

- **Concurrency lock** — a new parse is refused while one is already
  `processing` for that production.
- **Rolling cap** — max `PARSE_LIMIT_PER_PRODUCTION` (5) parses per
  `PARSE_WINDOW_DAYS` (30) per production. Failed-before-the-model rows
  (e.g. non-PDF) don't count against the quota.
- **Billing guard** — `assertCanMutate` already blocks read-only/expired orgs.

**Token logging** — `runScriptParse` records `input_tokens` / `output_tokens`
on the `script_parses` row from the model's `usage`, surfaced as a muted line
on the review page, so real cost is observable per parse.

**No pricing-tier change** was made (decision 2026-06-09): per-parse cost is low
and this is a setup-time action, so caps cover the economics without a new SKU.
A per-tier monthly quota (free 5 / repertory 20 / company ∞) is the natural
future lever if AI usage becomes material — deferred until there's token data.

## Setup the user owns

- Set `ANTHROPIC_API_KEY` in Vercel (and local `.env`). `.env.example` documents
  it. Without it, "Analyze with AI" fails with a clear "not configured" message.

## Known limitations / risks (see open-questions)

- **No live verification yet** — needs the API key + a real script.
- **Scanned/image-only PDFs** are rejected (no OCR) with a clear message.
- **Very long scripts** may exceed `maxDuration=300`; needs Vercel Fluid compute
  for the higher ceiling.
- **Position classification** (lead/supporting) is a model estimate from line
  count/presence — intended to be director-corrected in the review form.
- **Bookmark seeding** writes one annotations row per member at apply time; fine
  for small casts, not optimized for very large ones.
- **Phase 2 highlighting** deferred — the hardest piece (per-line pixel coords,
  script-format-dependent).
