// Proscene Eos Helper — Electron main process.
//
// Bridges ETC Eos → Proscene: listens for Eos OSC on the lighting LAN and
// relays the active cue to the show's Supabase Realtime channel. The renderer
// is a single status page; all privileged work (UDP sockets, Supabase) happens
// here in the main process, which the renderer drives over IPC.

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const dgram = require("node:dgram");
const { createCueExtractor } = require("./osc");
const { parsePairing, createPublisher } = require("./publisher");

let win = null;
let udp = null;
let publisher = null;
let mockTimer = null;

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function createWindow() {
  win = new BrowserWindow({
    width: 460,
    height: 600,
    resizable: false,
    title: "Proscene · Eos Helper",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

function stopAll() {
  if (mockTimer) {
    clearInterval(mockTimer);
    mockTimer = null;
  }
  if (udp) {
    try {
      udp.close();
    } catch {
      /* already closed */
    }
    udp = null;
  }
  if (publisher) {
    publisher.close().catch(() => {});
    publisher = null;
  }
  send("status", { osc: "stopped", realtime: "stopped" });
}

// ── Start: open the Realtime channel + bind the OSC socket ──────────────────
ipcMain.handle("start", (_e, { pairingCode, oscPort }) => {
  stopAll();

  const pairing = parsePairing(pairingCode);
  if (!pairing) {
    send("status", { error: "That pairing code didn't parse. Re-copy it from the show's Follow Eos panel." });
    return { ok: false };
  }

  publisher = createPublisher(pairing, {
    onStatus: (s) =>
      send("status", { realtime: s === "SUBSCRIBED" ? "live" : s === "CLOSED" ? "stopped" : s.toLowerCase() }),
  });
  send("status", { realtime: "connecting", channel: pairing.channel });

  const port = Number(oscPort) || 8000;
  const extract = createCueExtractor((cue) => {
    publisher && publisher.publish(cue);
    send("cue", cue);
  });
  udp = dgram.createSocket("udp4");
  udp.on("message", (buf) => extract(buf));
  udp.on("error", (err) => send("status", { error: `OSC socket: ${err.message}` }));
  udp.bind(port, () => send("status", { osc: "listening", oscPort: port }));

  return { ok: true };
});

ipcMain.handle("stop", () => {
  stopAll();
  return { ok: true };
});

// Inject fake cues so the whole loop can be tested with no console attached.
ipcMain.handle("mock", () => {
  if (mockTimer) {
    clearInterval(mockTimer);
    mockTimer = null;
    send("status", { osc: "stopped" });
    return { ok: true, mocking: false };
  }
  const labels = ["Preset", "Lights up", "Crossfade", "Special", "Build", "Shift", "Bump", "Blackout"];
  let n = 0;
  send("status", { osc: "mock" });
  mockTimer = setInterval(() => {
    n = (n % 8) + 1;
    const cue = { list: "1", cue: String(n), label: labels[n - 1] };
    publisher && publisher.publish(cue);
    send("cue", cue);
  }, 3000);
  return { ok: true, mocking: true };
});

ipcMain.handle("quit", () => {
  stopAll();
  app.quit();
  return { ok: true };
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  stopAll();
  app.quit();
});
