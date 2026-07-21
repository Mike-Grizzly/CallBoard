# Development Rules

## Build rules

- Build in vertical slices — each feature is a complete slice (schema, queries, actions, UI)
- Do not introduce new libraries without approval
- Do not rewrite working systems unless explicitly asked
- Extend existing patterns before creating new ones
- Do not expand database schema speculatively
- Do not add permissions or capabilities speculatively
- Do not add broad abstractions before they are needed
- Keep TypeScript strict
- Follow existing Next.js 16 App Router conventions (check `node_modules/next/dist/docs/` for breaking changes)
- Prefer server-side logic where possible
- Keep UI primitives local (shadcn-style) unless approved otherwise
- Use Supabase and Drizzle consistently — do not introduce alternative data access patterns
- Every feature should include manual test steps
- Update docs when changing architecture, schema, permissions, or completing a feature
- Do not mark a feature complete until it has been manually tested
- Flag security concerns instead of silently working around them
- Preserve the documented architecture unless explicitly told to change it
- Preserve the original MVP scope unless explicitly told to expand it

## Code style

- Default to writing no comments — only add one when the WHY is non-obvious
- Do not add error handling or validation for scenarios that cannot happen
- Prefer editing existing files over creating new ones
- Three similar lines is better than a premature abstraction
- No half-finished implementations

## UI consistency rules (added 2026-07, from the UX review — see `docs/ux-backlog.md`)

Ratchet rules: they apply to code you touch, never as standalone mass-migrations.

- Never use `window.confirm` / `window.alert` — use `components/ui/confirm-dialog.tsx` for confirmations; inline errors (or the shared toast, once S2 lands) for failures
- New or substantially-edited components use the cva `<Button>` (`components/ui/button.tsx`), not new `.btn` markup
- When shared primitives exist (`ConfirmDialog` today; `Drawer`/`EmptyState`/toast as ux-backlog S1–S3 land), use them instead of rolling a new variant
- New component CSS goes in a co-located file, not appended to `globals.css`; when substantially reworking a surface, consider moving its namespace block (`pp-*`, `ann-*`, `cc-*`, …) out of `globals.css` with it
- Any new overlay (modal/drawer/popover) handles Escape, backdrop click, focus trap, and focus return
- Drawers render through the shared `<Drawer>` primitive (`components/ui/drawer/`) — it already provides all of the above plus the mobile bottom-sheet. Never hand-roll a portal/backdrop/slide; do not add per-drawer animation timing. All drawer motion is centralised (`DRAWER_DURATION_MS` + `drawer.css` vars) so it can be retuned for every drawer at once — keep it that way

## Brand colour — single source of truth

**All brand colour lives in `app/brand-tokens.css`.** (Owner-facing how-to:
`docs/branding.md`.) It defines the `--brand-*`
seeds (paper / ink / night / spotlight-amber accent), and *everything* — the
app's semantic tokens in `globals.css` (`--bg`, `--ink`, `--accent`, …) and the
marketing site in `marketing.css` (`.ps-site`) — reads colour from those seeds.
To rebrand the product, edit that one file; the change cascades everywhere.

- **Never hardcode a brand colour** in component CSS (`color: white` on an accent
  button, a literal `#…` accent, an inline crimson). Use the semantic tokens
  (`var(--accent)`, `var(--ink)`, `var(--on-accent)`, …). There are currently
  zero hardcoded brand hexes in `app/` — keep it that way.
- **Text on a filled accent button is `var(--on-accent)`, not `white`.** Amber is
  a light accent, so `--on-accent` is the dark ink in light mode (white-on-amber
  fails AA); dusk/dark keep white while their accent is still the old crimson.
- **Marketing must stay always-light.** It reads the canonical (never-themed)
  `--brand-accent`; do not point it at the `*-dark` / `*-dusk` seeds or it will
  recolour for dark-theme app users.
- **Dusk/dark are placeholders** (still the old crimson) pending a reshared dark
  palette. When it arrives, replace the `--brand-accent-dusk*` / `--brand-accent-dark*`
  values (and flip `--brand-on-accent-dusk/-dark` to the dark ink) in
  `brand-tokens.css` — nothing else.

## Claude Code operating rules

- Start every session by reading `CLAUDE.md` (automatic) — it will direct you to relevant docs
- For substantial feature work, read `/docs/architecture.md`, `/docs/current-status.md`, and the relevant feature spec before editing
- For small fixes, scale the reading to the task — don't read 7 files to fix a typo
- Rehydrate context from the repo, not from memory or assumptions
- Summarize understanding before editing files when working on a new feature area
- Identify intended files to touch before making changes
- Ask before broad refactors
- Prefer small, reviewable changes
- Do not silently introduce new patterns
- Do not clean up unrelated code during feature work
- Stop and flag inconsistencies instead of guessing
- If the requested task conflicts with documented architecture, flag the conflict before coding

## Required session closeout

At the end of every Claude Code development session, update the relevant docs before stopping.

### Required closeout updates

- `/docs/current-status.md` — what changed, what remains incomplete
- The relevant `/docs/feature-specs/*.md` file — updated status, test results, new edge cases
- `/docs/decision-log.md` — if a durable architecture, product, schema, or permission decision was made
- `/docs/open-questions.md` — if unresolved issues, risks, bugs, assumptions, or follow-up questions came up
- Root `README.md` — only if setup instructions, scripts, environment variables, or major project status changed

### Closeout rules

- Do not mark a feature complete unless it has been tested
- If something was built but not fully tested, document it as "implemented but not fully verified"
- If a bug, risk, or concern was discovered but not fixed, document it in `/docs/open-questions.md` or the relevant feature spec
- If architecture changed, update `/docs/architecture.md`
- If development rules changed, update `/docs/dev-rules.md`
- If the session made a meaningful product or technical decision, record it in `/docs/decision-log.md`
- Do not end a feature session without documenting what changed, what was tested, what remains incomplete, and what risks or questions remain
