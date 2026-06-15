// Publishes Eos cues to a Proscene production's Supabase Realtime channel.
//
// The pairing code (copied from the show's Follow Eos panel) is base64 JSON
// carrying { url, anonKey, channel }. We connect to Supabase Realtime and
// broadcast each active cue; the Proscene browser subscribes to the same
// channel. Both ends connect OUTBOUND over wss, so this works against the
// Vercel-hosted site with no browser-to-localhost access.

const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");

/** Decode a pairing code into { url, anonKey, channel } or null. */
function parsePairing(code) {
  try {
    const json = Buffer.from(String(code).trim(), "base64").toString("utf8");
    const p = JSON.parse(json);
    if (!p || !p.url || !p.anonKey || !p.channel) return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * Connect to the channel. `onStatus(status)` gets the raw Realtime status
 * ("SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED"). Returns
 * `{ publish(cue), close() }`. The last cue is re-sent on (re)subscribe so a
 * browser that connects mid-show immediately lands on the right cue.
 */
function createPublisher(pairing, { onStatus } = {}) {
  // Node (<22) has no global WebSocket — give realtime-js the `ws` transport.
  const supabase = createClient(pairing.url, pairing.anonKey, {
    realtime: { transport: WebSocket },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let ready = false;
  let lastCue = null;

  const channel = supabase.channel(pairing.channel, {
    config: { broadcast: { self: false } },
  });

  channel.subscribe((status) => {
    ready = status === "SUBSCRIBED";
    if (ready && lastCue) {
      channel.send({ type: "broadcast", event: "cue", payload: lastCue });
    }
    if (onStatus) onStatus(status);
  });

  return {
    get ready() {
      return ready;
    },
    publish(cue) {
      lastCue = cue;
      if (!ready) return;
      channel.send({ type: "broadcast", event: "cue", payload: cue });
    },
    async close() {
      ready = false;
      await supabase.removeChannel(channel);
    },
  };
}

module.exports = { parsePairing, createPublisher };
