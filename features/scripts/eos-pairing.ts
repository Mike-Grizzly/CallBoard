// Pairing between a production's "Follow Eos" and the local Eos helper app.
//
// The helper (tools/eos-helper) reads Eos OSC on the lighting LAN and publishes
// the active cue to a Supabase Realtime broadcast channel; the script viewer
// subscribes to the same channel. Routing through Supabase (which Proscene
// already uses) means both sides connect OUTBOUND over wss — so it works from
// the Vercel-hosted https site, with no browser-to-localhost access.
//
// A "pairing code" is just a base64 blob carrying everything the helper needs
// to reach the right channel: the Supabase URL, the public anon key, and the
// per-production channel name. The user copies it from the show's Follow Eos
// panel and pastes it into the helper. (The anon key is public — it's the same
// NEXT_PUBLIC key the browser already ships — and broadcast carries only cue
// navigation, no data, so this is safe to hand around for a show.)

/** Realtime channel for a production's cue stream. */
export function channelForProduction(productionId: string): string {
  return `eos:${productionId}`;
}

export type EosPairing = {
  url: string;
  anonKey: string;
  channel: string;
};

/**
 * Build the pairing code shown in the Follow Eos panel. Returns null if the
 * public Supabase env vars aren't available (so the UI can degrade gracefully).
 */
export function buildPairingCode(productionId: string): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const pairing: EosPairing = {
    url,
    anonKey,
    channel: channelForProduction(productionId),
  };
  // base64 of JSON. btoa is fine — the payload is ASCII (URL + key + id).
  return btoa(JSON.stringify(pairing));
}

/** Decode a pairing code back into its parts (used by the helper app). */
export function parsePairingCode(code: string): EosPairing | null {
  try {
    const json = typeof atob === "function" ? atob(code.trim()) : "";
    const p = JSON.parse(json) as EosPairing;
    if (!p.url || !p.anonKey || !p.channel) return null;
    return p;
  } catch {
    return null;
  }
}
