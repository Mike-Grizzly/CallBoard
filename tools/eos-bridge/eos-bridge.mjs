#!/usr/bin/env node
// Eos → CallBoard bridge (PROTOTYPE).
//
// Browsers can't read the OSC/UDP that ETC Eos broadcasts on the lighting LAN,
// so this tiny bridge sits on the booth machine: it listens to Eos's OSC output
// and re-emits the *active cue* to the browser as Server-Sent Events (SSE).
// CallBoard's script viewer subscribes (see features/scripts/use-eos-follow.ts)
// and follows along as the board op bounces through cues. One-way only.
//
// Zero npm dependencies — just Node core (dgram + http).
//
// Usage:
//   node eos-bridge.mjs                 # listen for Eos OSC on UDP :8000, SSE on :8080
//   node eos-bridge.mjs --osc-port 8000 --http-port 8080
//   node eos-bridge.mjs --mock          # no console needed: cycle fake cues to test the loop
//
// Eos setup (Eos shell ▸ Settings ▸ Network):
//   • Enable OSC, OSC UDP TX.
//   • Set "OSC UDP TX IP Address" to this machine's IP and "TX Port" to --osc-port.
//   • Eos then sends /eos/out/active/cue/<list>/<cue> on every GO/jump.
//
// Note (prototype limitation): EventSource from an HTTPS page to http://localhost
// is blocked as mixed content. This is built for `next dev` over http. A
// production build would need the bridge reachable over https or a localhost
// exception.

import dgram from "node:dgram";
import http from "node:http";
import { argv } from "node:process";

// ── args ────────────────────────────────────────────────────────────────────
function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
}
const OSC_PORT = Number(arg("osc-port", "8000"));
const HTTP_PORT = Number(arg("http-port", "8080"));
const MOCK = argv.includes("--mock");

// ── minimal OSC parsing ───────────────────────────────────────────────────--
// OSC strings are null-terminated and padded to a 4-byte boundary.
function readOscString(buf, offset) {
  let end = offset;
  while (end < buf.length && buf[end] !== 0) end++;
  const str = buf.toString("ascii", offset, end);
  const next = offset + Math.ceil((end - offset + 1) / 4) * 4;
  return { str, next };
}

// Parse a single OSC message into { address, args }. We only need string args
// (the cue label); ints/floats are skipped over so parsing stays aligned.
function parseOscMessage(buf) {
  const { str: address, next: afterAddr } = readOscString(buf, 0);
  let offset = afterAddr;
  const args = [];
  if (offset < buf.length && buf[offset] === 0x2c /* ',' */) {
    const { str: tags, next: afterTags } = readOscString(buf, offset);
    offset = afterTags;
    for (const tag of tags.slice(1)) {
      if (tag === "s") {
        const { str, next } = readOscString(buf, offset);
        args.push(str);
        offset = next;
      } else if (tag === "f" || tag === "i" || tag === "r" || tag === "c") {
        args.push(tag === "f" ? buf.readFloatBE(offset) : buf.readInt32BE(offset));
        offset += 4;
      } else if (tag === "h" || tag === "t" || tag === "d") {
        offset += 8; // 64-bit args we don't use
      }
      // other tags (T/F/N/I) carry no data
    }
  }
  return { address, args };
}

// OSC packets may be bundles ("#bundle\0" + timetag + size-prefixed elements).
function forEachOscMessage(buf, fn) {
  if (buf.length >= 8 && buf.toString("ascii", 0, 8) === "#bundle\0") {
    let offset = 16; // skip "#bundle\0" (8) + timetag (8)
    while (offset + 4 <= buf.length) {
      const size = buf.readInt32BE(offset);
      offset += 4;
      if (size <= 0 || offset + size > buf.length) break;
      forEachOscMessage(buf.subarray(offset, offset + size), fn);
      offset += size;
    }
  } else {
    fn(parseOscMessage(buf));
  }
}

// ── SSE clients ───────────────────────────────────────────────────────────--
const clients = new Set();
let lastCue = null; // remember so new subscribers get the current cue immediately

function broadcastCue(cue) {
  lastCue = cue;
  const frame = `event: cue\ndata: ${JSON.stringify(cue)}\n\n`;
  for (const res of clients) res.write(frame);
  const label = cue.label ? ` — ${cue.label}` : "";
  console.log(`[cue] list ${cue.list} cue ${cue.cue}${label}  (${clients.size} client${clients.size === 1 ? "" : "s"})`);
}

// ── OSC listener ──────────────────────────────────────────────────────────--
// Eos sends /eos/out/active/cue/<list>/<cue> with a float (percent complete),
// and /eos/out/active/cue/text with the label string. Merge them.
const ACTIVE_CUE_RE = /^\/eos\/out\/active\/cue\/([\d.]+)\/([\d.]+)$/;
let pending = null; // { list, cue } awaiting its label text

function handleOsc(buf) {
  forEachOscMessage(buf, ({ address, args }) => {
    const m = ACTIVE_CUE_RE.exec(address);
    if (m) {
      pending = { list: m[1], cue: m[2] };
      // Emit immediately; a following /text frame will refine the label.
      broadcastCue({ ...pending });
      return;
    }
    if (address === "/eos/out/active/cue/text" && typeof args[0] === "string") {
      // Text looks like "1/5.5 Label  3.0 100%" — take the human label chunk.
      const label = args[0].replace(/^\s*[\d.]+\/[\d.]+\s*/, "").trim();
      if (pending) broadcastCue({ ...pending, label });
    }
  });
}

if (!MOCK) {
  const udp = dgram.createSocket("udp4");
  udp.on("message", handleOsc);
  udp.on("error", (err) => console.error("[osc] socket error:", err.message));
  udp.bind(OSC_PORT, () =>
    console.log(`[osc] listening for Eos OSC on UDP :${OSC_PORT}`),
  );
} else {
  console.log("[mock] no console — cycling fake cues 1..8 every 3s");
  const labels = ["Preset", "Lights up", "Crossfade", "Special", "Build", "Shift", "Bump", "Blackout"];
  let n = 0;
  setInterval(() => {
    n = (n % 8) + 1;
    broadcastCue({ list: "1", cue: String(n), label: labels[n - 1] });
  }, 3000);
}

// ── HTTP / SSE server ─────────────────────────────────────────────────────--
const server = http.createServer((req, res) => {
  // CORS so the browser page (e.g. http://localhost:3000) can subscribe.
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.url === "/eos" || req.url === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");
    if (lastCue) res.write(`event: cue\ndata: ${JSON.stringify(lastCue)}\n\n`);
    clients.add(res);
    const ping = setInterval(() => res.write(": ping\n\n"), 15000);
    req.on("close", () => {
      clearInterval(ping);
      clients.delete(res);
    });
    return;
  }

  // Health / hint page.
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(
    `Eos → CallBoard bridge\n` +
      `SSE endpoint: http://localhost:${HTTP_PORT}/eos\n` +
      `OSC in: ${MOCK ? "MOCK MODE" : `UDP :${OSC_PORT}`}\n` +
      `clients: ${clients.size}\n`,
  );
});
server.listen(HTTP_PORT, () =>
  console.log(`[sse] serving cues at http://localhost:${HTTP_PORT}/eos`),
);
