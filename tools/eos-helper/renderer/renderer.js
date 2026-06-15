// Status-page logic. Talks to the main process only through window.eosHelper
// (see preload.js). No Node access here.

const $ = (id) => document.getElementById(id);
const els = {
  code: $("code"),
  port: $("port"),
  start: $("start"),
  stop: $("stop"),
  mock: $("mock"),
  quit: $("quit"),
  error: $("error"),
  oscDot: $("osc-dot"),
  oscDetail: $("osc-detail"),
  rtDot: $("rt-dot"),
  rtDetail: $("rt-detail"),
  cue: $("cue"),
};

let running = false;
let mocking = false;

function setRunning(on) {
  running = on;
  els.start.disabled = on;
  els.stop.disabled = !on;
  els.code.disabled = on;
  els.port.disabled = on;
}

// Map a state string to a status dot class.
function dotClass(state) {
  if (state === "listening" || state === "live") return "dot ok";
  if (state === "connecting" || state === "mock") return "dot warn";
  if (state === "error" || state === "channel_error" || state === "timed_out") return "dot err";
  return "dot";
}

els.start.onclick = async () => {
  els.error.textContent = "";
  const code = els.code.value.trim();
  if (!code) {
    els.error.textContent = "Paste a pairing code first.";
    return;
  }
  const res = await window.eosHelper.start(code, els.port.value);
  if (res && res.ok) setRunning(true);
};

els.stop.onclick = async () => {
  await window.eosHelper.stop();
  mocking = false;
  els.mock.textContent = "Send test cues";
  setRunning(false);
};

els.mock.onclick = async () => {
  // Mock needs the channel open, so start first if needed.
  if (!running) await els.start.onclick();
  const res = await window.eosHelper.mock();
  mocking = res && res.mocking;
  els.mock.textContent = mocking ? "Stop test cues" : "Send test cues";
};

els.quit.onclick = () => window.eosHelper.quit();

window.eosHelper.onStatus((s) => {
  if (s.error) els.error.textContent = s.error;
  if (s.osc !== undefined) {
    els.oscDot.className = dotClass(s.osc);
    els.oscDetail.textContent =
      s.osc === "listening"
        ? `listening on :${s.oscPort || els.port.value}`
        : s.osc === "mock"
          ? "sending test cues"
          : s.osc;
  }
  if (s.realtime !== undefined) {
    els.rtDot.className = dotClass(s.realtime);
    els.rtDetail.textContent =
      s.realtime === "live"
        ? "connected"
        : s.channel && s.realtime === "connecting"
          ? `connecting (${s.channel})`
          : s.realtime;
  }
  if (s.realtime === "stopped" && s.osc === "stopped") setRunning(false);
});

window.eosHelper.onCue((c) => {
  els.cue.innerHTML = `Cue ${c.cue} ${c.label ? `<small>${c.label}</small>` : ""}`;
});
