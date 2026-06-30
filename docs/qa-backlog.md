# QA & Product Workflow Backlog

Source: Phase 2 external review — QA / product workflow notes (section 5). These are
product, workflow, and theater-domain-fit items, **not** security findings (those were
handled separately and are not catalogued here). Safe to track in the repo.

- **Status:** ☐ todo · ◐ in progress · ☑ done
- **Type:** 🐞 bug · ✨ polish · 🏗️ feature · 🤔 product decision
- **Effort:** XS (<1h) · S (½ day) · M (1–2 days) · L (multi-day) — rough estimates.

**Process (owner request):** bugs are fixed directly. For **polish and feature** items,
the problem and the intended change are written up for owner review **before** coding,
so the owner understands what is changing.

---

## Decisions (owner, 2026-06-29)

1. **Casting model — multi-character tracks: APPROVED.** Support a single person cast in
   two or more characters (e.g. an actor covering multiple supporting roles): one person
   → multiple character slots / role grouping. Today the model enforces one-person-one-role.
2. **Blocking list membership: APPROVED, with an exception.** The blocking list shows the
   show's characters plus uncast/unassigned people in the production. EXCLUDE admin, crew,
   designers, and production-management roles. EXCEPTION: include performer-adjacent roles
   such as **Dance Captain** (a role just below the choreographer that also appears on stage).
3. **Union productions: APPROVED (target market).** Proscene should support union
   productions. Implementation approach to be proposed when this batch is scoped — likely a
   production-level union flag plus per-person union status, feeding break/attendance rules
   and report fields.
4. **Non-cast people in cast assignment: filter out.** Only castable people appear in the
   cast-assignment list.

---

## Execution order

1. **Batch 1 — Real bugs** ← in progress
2. **Batch 2 — Polish sweep**
3. **Batch 3 — Report inputs wired to real data** (scenes, characters, people)
4. **Batch 4 — Attendance model** (schema change)
5. **Batch 5 — Blocking enhancements** (model now decided — see Decision 2)
6. **Batch 6 — Setup/config & presets**

Polish/feature items each get a problem-and-fix write-up before they are coded.

---

## A. Setup & Production Creation

| Status | Item | Type | Effort | Batch |
|---|---|---|---|---|
| ◐ | Reject absurd/invalid years in date validation | 🐞 | XS | 1 |
| ☐ | Copy/paste dates between fields | ✨ | S | 2 |
| ☐ | Date entry overall is cumbersome | ✨ | M | 2 |
| ◐ | Drag-and-drop file upload (reusable `<FileDropzone>`) | ✨ | M | 2 |
| ☑ | Role/character labels not capitalized (AI-parse data, not CSS) | ✨ | XS | 2 |
| ☐ | Department thumbnails hard to read in dark mode | ✨ | S | 2 |
| ☑ | Non-cast people show up during cast assignment → filter out | 🐞 | S–M | 2 |
| ☐ | Configurable season options (workspace level) | 🏗️ | M | 6 |
| ☐ | Production/name presets | 🏗️ | S–M | 6 |
| ☐ | Department-based dropdowns for role creation | 🏗️ | M | 6 |
| ☐ | Workspace presets for a typical show structure | 🏗️ | M–L | 6 |
| ☐ | More flexible rehearsal patterns | 🏗️ | M | 6 |
| ☐ | Separate weekday/weekend rehearsal times | 🏗️ | M | 6 |
| ☐ | Setup wizard saves progress mid-flow | 🏗️ | L | 6 |
| ☐ | Multi-character tracks (Decision 1) | 🏗️ | L | 3/6 |

## B. Script / PDF viewing

| Status | Item | Type | Effort | Batch |
|---|---|---|---|---|
| ◐ | PDF viewer fails on first click, recovers after tab switch | 🐞 | M | 1 |
| ◐ | Script PDF download navigates away instead of new tab | 🐞 | S | 1 |
| ☑ | Read-only doc/PDF controls look editable to non-editors (closes S3) | 🐞 | S–M | 1 |
| ☑ | Clearer file-selection control (the bare white square) | ✨ | S | 2 |

## C. Rehearsal Reports

| Status | Item | Type | Effort | Batch |
|---|---|---|---|---|
| ☑ | New items don't appear until manual refresh after save/send | 🐞 | M | 1 |
| ☑ | Placeholder text should name the input type ("Scene Name") | ✨ | XS | 2 |
| ☐ | Clearer line-note input guidance | ✨ | S | 2 |
| ☐ | Reorderable department notes | 🏗️ | S–M | 3 |
| ☐ | Scenes-worked autofill from the show's scenes | 🏗️ | M | 3 |
| ☐ | Scenes-worked: duration + timestamp ranges | 🏗️ | S–M | 3 |
| ☐ | Line-note character dropdowns | 🏗️ | M | 3 |
| ☐ | Incident person dropdown + free-text option | 🏗️ | M | 3 |
| ☐ | Richer attendance states (excused/unexcused absence + late) | 🏗️ | M–L | 4 |
| ☐ | SM toggle for excused/unexcused visibility | 🏗️ | M | 4 |
| ☐ | Union/non-union status per person (Decision 3) | 🏗️ | M | 4 |

## D. Blocking / Stage Setup

| Status | Item | Type | Effort | Batch |
|---|---|---|---|---|
| ◐ | "Enter" button is an unlabeled dark square | 🐞 | S | 1 |
| ☐ | Set pieces should start empty | ✨ | S | 2 |
| ☐ | Ground-plan window should be larger | ✨ | S | 2 |
| ☐ | Upload a ground plan directly from the blocking picker | 🏗️ | M | 5 |
| ☐ | Ground-plan zoom | 🏗️ | M | 5 |
| ☐ | Draggable proscenium left/right boundaries | 🏗️ | M | 5 |
| ☐ | Set-piece preset library | 🏗️ | M–L | 5 |
| ☐ | Custom set-piece uploads saved to a reusable show library | 🏗️ | M | 5 |
| ☐ | Blocking list = characters + uncast people, excl. admin/mgmt (Decision 2) | 🏗️ | M | 5 |

---

## Batch 1 progress (2026-06-29)

- ☑ **Report list/detail staleness** — `createReport`/`updateReport` now
  `revalidatePath` the reports list, the report detail, and the production
  overview. Fixed.
- ☑ **Ungated folder dropdown** — `FolderSelect` is read-only for users without
  `documents:upload`. Fixed. The script viewer's scene/song edit controls were
  found to be *already* gated on `canManage = documents:upload`, so true
  non-editors (cast/crew) don't see them — worth a browser confirm but no code
  gap found there.
- ◐ **PDF viewer fails on first click, recovers after tab switch** — owner could
  NOT reproduce (viewer rendered fine on first open). Suspected to be a
  first-*upload* loading state rather than a navigation race; proposed follow-up
  is loading indicators wherever the PDF/script is still fetching. Left OPEN to
  revisit with fresh test accounts after merge. No code change made.
- ◐ **"Script PDF download navigates away"** — owner could NOT reproduce on
  desktop Chrome (PC + Mac): downloads fire immediately as intended. Consistent
  with the code (signed URL with `{ download }` = attachment disposition; "View"
  opens a new tab; in-viewer exports are blobs). Left OPEN for cross-device /
  cross-browser testing post-merge (Safari/Firefox/mobile are the likely
  variance). No code change made.
- ☑ **"Enter" button black-on-black on stage setup** — FIXED. Root cause was a
  CSS cascade-layer bug, not the tokens: the global `button`/`input`/`select`
  resets in `globals.css` were UNLAYERED, and in Tailwind v4 unlayered rules beat
  layered utilities regardless of specificity. So `button { color: inherit }`
  overrode the `text-[color:var(--primary-foreground)]` utility on the shadcn
  `<Button>`, making the default CTA's label inherit the surrounding ink →
  black-on-black in light mode (white-on-white in dark). Fix: wrapped those resets
  in `@layer base` so utilities win again. This also corrects any other
  utility-styled control that was hit by the same override. (Build verified;
  worth a quick visual sanity-check on buttons app-wide on the preview deploy.)

## Already shipped (from this section)

- ☑ **Draft rehearsal reports hidden from cast/crew** — fixed in the security-hardening
  work (PR #65); enforced server-side via `canViewDraftReports`.
