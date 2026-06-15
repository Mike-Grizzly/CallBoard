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
Built end-to-end; the OSC parser + pairing round-trip are unit-exercised and the
helper files syntax-check, but it's **not yet validated against a real Eos
console / Nomad**, nor run as a packaged app. Treat as "works in principle,
verify on hardware."

## Architecture (why it works on Vercel)
The key decision: live cues route through **Supabase Realtime**, not a direct
browser↔local link. A browser can't read Eos's OSC/UDP, and an https page (the
Vercel-hosted site) can't reach into the local network (Chrome's Local Network
Access gate, shipped Chrome 142). So:

```
Eos ──OSC/UDP──▶ Eos Helper app ──wss──▶ Supabase Realtime ──wss──▶ Proscene (browser)
   (lighting LAN)   (booth computer)       (your project)            jumps the script
```

Both the helper and the browser connect **outbound** over wss — no
browser-to-localhost, so it works from the hosted https site.

## Why these shapes
- **Export is USITT ASCII, not CSV.** Eos imports cue lists via the USITT ASCII
  Showfile format (`File ▸ Import ▸ USITT ASCII`), not plain CSV. We emit only
  cue **number + label** (as the cue `Text`) — deliberately not channel levels
  or fade times — so importing seeds the LD's stack with our labels without
  touching their programmed looks.
- **Live follow needs a native helper.** Browsers can't read OSC. The helper is
  a small Electron desktop app on the booth computer. Cues go over Supabase
  Realtime **broadcast** (no DB writes, no RLS — just cue navigation).

## What was built

### 1. Eos ASCII export — `features/scripts/eos-ascii.ts`
`cueSheetToEosAscii(cues, title)` → a USITT ASCII v3.0 showfile (header,
`Clear All`, then `Cue <n>` / `Text <label>` blocks, sorted numeric-aware).
Wired as an **"Export for Eos"** button beside "Export CSV" in the cue sheet.

### 2. Pairing — `features/scripts/eos-pairing.ts`
`channelForProduction(productionId)` → `eos:<id>`. `buildPairingCode(productionId)`
returns base64 JSON of `{ url, anonKey, channel }` (the public NEXT_PUBLIC
Supabase values + the channel). Shown in the Follow Eos panel as a **Copy
pairing code** button; the user pastes it into the helper. `parsePairingCode`
is the inverse (the helper re-implements it in plain JS).

### 3. Live follow client — `features/scripts/use-eos-follow.ts` + cue sheet UI
`useEosFollow({ enabled, channel, onCue })` subscribes to the Supabase Realtime
channel and fires `onCue` per broadcast cue; `eosCueMatches` matches by cue
number (exact, then numeric). In the cue sheet, a **"Follow Eos"** toggle + the
pairing-code copy button drive the existing jump path (`setViewMode("script")` +
`setCurrentPage` + `setSelectedId`). Off by default; status line shows
connecting/live/last cue. Disabled (with "Realtime not configured") if the
NEXT_PUBLIC Supabase env vars are absent.

### 4. The helper app — `tools/eos-helper/` (Electron)
- `main.js` — main process: window, OSC UDP socket (`dgram`), IPC, mock cue
  generator.
- `preload.js` — contextIsolated IPC bridge (renderer has no Node access).
- `renderer/` — single status page: pairing-code box, OSC port, Start/Stop,
  two status dots (Eos OSC / Proscene Realtime), last cue, **Send test cues**,
  **Quit**.
- `osc.js` — minimal OSC parser + active-cue extractor (handles bundles; merges
  the cue-number frame with the following label-text frame).
- `publisher.js` — decodes the pairing code, opens the Realtime channel (Node
  `ws` transport), broadcasts cues, re-sends the last cue on (re)subscribe.
- `headless.js` — no-GUI variant for CI/servers (`--code`, `--osc-port`, `--mock`).

### 5. Settings entry — `app/(app)/(default)/settings/eos-helper/page.tsx`
A **"Lighting console (Eos helper)"** item in Settings: what it is, **Get the Eos
helper app** button (links to the repo folder; run from source for now), and the
3-step setup (install → pair from the show's cue sheet → point Eos's OSC at the
helper).

## Matching contract
Follow-along keys off the **cue number** — exact string, then numeric equality.
Labels are display-only.

## Known limitations / follow-ups
- **Not validated on real Eos hardware** (ASCII import + OSC) or as a packaged
  app — run from source. Verify on Nomad.
- **Unsigned, run-from-source.** A signed Mac/Windows installer + auto-update is
  the production step; the Settings "Get the helper" button links to source for
  now (a real one-click install can't be done from a web button anyway — it
  downloads an installer).
- **Channel security:** broadcast channel is `eos:<productionId>` with the public
  anon key — fine for cue navigation (no data), but anyone with the code could
  publish cues to that show. Acceptable for the prototype; a signed/token-scoped
  channel is a follow-up if needed.
- **One-way only.** Two-way (Proscene firing Eos cues) is out of scope; would
  need strict per-LD permissions.
- **Single console.** grandMA3 / ChamSys (also OSC-capable) are future targets.
- Label text from Eos may carry trailing timing; cosmetic only.
