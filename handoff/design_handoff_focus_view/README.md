# Handoff: Focus View — Script & Blocking

**Status:** In progress — `claude/practical-cannon-p0w5a3` (Phase 1: Script Focus shell)

## Overview
**Focus View** is a full-screen, distraction-free editing mode for the CallBoard/Proscene
production tools. It gives stage managers and directors maximum screen real estate for
serious editing sessions on two existing surfaces:

- **Script** — annotate a PDF-style script (highlights, cues, notes), manage annotation
  **layers**, navigate by page/thumbnail, jump via **Scenes/Songs** bookmarks, and edit an
  **editable Cue sheet**. A signature feature is **Margin view**, which pushes cues/notes
  into a right-hand gutter connected to their in-script anchor by orthogonal **leader lines**.
- **Blocking** — position actor tokens and scenery on a dark stage canvas, drag elements
  from a **scenery & cast library**, with **undo/redo** and per-beat notes/comments.

The mode is entered from the existing Script and Blocking tools (a "Focus view" / "Focus"
button in their toolbars) and exited back to the originating tool (button or `Esc`).

## About the Design Files
The files in this bundle are **design references created in HTML/CSS/JS** — interactive
prototypes that show the intended look and behavior. They are **not production code to copy
directly**. The task is to **recreate these designs in the target codebase's existing
environment** (this product is a React/Next.js + Tailwind app — see "Target codebase" below),
reusing its established component patterns, design tokens, and libraries.

> The prototype deliberately re-implements a few shared components (buttons, avatars, the
> Scenes/Songs bookmark toggle, the Cue sheet table) as plain HTML/CSS using the **same class
> names and token variables** as the live app (`proscene.css`). In the real codebase, use the
> existing React components for these instead of re-creating them.

### Target codebase
- The live design system was lifted from `app/globals.css` of the product repo
  (`Mike-Grizzly/CallBoard@main`). `proscene.css` in this bundle **is** that token system
  (Tailwind `@import` stripped so it runs standalone).
- Themes are toggled with `body[data-theme]` (`light` / `dusk` / `dark` / `cool`) and
  densities with `body[data-density]`. Focus View inherits the user's stored theme from the
  `proscene-ref-theme` localStorage key in the prototype; in-app it should read the app's
  existing theme context.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are all
specified via the live design tokens. Recreate the UI pixel-perfectly using the codebase's
existing components and the tokens listed below. All values referenced here resolve to
variables defined in `proscene.css`.

---

## Layout (shell)
Full-viewport flex column; the app's normal rail/topbar/tabs are intentionally **replaced**
(that's the point of focus mode). Root is `body.fx-body { height:100vh; overflow:hidden;
display:flex; flex-direction:column }`.

```
┌──────────────────────────────────────────────────────────────────────┐
│ TOP BAR  (52px)                                                        │
│  brand · show-switcher pill · [Script|Blocking] · [Script|Cue sheet]   │
│  · Margin-view toggle · help · theme · avatar · Exit focus (Esc)       │
├───────┬───────────────────────────────────────────────┬──────────────┤
│ TOOL  │  CANVAS                                         │ RIGHT PANEL  │
│ RAIL  │   (script: thumbnails + sheet + margin)         │  (300px)     │
│ (56px)│   (script: OR editable cue sheet)               │              │
│       │   (blocking: library dock + stage)              │              │
└───────┴───────────────────────────────────────────────┴──────────────┘
```

A reference-only `.fx-note` strip sits above the top bar in the prototype to explain the demo;
**omit it in production.**

There are two modes (`body[data-mode="script"|"blocking"]`) and, within Script, two views
(`body.fx-view-cues` toggles the Cue sheet). Mode-specific elements use `data-modes="script"`
/ `data-modes="blocking"` and are shown/hidden by CSS keyed off `body[data-mode]`.

---

## Screens / Views

### 1. Top bar (always visible)
- **Height:** 52px, `background: var(--bg-elev)`, `border-bottom: 1px solid var(--border)`.
- **Brand:** 26px rounded "Proscene" badge SVG + uppercase "FOCUS" label (`11px/600`,
  `letter-spacing:.08em`, `color: var(--ink-4)`, left border separator). Badge has light/dark
  variants swapped by `body[data-theme]`.
- **Show-switcher pill:** rounded `999px` pill, `background: var(--bg-muted)`, `border:1px
  solid var(--border)`. 30px gradient poster square (`linear-gradient(135deg, var(--c-dusk),
  var(--c-plum))`), show title (`13px/500`, italic on the show name), org subtitle (`11px,
  var(--ink-4)`), chevron. Hover → `border-color: var(--border-strong)`.
- **Mode switch `[Script | Blocking]`:** segmented control. Track `background:
  var(--bg-sunken)`, `border:1px solid var(--border)`, `border-radius:999px`, 3px padding.
  Buttons `13px/500`, `color: var(--ink-3)`; active button `background: var(--bg-elev)`,
  `color: var(--ink)`, `box-shadow: var(--shadow-1)`. Each has a 15px leading icon.
- **View switch `[Script | Cue sheet]`:** identical segmented control (slightly smaller
  padding `6px 13px`, 14px icons), **script-only** (`data-script-only`). Toggles
  `body.fx-view-cues`.
- **Margin-view toggle:** label "Margin view" (`12.5px/500`, `var(--ink-2)`) + 34×20px switch.
  Off track `var(--border-strong)`; on track `var(--c-sage)` with a 16px white knob sliding
  16px. **Script-only**, and hidden when the Cue sheet view is active.
- **Icon buttons (help, theme):** 32px square, `border-radius: var(--radius-s)`, `color:
  var(--ink-3)`; hover `background: var(--bg-muted)`, `color: var(--ink)`. 17px icons.
- **Avatar:** 28px circle (shared `.avatar` component).
- **Exit focus:** primary-ish `.btn` with frame-exit icon + label + `kbd` "Esc". Returns to
  the originating tool (`Production - Script.html` or `Production - Blocking.html`; blocking
  link carries `?mode=blocking`).

### 2. Left tool rail (always visible, 56px)
`background: var(--bg-elev)`, `border-right: 1px solid var(--border)`, vertical flex,
centered, 10px vertical padding.
- **Tool buttons:** 40px square, `border-radius:9px`, `color: var(--ink-2)`, 19px stroked
  icons. Hover → `background: var(--bg-muted)`. Active (`data-on="1"`) → `background:
  var(--accent-soft)`, `color: var(--accent-ink)`, subtle accent border. Each has a tooltip
  flyout (`.lab`) that slides in on hover: `background: var(--ink)`, `color: var(--bg)`,
  `11px/500`, with an optional `kbd` shortcut.
- **Script tools (in order):** Pointer/pan (V), Highlight box, Highlight text (H), Cue
  (clock), Note (N) — **these mirror the live Script tool exactly** — then a divider, then
  AI setup and Download PDF.
- **Blocking tools:** Select/pan (V), Place actor (A), Set piece (S), Draw movement (M), Beat
  note (N) — then divider — Capture beat, Stage setup.
- **Color swatches (script):** 4 × 22px circles — amber `#e0a106`, blue `#2a6fdb`, green
  `#1f8a5b`, red `#d9534f` (matches the live Script swatch set). Active swatch has a
  `var(--ink)` ring.
- **Active-layer chip (script):** pinned to the rail foot — an 18px rounded swatch (defaults
  to `var(--c-amber)` with a soft ring) over a tiny uppercase label (e.g. "MY HL"). Reflects
  the currently-active annotation layer selected in the right panel.

### 3. Script canvas
- **Thumbnail rail (116px):** `background: var(--bg-elev)`, right border. 84px-wide mini page
  cards (`aspect-ratio: 8.5/11`, white, `box-shadow: var(--shadow-1)`) with faux text lines;
  highlighted lines use `var(--c-amber)`. Active thumb has an `var(--accent)` border and a
  bold tabular page number. Hidden in blocking mode and in cue-sheet view.
- **Sheet:** centered, auto-fit scaled (see "Zoom & fit" below). Wrapped in `#fx-sheet-wrap`
  (sized to the scaled box) so the transform doesn't force horizontal scroll.
  - **Page** (`.fx-page`): 620px wide, `background: oklch(0.992 0.008 85)`, `border:1px solid
    var(--border)`, `border-radius:4px`, `box-shadow: var(--shadow-2)`, `padding: 54px 60px
    64px`. **Serif body** (`--serif: "Iowan Old Style", Palatino, Georgia, serif`), ink
    `#241f1a`.
    - Scene heading: `.fx-scene-h` — `font-ui`, `12px`, `letter-spacing:.1em`, uppercase,
      `#8a7d6e`, centered.
    - Character cue: `.fx-char` — `font-ui`, `13px/700`, `letter-spacing:.07em`, `#3a322a`,
      centered.
    - Line: `.fx-line` — `15.5px`, `line-height:1.7`, centered, max-width 80%.
    - Stage direction: `.fx-sd` — italic, `13.5px`, `#8a7d6e`, centered.
    - **Highlight spans:** `.fx-hl` amber wash (`color-mix(var(--c-amber) 42%)`), `.fx-hl.userhl`
      teal, `.fx-hl.aihl` plum. **Note anchors** `.fx-anchor` get a `var(--c-clay)` outline.
      Layer visibility toggles via body classes `fx-hide-hl` / `fx-hide-note` / `fx-hide-ai`.
    - Watermark footer (`.fx-watermark`): `10px`, faint, centered.
  - **Margin gutter (`.fx-margin`, left:660px, 264px wide):** absolutely-positioned cards.
    - `.fx-mcard`: `background: var(--bg-elev)`, `border:1px solid var(--border)`, **3px left
      border** colored by type (`var(--c-clay)` for cues, `var(--c-dusk)` for notes),
      `border-radius:8px`, `box-shadow: var(--shadow-2)`, `cursor:grab`. Header has a colored
      pill badge ("CUE"/"NOTE"), title, and a right-aligned author. Body `12px, var(--ink-2)`.
      Cards are **draggable vertically** to reposition.
  - **Leader lines (`.fx-leaders` SVG):** orthogonal connectors drawn from each anchor's right
    edge to its margin card. `stroke: var(--ink-4)`, `stroke-width:1.3`, `opacity:.6`; end
    dots are `circle` filled `var(--c-clay)` (cue) or `var(--c-dusk)` (note). See
    "Leader-line algorithm" — this must be computed in JS.
- **Floating page+zoom bar (`.fx-floatbar`):** pill, bottom-center, `background:
  var(--bg-elev)`, `border`, `box-shadow: var(--shadow-2)`. Prev/next page, "8 / 64" counter
  (tabular), divider, zoom −/+, "100%" label. Hidden in blocking mode.

### 4. Cue sheet view (script · `body.fx-view-cues`)
Reuses the **live `.sv-cuesheet` component** verbatim (defined in `proscene.css`). Replaces
the page sheet; hides thumbnails, margin toggle, and floatbar; keeps the rail + right panel.
- Head: title "Cue sheet" + subtitle "<show> · N cues" + "Export CSV" ghost button.
- Editable table: columns Cue / Pg / Line / Notes / (delete). Cue cell has a colored dot
  (`#e0a106` LX, `#2a6fdb` SD, `#1f8a5b` SQ, `var(--accent)` etc.), page is a button, Notes is
  an inline `.sv-cuesheet-input` (transparent until hover/focus), trailing trash button.
  Section rows ("Act I" / "Act II") group the list.

### 5. Blocking canvas
- **Top bar (`.fx-bk-bar`):** scene title (`14px/600`), subtitle with current beat
  (`12.5px, var(--ink-3)`). Right cluster: "Movement" ghost button, **Undo/Redo segmented
  pair** (`.fx-bk-undo` — two 32×30px icon buttons sharing a `border-strong` frame; disabled
  state `opacity:.45`), "Capture beat" **primary** button, "Export" ghost button.
- **Library dock (`.fx-lib`, 188px):** `background: var(--bg-elev)`, `border`,
  `border-radius: var(--radius)`. Header "LIBRARY" (`11px/700`, uppercase) with grid icon;
  search field; scroll area with two groups:
  - **Cast:** rows of 24px colored avatar + name + on/off status (`var(--ink-4)`).
  - **Scenery & props:** 2-col grid of tiles (24px stroked icon + `10.5px` label): Rock,
    Bench, Table, Chair, Stairs, Flat, Throne, Barrel. Hover → icon turns `var(--accent)`.
  - "Add custom…" ghost button at the foot.
  - Items are **draggable onto the stage** (`cursor:grab`).
- **Stage (`.fx-bk-stage`):** dark `rgb(22,23,27)`, `border-radius: var(--radius)`. Faint
  grid + dashed stage edge; "Upstage / Downstage·Audience / SR / SL" labels (`10px`,
  uppercase, low-opacity white). 
  - **Actor tokens (`.fx-token`):** 42px colored circle with initials (`#fff`, 2px white
    border, drop shadow) + a small dark caption label. Categorical colors from `--c-*`.
    Absolutely positioned by `left`/`top` **percentages**; draggable.
  - **Set pieces (`.fx-setpiece`):** translucent brown rounded rect with label; draggable.
  - **Movement arrows:** dashed SVG line with an arrow marker (`var(--accent)`).

### 6. Right panel (300px, `.fx-panel`)
`background: var(--bg-elev)`, left border, flex column. **Both modes stack their sections in
one scrolling column** (no internal tab bar). Section headers `.fx-phead`: `11px/600`,
`letter-spacing:.05em`, uppercase, `var(--ink-4)`, with an optional `+` add affordance.
Sections are separated by `.fx-pdivide` (1px `var(--border)` rule).

- **Script panel:**
  1. **My layers** + **Shared & AI** — `.fx-layer` rows: eye toggle (18px), 11px rounded
     color swatch, name (`13px/500`), count (tabular `var(--ink-4)`), overflow dots. Active
     layer (`data-active="1"`) → `background: var(--accent-soft)` and an "active" tag after
     the name. Hidden layer (`data-vis="0"`) → `opacity:.5` + eye-off icon. AI layers carry a
     plum **"Beta"** chip. A "Highlight a character's lines" select (`.fx-select`) sits under
     the AI group.
  2. **Bookmarks** — **matches the live Scenes/Songs window exactly.** Uses the live
     `.sv-bm-tabs` / `.sv-bm-tab` / `.sv-bm-tab-count` toggle and `.sv-bm-item` list classes
     from `proscene.css`. Two views (`Scenes`, `Songs`) swap via `data-bmview`; the prototype
     uses `.fx-bmlist[data-bmview]` containers with `hidden` toggled. Items show a label and a
     right-aligned tabular page number.
- **Blocking panel (stacked, de-tabbed):**
  1. **Scenes & beats** — `.fx-scene` rows (title + "Act 1 · Sc 2" meta; active gets a sunken
     bg + border) and nested `.fx-beat` rows (chevron + label; active → `accent-soft`).
  2. **Beat notes** — `.fx-notecard` (muted card, `13px`, `line-height:1.55`).
  3. **Comments** — `.fx-comment` rows (24px avatar + name/when + text), plus a
     `.fx-commentbox` (input + primary send icon button).

### 7. Shortcuts popover (`.fx-shortcuts`)
Bottom-right card opened by the help button or `?`. `box-shadow: var(--shadow-3)`. Definition
list of shortcuts (see below).

### 8. Toast (`.fx-toast`)
Bottom-center pill, `background: var(--ink)`, `color: var(--bg)`, fades in/out for ~1.7s on
actions (tool select, page jump, place/remove, undo/redo).

---

## Interactions & Behavior

- **Mode switch:** `body[data-mode]` flips Script ⇄ Blocking; rail tools, canvas, floatbar,
  and right-panel section group all swap by CSS. Keyboard `R` (script) / `B` (blocking).
- **View switch (script):** `body.fx-view-cues` shows the Cue sheet; hides thumbnails, margin
  toggle, floatbar. Keyboard `U`.
- **Margin view:** toggles `body.fx-margin-off`. When off, `.fx-margin` + `.fx-leaders` hide
  and the sheet narrows to 620px and re-centers. Keyboard `M`. Toggling **recomputes fit +
  redraws leaders**.
- **Tool select:** within the active mode's rail, selecting a tool sets `data-on="1"` on it
  and clears siblings; emits a toast.
- **Layers:** clicking the eye toggles `data-vis` and the matching `fx-hide-*` body class
  (hiding that highlight class on the page). Clicking a layer row makes it active
  (`data-active="1"`, clears siblings) and updates the rail foot active-layer chip's swatch +
  label.
- **Bookmarks Scenes/Songs:** clicking a `.sv-bm-tab` sets active (`data-active` + `.active`
  class to match live styling) and swaps the visible `.fx-bmlist`. Clicking a bookmark jumps
  to its page and toasts.
- **Page nav / zoom:** prev/next clamp to 1..64; thumbnails jump; zoom steps 0.1 within
  0.6–1.8 and updates the "%" label. State persists.
- **Margin card drag:** vertical pointer drag repositions a card (delta divided by the applied
  scale); leaders redraw live during the drag and re-layout (de-overlap) on release.
- **Blocking element drag:** pointer drag moves tokens/set pieces; position clamped to
  3–97% / 4–96% of the stage. **Double-click** a placed element removes it.
- **Library drag-to-place:** pointerdown on a library item spawns a fixed-position ghost that
  follows the cursor (`.fx-lib-ghost`); the stage shows a dashed `drop-armed` outline. On
  pointerup inside the stage, a real `.fx-token` (cast) or `.fx-setpiece` (prop) is created at
  the drop point (% coords) and a history snapshot is committed.
- **Undo/Redo:** a snapshot stack of the stage's `.fx-token`/`.fx-setpiece` `outerHTML`. A
  snapshot is pushed **before** each mutation (first move of a drag, a place, a delete); undo
  pops to a redo stack and restores; redo reverses. Buttons reflect availability via
  `disabled`. Keyboard `⌘Z` / `⌘⇧Z` (Ctrl on Windows), blocking-mode only.
- **Exit:** Exit-focus button or `Esc` navigates back to the originating tool. `Esc` first
  closes the shortcuts popover if open.
- **Theme:** cycles `light → dusk → dark → cool`, persisted (prototype uses
  `proscene-ref-theme`).

### Zoom & fit (important)
The sheet uses `transform: scale(appliedScale)` where `appliedScale = userZoom × fitFactor`,
`fitFactor = min(1, (scriptArea.clientWidth − 64) / sheet.offsetWidth)`. Because CSS
transforms don't shrink layout footprint, the sheet is wrapped in `#fx-sheet-wrap`, which is
sized in JS to `sheet.offsetWidth × scale` × `sheet.offsetHeight × scale` so the page **and**
the margin column are always visible without horizontal scroll. `transform-origin: top left`.
Recompute on margin toggle, zoom change, and window resize.

### Leader-line algorithm (must be JS)
For each visible margin card (filtered by `offsetParent !== null`), measured in the sheet's
**unscaled** coordinate space (divide all `getBoundingClientRect` deltas by `appliedScale`):
1. `marginLeft` = left edge of `.fx-margin` relative to the sheet.
2. For each card's anchor: `sx` = anchor right edge, `sy` = anchor vertical center.
3. Sort cards by `sy`; lay out non-overlapping: `desired = max(sy − 16, prevBottom + 10)`;
   set `card.top = desired − margin.offsetTop`; advance `prevBottom`.
4. Path: `M sx sy  H elbow  V (desired+18)  H marginLeft`, where
   `elbow = max(sx + 16, marginLeft − 26)`. Add a 3px end `circle` at `(sx, sy)` colored by type.
**Never blank the SVG on a transient pre-layout call** (guard `if (!sheetWidth) return;`
without clearing) — only clear when genuinely not in script+margin view.

---

## State Management
Persisted to `localStorage` so a refresh mid-session keeps your place (prototype keys prefixed
`fx-`; in-app, store wherever the app keeps view state):
- `mode` — `"script" | "blocking"` (also overridable by `?mode=` query on entry).
- `view` — `"page" | "cues"`.
- `margin` — `"1" | "0"`.
- `page` — current page number (1–64).
- `zoom` — user zoom factor (fit is derived, not stored).
- theme — shared app theme key.

In-memory (not persisted): active tool per mode, active layer, per-layer visibility,
selected bookmark/scene/beat, blocking undo/redo stacks, drag transients.

---

## Design Tokens
All from `proscene.css` (`:root`, warm "light" theme shown; other themes override the same
names). Use oklch as-authored.

**Surfaces:** `--bg` `oklch(.985 .005 75)` · `--bg-elev` `oklch(1 0 0)` · `--bg-muted`
`oklch(.965 .008 75)` · `--bg-sunken` `oklch(.955 .01 75)` · `--rail` `oklch(.96 .008 75)`.
**Borders:** `--border` `oklch(.92 .01 75)` · `--border-strong` `oklch(.86 .012 75)`.
**Ink:** `--ink` `oklch(.22 .012 60)` · `--ink-2` `oklch(.36…)` · `--ink-3` `oklch(.52…)` ·
`--ink-4` `oklch(.68…)`.
**Accent (curtain crimson):** `--accent` `oklch(.55 .16 25)` · `--accent-soft`
`oklch(.93 .04 25)` · `--accent-ink` `oklch(.4 .14 25)`.
**Categorical (each has a `-soft` pair):** `--c-sage` `oklch(.7 .07 145)` · `--c-amber`
`oklch(.78 .13 75)` · `--c-dusk` `oklch(.6 .1 260)` · `--c-clay` `oklch(.65 .12 35)` ·
`--c-sand` `oklch(.75 .05 90)` · `--c-plum` `oklch(.55 .1 320)` · `--c-teal`
`oklch(.68 .1 195)` · `--c-rose` · `--c-indigo` · `--c-moss` · `--c-ocean` · `--c-berry`.
**Hardcoded swatch hexes (Script tools + cue dots):** amber `#e0a106`, blue `#2a6fdb`, green
`#1f8a5b`, red `#d9534f`.
**Radii:** `--radius-s` 6px · `--radius` 10px · `--radius-l` 14px.
**Shadows:** `--shadow-1/2/3` (see file — warm-tinted rgba).
**Type:** `--font-ui` "Geist" · `--font-mono` "Geist Mono". Focus View adds `--serif`
("Iowan Old Style", Palatino, Georgia, serif) for the script page body only.
**Focus-view-specific sizes:** top bar 52px · rail 56px · thumbnails 116px · panel 300px ·
library 188px · page 620px · margin gutter 264px @ left 660px · sheet 924px (page+gap+margin).

## Keyboard Shortcuts
`R`/`B` switch Script/Blocking · `U` toggle Cue sheet · `M` toggle margin view · `[`/`]`
prev/next page · `−`/`+` zoom · `⌘Z`/`⌘⇧Z` undo/redo (blocking) · `?` shortcuts · `Esc` exit
(or close popover).

## Assets
- **Brand badge:** inline SVG (light + dark variants) — replace with the app's real logo
  component.
- **All other icons:** inline stroked SVGs (Lucide-style, `stroke-width` ~1.7–1.8). Use the
  app's existing icon set (the live tools use the same Lucide-style icons).
- **No raster images / no external image assets.** Avatars and posters are CSS (initials on a
  colored fill / gradient).
- **Fonts:** Geist + Geist Mono (already used by the app via `next/font`). The script page's
  serif uses system fonts only.

## Files
In the originating project (`reference/`):
- `Production - Focus View.html` — the Focus View prototype (this feature).
- `focus-view.css` — all Focus-View-specific styles (prefixed `.fx-`).
- `focus-view.js` — all Focus-View interaction logic (vanilla JS, no deps).
- `proscene.css` — the **live design system / token source** (read-only reference).
- `Production - Script.html`, `Production - Blocking.html` — the existing tools Focus View is
  launched from and returns to (shows the entry-point buttons + the shared `.sv-*` components
  Focus View reuses: tool rail, thumbnails, Scenes/Songs bookmarks, Cue sheet).

Bundled copies of all of the above are in this folder.
