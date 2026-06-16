# Handoff — Cast & Crew: drag-to-assign casting board

A redesign of the production **Cast & Crew** tab. Replaces the stacked
"cast list + bulk-assign card + current-team table" with a single **two-zone
casting board**: drag people from the Company roster onto character slots and
team buckets. The existing **person drawer** is preserved (click any person).

Built to match the `design-reference/` workflow: a JSX component that uses
`window.I` icons + classNames from the shared stylesheet, plus a CSS block to
merge into `demo-styles.css` → `app/globals.css`.

## Files

| File | What it is | Where it goes |
|---|---|---|
| `jsx/tab-cast-crew.jsx` | The React component (`window.TabCastCrew`), design-reference conventions, self-contained mock data | `design-reference/jsx/tab-cast-crew.jsx` |
| `styles/cast-crew.css` | The `.ax-*` / `.cc-*` rules | merge into `design-reference/styles/demo-styles.css`, then port into `app/globals.css` |
| `prototype/Cast and Crew - Drag Assign.html` | The standalone working prototype (drag + tap + drawer all live) | reference only — open in a browser to feel the interaction |

## What it replaces

In the live app this is **`app/(app)/productions/[slug]/members/`**:
- `production-member-manager.tsx` — the bulk-assign card + current-team table
- `cast-list.tsx` — the character → performer rows

This redesign **unifies both** into one board. The person info drawer should
reuse the SAME component the People directory uses
(`app/(app)/(default)/people/person-drawer.tsx`, the `pp-drawer` markup) — do
not fork a second drawer.

## Interaction model

**Two zones, one direction of action.** Left = **Company** roster (searchable,
filterable). Right = the **production structure** you assign into. You only ever
move people left → right.

- **Character slots** (`.ax-slot`) hold **one** performer. Dropping a new person
  swaps the previous one out. Dragging a person already cast elsewhere moves
  them (clears their previous character slot).
- **Team buckets** (`.ax-bucket`) hold **one or many** depending on
  `team.multi` (e.g. Director = single, Wardrobe/Deck Crew = multiple).
- **Assigning grants production access** — same semantics as the current
  cast-list/member-manager (casting/adding = a production membership row).

**Desktop:** native drag-and-drop. Drop targets show a quiet dashed outline;
the hovered target lights up with `--accent` (`.drop`).

**Touch / ≤859px:** drag is replaced by tap-to-assign (no fiddly dragging):
- Layout collapses to one column with a **Casting board ⇄ Company** toggle
  (`.ax-mobile-tabs`).
- Tapping the **+** on a person (`.ax-assign-btn`) opens a bottom sheet of open
  characters + team roles → pick one.
- Tapping an **empty slot/bucket** opens a bottom sheet of people
  (unassigned first) → pick one.
- Empty targets read **"Tap to cast / Tap to add"** instead of "Drag…".

**Person drawer (persists everywhere).** Clicking a person — roster card, filled
slot, or team chip — opens the drawer with contact, status, permission, and
their assignment on this production. Unassign via the `×` on any slot/chip.

**Feedback.** A live `Cast n/10 · Team n/6` counter (`.ax-progress`) and a toast
(`.ax-toast`) confirm each assignment.

## Data mapping (mock → real)

The component carries self-contained mock data; swap for real queries:

| Mock | Real source |
|---|---|
| `CC_PEOPLE` | org members for this workspace (the People directory data layer / `data-people`) |
| `CC_CHARACTERS` | the production's characters/roles (`cast-list` source) |
| `CC_TEAM` | production team roles + `multi` flag (`production-member-manager`) |
| `slotOf` (char → personId) | character casting assignments |
| `bucketOf` (teamId → personId[]) | production team memberships by role |

`assignToSlot` / `assignToBucket` / `clearSlot` / `clearBucket` are the four
mutations — wire them to the existing `actions.ts` for the members feature
(assign / unassign), keeping the current permission rules.

## Build notes for Claude Code

- Branch off `main` (e.g. `feature/cast-crew-drag-assign`), implement against the
  codebase's existing patterns/components, test, then merge.
- Reuse the existing **PersonDrawer** (`pp-drawer`) — the only genuinely new
  surface is the mobile **bottom sheet**; build it with the app's existing
  overlay/Sheet primitive rather than the demo's `.cc-scrim`.
- `--accent` is **curtain crimson** in this codebase (per the design-reference
  README) — the `.drop` highlight uses it intentionally.
- Native HTML5 DnD is fine for desktop; the tap path is the accessible/mobile
  fallback. If you adopt a DnD lib, preserve both paths.
- Respect `prefers-reduced-motion`; the only motion here is the toast + hover
  transitions.

## Suggested `CLAUDE.md` rule (commit once to the repo root)

> Design references live in `design-reference/` and `handoff/`. They are the
> source of truth for UI appearance and behavior. Recreate them using this
> codebase's existing components, tokens, and patterns. Never edit the design
> files themselves.
