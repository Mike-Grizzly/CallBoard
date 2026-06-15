# Proscene Eos Helper (prototype)

A tiny desktop app for the booth computer. It listens to **ETC Eos** OSC on the
lighting network and relays the **active cue** to your Proscene show, so the
script follows along live as the board op runs cues. One-way (Eos → Proscene).

## Why this exists

A browser can't read the OSC/UDP Eos broadcasts, and an https site (Proscene on
Vercel) can't reach into your local network anyway. So this helper does the
listening and publishes cues to your show's **Supabase Realtime** channel —
both the helper and the Proscene browser connect *outbound* to Supabase, which
is what makes it work from the hosted site.

```
Eos ──OSC/UDP──▶ Eos Helper ──wss──▶ Supabase Realtime ──wss──▶ Proscene (browser)
   (lighting LAN)   (this app)         (your project)            jumps the script
```

## Run it (testing)

Needs [Node.js](https://nodejs.org). From this folder:

```bash
npm install
npm start      # opens the helper window
```

The window has one status page with its own **Stop** and **Quit** buttons.

> Prototype note: this is run from source and is **unsigned**. A signed
> double-click installer (Mac/Windows) with auto-update is a later step.

## Use it

1. In Proscene, open your production → **Script → Cue sheet → Copy pairing code**.
2. Paste it into the helper and press **Start**.
3. On Eos: **Settings → Network** → enable **OSC** + **OSC UDP TX**, set the
   **TX IP Address** to this computer's IP and the **TX Port** to `8000`.
4. In Proscene's cue sheet, turn on **Follow Eos**. When the helper shows both
   dots green and Proscene shows "live", you're connected.

No console handy? Click **Send test cues** to inject fake cues and watch the
Proscene script jump.

## Headless (no window)

For a server or CI, run the same relay without the GUI:

```bash
npm install
node headless.js --code <pairingCode> --osc-port 8000   # or add --mock
```

## How matching works

Cues match by **number** — exact, then numeric (`5` == `5.0`). The cue numbers
in Proscene must line up with Eos. Labels are display-only.

## Files

- `main.js` — Electron main: window, OSC socket, IPC, mock generator.
- `preload.js` — safe IPC bridge to the renderer.
- `renderer/` — the status page (HTML/JS).
- `osc.js` — minimal OSC parser + Eos active-cue extractor.
- `publisher.js` — decodes the pairing code, publishes cues to Supabase Realtime.
- `headless.js` — no-GUI variant.
