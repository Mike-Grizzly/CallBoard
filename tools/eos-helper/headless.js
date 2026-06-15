#!/usr/bin/env node
// Headless variant of the helper — same relay, no window. Handy for CI/testing
// or running on a server without a display.
//
//   node headless.js --code <pairingCode> [--osc-port 8000] [--mock]
//
// --code  : the pairing code copied from the show's Follow Eos panel
// --mock  : inject fake cues instead of listening to a real console

const dgram = require("node:dgram");
const { argv } = require("node:process");
const { createCueExtractor } = require("./osc");
const { parsePairing, createPublisher } = require("./publisher");

function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
}

const code = arg("code", "");
const oscPort = Number(arg("osc-port", "8000"));
const mock = argv.includes("--mock");

const pairing = parsePairing(code);
if (!pairing) {
  console.error("Bad or missing --code. Copy the pairing code from the show's Follow Eos panel.");
  process.exit(1);
}

const publisher = createPublisher(pairing, {
  onStatus: (s) => console.log(`[realtime] ${s}  (channel ${pairing.channel})`),
});

function emit(cue) {
  publisher.publish(cue);
  console.log(`[cue] list ${cue.list} cue ${cue.cue}${cue.label ? ` — ${cue.label}` : ""}`);
}

if (mock) {
  console.log("[mock] sending fake cues 1..8 every 3s");
  const labels = ["Preset", "Lights up", "Crossfade", "Special", "Build", "Shift", "Bump", "Blackout"];
  let n = 0;
  setInterval(() => {
    n = (n % 8) + 1;
    emit({ list: "1", cue: String(n), label: labels[n - 1] });
  }, 3000);
} else {
  const extract = createCueExtractor(emit);
  const udp = dgram.createSocket("udp4");
  udp.on("message", (buf) => extract(buf));
  udp.on("error", (err) => console.error("[osc] socket error:", err.message));
  udp.bind(oscPort, () => console.log(`[osc] listening for Eos OSC on UDP :${oscPort}`));
}

process.on("SIGINT", async () => {
  await publisher.close();
  process.exit(0);
});
