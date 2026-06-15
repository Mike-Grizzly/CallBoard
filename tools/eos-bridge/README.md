# Eos → CallBoard bridge (prototype)

Lets CallBoard's script follow along live as the board op bounces through cues
on an **ETC Eos** console. One-way only (Eos → CallBoard).

## Why a bridge is needed

A web browser can't open raw UDP sockets, and that's how Eos broadcasts its OSC
output on the lighting LAN. So this tiny Node program sits on the booth machine,
listens to Eos's OSC, and re-emits the **active cue** to the browser as
Server-Sent Events (SSE). CallBoard's script viewer subscribes and jumps to the
matching cue.

Zero npm dependencies — just Node core.

## Run it

```bash
# Listen for Eos OSC on UDP :8000, serve cues over SSE on :8080
node eos-bridge.mjs

# Custom ports
node eos-bridge.mjs --osc-port 8000 --http-port 8080

# No console handy? Cycle fake cues to test the whole loop end-to-end:
node eos-bridge.mjs --mock
```

The SSE endpoint is `http://localhost:8080/eos`.

## Configure Eos to send OSC

In the Eos shell: **Settings ▸ Network**

1. Enable **OSC** and **OSC UDP TX**.
2. Set **OSC UDP TX IP Address** to the bridge machine's IP.
3. Set the **TX Port** to match `--osc-port` (default `8000`).

Eos then emits `/eos/out/active/cue/<list>/<cue>` on every GO or jump, plus
`/eos/out/active/cue/text` with the cue label. The bridge parses these and
broadcasts `{ list, cue, label }`.

## Connect CallBoard

Open a production's **Script ▸ Cue sheet**, click **Follow Eos**, and point the
URL at the bridge (default `http://localhost:8080/eos`). As cues fire, the script
jumps to the cue annotation whose number matches. Matching is by **cue number**
(exact, then numeric) — so the cue numbers in CallBoard must line up with Eos.

## Known prototype limitations

- **Mixed content:** a browser blocks SSE from an `https://` page to
  `http://localhost`. This is built for `next dev` over http. A production build
  would need the bridge reachable over https (or a localhost exception).
- **Network reach:** the booth machine must see *both* the lighting LAN (for OSC)
  *and* CallBoard. Often the same laptop, but lighting nets are sometimes
  air-gapped.
- **Label text** is best-effort: Eos's `…/cue/text` packs label + timing
  together, so the label may include trailing timing. Matching keys off the cue
  **number**, which is reliable.
