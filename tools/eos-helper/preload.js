// Safe bridge between the renderer (status page) and the main process. The
// renderer can only call these whitelisted actions — no Node access.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("eosHelper", {
  start: (pairingCode, oscPort) => ipcRenderer.invoke("start", { pairingCode, oscPort }),
  stop: () => ipcRenderer.invoke("stop"),
  mock: () => ipcRenderer.invoke("mock"),
  quit: () => ipcRenderer.invoke("quit"),
  onStatus: (cb) => ipcRenderer.on("status", (_e, s) => cb(s)),
  onCue: (cb) => ipcRenderer.on("cue", (_e, c) => cb(c)),
});
