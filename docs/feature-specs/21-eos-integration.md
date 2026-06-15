# Step 21: ETC Eos integration (cue export + live follow) — PROTOTYPE

## Purpose
Bridge CallBoard's script-cue tool to the lighting console most theatre LDs use,
**ETC Eos**, in two directions:

1. **Export** our cue numbers + labels into Eos so they coincide with the LD's
   programmed cues.
2. **Live follow** — as the board op bounces through cues on the console, the
   CallBoard script jumps to the matching cue automatically (one-way, Eos →
   CallBoard).

## Status: PROTOTYPE (not browser-verified, not hardware-verified)
Built end-to-end and unit-exercised against crafted OSC packets + a mock cue
stream, but **not yet validated against a real Eos console / Nomad**. Eos is
picky about ASCII import idents and OSC port config; treat both halves as
"works in principle, verify on hardware."

## Why these shapes

- **Export is USITT ASCII, not CSV.** Eos imports cue lists via the USITT ASCII
  Showfile format (`File ▸ Import ▸ USITT ASCII`), not plain CSV (CSV is for
  patch). So the existing CSV export stays for humans; a new `.asc` export is the
  "lands in Eos" path. We emit only cue **number + label** (as the cue `Text`) —
  deliberately *not* channel levels or fade times, so importing seeds the LD's
  cue stack with our labels without touching their programmed looks.
- **Live follow needs a local bridge.** A browser can't open the raw UDP socket
  Eos broadcasts OSC on. So a tiny zero-dependency Node program
  (`tools/eos-bridge/`) sits on the booth machine, listens to Eos's OSC output,
  and re-emits the active cue to the browser as **Server-Sent Events** (SSE,
  chosen over WebSocket: one-way, auto-reconnecting, no handshake code, no deps).
  The eventual "just connect your device" UX would fold this listener into a
  native CallBoard desktop app; the bridge proves the loop first.

## What was built

### 1. Eos ASCII export — `features/scripts/eos-ascii.ts`
`cueSheetToEosAscii(cues, title)` → a USITT ASCII v3.0 showfile string: header
(`Ident 3:0` / `Manufacturer ETC` / `Console Eos`), `Clear All`, then one
`Cue <n>` / `Text <label>` block per cue (sorted ascending, numeric-aware;
script line emitted as a `!` comment). Wired into the cue sheet as an **"Export
for Eos"** button beside "Export CSV" (`exportCueSheetEosAscii` in
`script-viewer.tsx`, downloads `<title>.asc`).

### 2. Eos → CallBoard bridge — `tools/eos-bridge/eos-bridge.mjs`
Node core only (`dgram` + `http`). Listens for Eos OSC on UDP (default `:8000`),
parses `/eos/out/active/cue/<list>/<cue>` (+ `/…/cue/text` for the label,
including OSC bundle unpacking), and broadcasts `{ list, cue, label }` as SSE on
`http://localhost:8080/eos`. `--mock` cycles fake cues so the whole loop is
demoable with no console. See `tools/eos-bridge/README.md` for Eos network
setup and run flags.

### 3. Live follow client — `features/scripts/use-eos-follow.ts` + cue sheet UI
`useEosFollow({ enabled, url, onCue })` subscribes via `EventSource` and fires
`onCue` per active cue; `eosCueMatches(eosCue, ours)` matches by cue number
(exact, then numeric). In the cue sheet, a **"Follow Eos"** toggle + bridge-URL
input (default `http://localhost:8080/eos`) drives the existing jump path
(`setViewMode("script")` + `setCurrentPage` + `setSelectedId`) when a cue fires.
Off by default, opt-in per session, status line shows connecting/live/last cue.

## Matching contract
Follow-along keys off the **cue number** — the numbers in CallBoard must line up
with Eos. Exact string match first (so "5.5" is exact), then numeric equality
("5" == "5.0"). Labels are display-only and best-effort.

## Known limitations / follow-ups
- **Not validated on real Eos hardware** (ASCII import + OSC). Verify on Nomad.
- **Mixed content:** SSE from an `https://` page to `http://localhost` is blocked
  by browsers — built for `next dev` over http. Production needs the bridge over
  https or a localhost exception (or the native-app path).
- **One-way only.** Two-way (CallBoard advancing/firing Eos cues) is deliberately
  out of scope for the prototype — would require strict permissions per the LD.
- **Single console.** grandMA3 / ChamSys (also OSC-capable) are future targets.
- Label text from Eos may carry trailing timing; cosmetic only.
- The bridge is dev tooling, not packaged/installed; eventual UX is a native app.
