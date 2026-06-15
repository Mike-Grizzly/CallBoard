"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Live "follow Eos" client.
//
// The local Eos helper (tools/eos-helper) reads the OSC that ETC Eos broadcasts
// on the lighting LAN and publishes the active cue to a Supabase Realtime
// broadcast channel. This hook subscribes to that channel and fires `onCue`
// whenever the active cue changes, so the script follows along as the board op
// bounces through cues. One-way only (Eos → CallBoard).
//
// Realtime (not a direct browser↔helper link) is what lets this work from the
// Vercel-hosted https site: both the helper and the browser connect outbound to
// Supabase over wss, so no browser-to-localhost access is involved.

/** Active-cue payload the helper broadcasts. */
export type EosCue = {
  /** Cue list number, e.g. "1". */
  list: string;
  /** Active cue number, e.g. "5" or "5.5". */
  cue: string;
  /** Cue label/text, if Eos reported it. */
  label?: string;
};

export type EosFollowStatus = "idle" | "connecting" | "live" | "error";

export function useEosFollow({
  enabled,
  channel,
  onCue,
}: {
  enabled: boolean;
  channel: string;
  onCue: (cue: EosCue) => void;
}): { status: EosFollowStatus; lastCue: EosCue | null } {
  // `phase` is driven only by subscription callbacks; the user-facing status
  // derives "idle" from `enabled`, so the effect never calls setState
  // synchronously (which would cascade renders).
  const [phase, setPhase] = useState<"connecting" | "live" | "error">("connecting");
  const [lastCue, setLastCue] = useState<EosCue | null>(null);
  // Keep the latest callback without re-opening the connection on every render.
  const onCueRef = useRef(onCue);
  useEffect(() => {
    onCueRef.current = onCue;
  }, [onCue]);

  useEffect(() => {
    if (!enabled || !channel) return;
    const supabase = createSupabaseBrowserClient();
    const ch = supabase
      .channel(channel, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "cue" }, ({ payload }) => {
        const cue = payload as EosCue;
        if (!cue || typeof cue.cue !== "string") return;
        setLastCue(cue);
        onCueRef.current(cue);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setPhase("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setPhase((p) => (p === "live" ? "connecting" : "error"));
      });

    return () => {
      supabase.removeChannel(ch);
    };
  }, [enabled, channel]);

  const status: EosFollowStatus = enabled ? phase : "idle";
  return { status, lastCue };
}

/**
 * Match an Eos cue number against one of our cue annotations' numbers. Exact
 * string match first (so "5.5" beats a loose parse), then numeric equality so
 * "5" matches "5.0". Returns true when they refer to the same cue.
 */
export function eosCueMatches(eosCue: string, ours: string): boolean {
  const a = eosCue.trim();
  const b = ours.trim();
  if (!a || !b) return false;
  if (a === b) return true;
  const na = parseFloat(a);
  const nb = parseFloat(b);
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
}
