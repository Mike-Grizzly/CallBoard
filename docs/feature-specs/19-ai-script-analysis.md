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
  **`unpdf`** (a serverless-safe pdfjs build — no browser globals like
  `DOMMatrix`, which broke the original `pdfjs-dist/legacy` attempt on Vercel's
  Node runtime), tagged with `===== PAGE N =====` so the model can cite accurate
  page numbers. Capped at ~600k chars (~150k tokens) as a guard.
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

## Wizard cast auto-fill (new-production setup)

A second, **pre-production** entry point lives on the wizard's Roles step
(`StepRoles` in `new-production-wizard.tsx`). The wizard runs before any
production/document exists, so the parse pipeline was generalized:

- `script_parses.production_id` / `document_id` are now **nullable**, plus a
  `storage_path` column. A "wizard parse" is owned by `requested_by` and points
  at a temp upload (`wizard-scripts/{userId}/…`).
- **Flow:** upload PDF straight to storage (`requestWizardScriptUpload` →
  `uploadFileToSignedUrl`) → `startWizardScriptParse` (per-**user** cap: 5 / 30
  days, since there's no production to cap) → kick the same
  `POST /api/scripts/[parseId]/run` route (its auth falls back to
  `requested_by` when there's no production) → poll `fetchScriptParseById` →
  on ready, **append the characters into the wizard's editable roles list**
  (blank seed rows are dropped). The parse state lives at the wizard level so it
  survives step navigation.
- **Carry-over:** on launch, `attachWizardScript` moves the uploaded PDF into
  the new production (`documents/{productionId}/…`), creates a **default script**
  document, and links the parse row — so the user doesn't re-upload and the full
  Script-tab AI (scenes/bookmarks) is ready to run later.
- **Optional + non-blocking:** the step copy says they can skip and add cast by
  hand, or upload later from the Script tab.

## Accuracy & refinement (2026-06-09, after first real-script test)

First real parse: cast + scene breakdown were ~100% accurate; **bookmarks drifted
after ~20–30 pages** (page numbers off, song numbers invented, some spurious
scenes). Root cause: the model was being asked to *recall* page numbers across a
100+ page document — the one thing LLMs are bad at. Two fixes:

- **Anchor-based page resolution.** The model no longer returns page numbers.
  For each bookmark it returns a short **verbatim anchor** (the heading/song-title
  line as printed); `resolveBookmarks()` in `parse.ts` finds the page by locating
  that anchor in the per-page text (falls back to the title). Deterministic, zero
  drift. Bookmarks whose anchor can't be found are **dropped**, which also filters
  hallucinated scenes. Prompt also tells it to copy printed song numbers verbatim
  and never renumber.
- **Corrective re-parse loop.** The review page has a "Not quite right?" box:
  type what was wrong → **Re-analyze with notes** (`reparseWithNotes`). It stages
  a fresh parse carrying the `notes`; `runScriptParse` feeds the notes **and the
  previous result** back to the model for a targeted revision. Counts against the
  per-production cap; the review page flips back to processing and polls.

## Index-page handling & bookmark replacement

- **Index/contents pages are not bookmarked.** Scripts open with a table of
  contents / "Musical Numbers" / synopsis listing every song & scene. Since those
  titles appear there *first*, a naive first-match resolved every bookmark to the
  index. `resolveBookmarks` now detects index pages (named index sections, or any
  page containing ≥4 distinct bookmark anchors) and resolves each anchor to its
  first occurrence in the **body**, skipping index pages. The prompt also tells
  the model those pages are reference-only.
- **Re-parse replaces AI bookmarks, keeps personal ones.** `seedSharedBookmarks`
  drops the prior AI-seeded set (ids prefixed `ai-`) and writes the new set, while
  preserving any bookmark a user added themselves. So re-analyzing re-bookmarks
  from scratch instead of piling onto stale markers.

## Bookmark kind tags & accuracy note

- AI-seeded bookmarks carry their `kind` (`"scene"` | `"song"`) onto the stored
  `Bookmark` (optional — hand-added bookmarks have none). The desktop bookmarks
  panel shows a colour-coded tag per row: **Song** (plum) / **Scene** (dusk). The
  AI review page already lists songs and scenes in separate groups.
- The AI Setup page shows an amber caveat: results vary with script formatting
  (modern, clearly-labelled scripts read best; songs are usually spot-on, scenes
  can blend in) — review and use "Not quite right?" to refine.

## Refining without re-uploading

The `/productions/{slug}/script/ai` page is a persistent home for the breakdown.
The "Not quite right?" re-analyze box (free-text notes → `reparseWithNotes`, runs
on the **existing** uploaded file) is shown both while reviewing a fresh parse and
in the **applied** state, so a director can keep refining after applying without
re-uploading. The desktop script reader has a manager-only **"AI setup"** toolbar
link to this page (`documents:upload` capability).

## Script-recognition cache (global, cross-org)

A `script_cache` table (server-only, RLS-on/no-policies, **no org column** — it's
intentionally global) keyed by a **content fingerprint** (SHA-256 of the
normalized extracted text). Flow:

- `runScriptParse` computes the fingerprint after extraction. On a **first** parse
  (not a re-analysis), if a cache entry matches the identical file, it reuses that
  result — status straight to `ready`, **no model call** (instant + free; the
  review page shows "Reused a previously verified breakdown… no AI tokens used").
- `applyScriptParse` **populates** the cache (upsert by fingerprint) when a parse
  is applied. For cross-tenant safety it caches the **server-stored model result**
  (`scriptParses.result`), not the client-supplied apply payload — a user's review
  edits are trusted for their own production but are never propagated to other orgs
  via the global cache. So the cache only holds model output for files someone has
  actually applied.
- Licensing houses (MTI/Concord/…) ship the **same PDF** to every company, so
  identical-file matches happen across orgs — a popular show gets parsed once and
  every later production of it inherits the breakdown.

**Privacy boundary (enforced by what's stored):** `script_cache.result` holds
ONLY the structural breakdown `{ title, roles, scenes, bookmarks }`. It never
contains personal annotations (highlights/notes/cues/ink — those live per-user in
`script_annotations`), casting (the breakdown has character names + types only,
no actors), production data, or the script text. That structural breakdown is the
only thing shared across orgs.

## Scanned scripts (OCR via vision)

Theatre scripts are often distributed as scans or photocopies with no embedded
text layer. `runScriptParse` detects this (extracted text < 200 chars) and, instead
of failing, switches to a **vision path**:

- The PDF is handed to Claude's native PDF/vision pipeline (which renders each
  page to an image and OCRs it) by passing the existing Supabase **signed URL**
  as a `{ type: "url" }` `document` content block — no base64 (which would
  inflate ~33% and risk the 32 MB request ceiling) and no Files API upload.
- A **separate system prompt** (`VISION_SYSTEM_PROMPT`) asks for the same
  roles/scenes, but bookmarks return a **`page` integer** instead of a text
  anchor — there is no extracted-text layer to anchor against on a scan.
  `resolveVisionBookmarks` validates each page is within the document and
  de-dupes. **Bookmarks on scans are best-effort** (model-estimated pages); cast
  and scenes are unaffected.
- **Page cap:** `MAX_SCANNED_PAGES = 250`. Each scanned page costs image + text
  tokens, so a very long scan would overflow even the 1M window; beyond the cap
  the parse fails with a "split it into acts" message.
- **Cache safety:** the global script cache is fingerprinted on the **raw file
  bytes** for scans (the extracted text is empty and would otherwise collide
  across different scans, poisoning the cross-org cache). Text PDFs keep the
  normalized-text fingerprint. Both are SHA-256 hex in the same column.
- The wizard auto-fill path benefits automatically — it runs the same
  `runScriptParse`.

## Permissions

Gated on `documents:upload` (admin/producer/director/choreographer/stage_manager
hold it — directors included, which is the point); the wizard path gates on
`productions:manage` (only admin/producer reach the wizard). Non-managers still
need a production membership. Cast/crew never parse (role-gated).

**Plan gating:** AI is a paid-tier perk that trial users also get. This is
exactly the existing `assertCanMutate` gate — it passes for subscribed,
trialing, and pre-trial orgs and blocks post-trial grace/locked orgs — so both
entry points call it and no new plan logic was needed (decision 2026-06-09).

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

## Reliability (added 2026-06-10)

- **Stalled-parse watchdog.** If the async run worker dies (Vercel reclaim, or
  work > `maxDuration=300s`) the row would sit in `processing` forever — spinning
  the review page and blocking new parses via the concurrency lock. A row
  `processing` past `STALE_PARSE_MS` (8 min) is now treated as dead: the poll
  actions (`fetchLatestScriptParse`/`fetchScriptParseById`) flip it to `failed`
  (`failIfStale`), and all three concurrency locks skip it (`hasLiveProcessing`).
  Lazy — no cron, since the review page polls every 3s.
- **Idempotent apply.** `applyScriptParse` re-applying an already-`applied` parse
  is a no-op (status guard); roles/scenes are inserted additively but
  **de-duplicated** against the production's existing rows (roles by name, scenes
  by act/scene number), so a double-click or an overlapping re-parse won't pile up
  duplicates. It never *deletes* (scenes are shared with the blocking tool, and
  roles can be hand-added) — a re-parse that drops a role/scene leaves the old row
  for manual removal.
- **Late-joiner bookmark seeding.** `seedSharedBookmarks` only seeds members
  present at apply time. Members who join later are seeded **lazily on first
  Script-tab open** by `ensureMemberBookmarks` (reads the applied parse's bookmarks
  — the canonical set — and writes the user's `ai-*` set if missing). Gated by
  `documents.processingStatus === "applied"` + the member lacking an AI set, so
  there's no extra query for productions without an AI breakdown.

## Setup the user owns

- Set `ANTHROPIC_API_KEY` in Vercel (and local `.env`). `.env.example` documents
  it. Without it, "Analyze with AI" fails with a clear "not configured" message.

## Known limitations / risks (see open-questions)

- **No live verification yet** — needs the API key + a real script.
- **Scanned/image-only PDFs** are now read via Claude's vision/PDF pipeline (see
  "Scanned scripts" below) — bookmarks on scans are best-effort. Capped at 250
  pages.
- **Very long scripts** may exceed `maxDuration=300`; needs Vercel Fluid compute
  for the higher ceiling.
- **Position classification** (lead/supporting) is a model estimate from line
  count/presence — intended to be director-corrected in the review form.
- **Bookmark seeding** writes one annotations row per member at apply time; fine
  for small casts, not optimized for very large ones.
- **Phase 2 highlighting** deferred — the hardest piece (per-line pixel coords,
  script-format-dependent).
