"use client";

import { useEffect, useRef, useState } from "react";

// Live "follow Eos" client.
//
// A browser can't read the OSC/UDP that ETC Eos broadcasts on the lighting LAN,
// so a small local bridge (see tools/eos-bridge) listens to Eos and re-emits the
// active cue as Server-Sent Events. This hook subscribes to that bridge and
// fires `onCue` whenever the active cue changes, so the script can follow along
// as the board op bounces through cues. One-way only (Eos → CallBoard).

/** Active-cue payload the bridge sends (see tools/eos-bridge/eos-bridge.mjs). */
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
  url,
  onCue,
}: {
  enabled: boolean;
  url: string;
  onCue: (cue: EosCue) => void;
}): { status: EosFollowStatus; lastCue: EosCue | null } {
  // `phase` is driven only by connection events (open/error); the synchronous
  // "connecting" state is its default and is shown until the first event. The
  // user-facing status derives "idle" from `enabled`, so the effect never calls
  // setState synchronously (which would cascade renders).
  const [phase, setPhase] = useState<"connecting" | "live" | "error">("connecting");
  const [lastCue, setLastCue] = useState<EosCue | null>(null);
  // Keep the latest callback without re-opening the connection on every render.
  const onCueRef = useRef(onCue);
  useEffect(() => {
    onCueRef.current = onCue;
  }, [onCue]);

  useEffect(() => {
    if (!enabled || !url) return;
    const es = new EventSource(url);

    es.addEventListener("open", () => setPhase("live"));
    es.addEventListener("cue", (ev) => {
      try {
        const cue = JSON.parse((ev as MessageEvent).data) as EosCue;
        if (!cue || typeof cue.cue !== "string") return;
        setLastCue(cue);
        onCueRef.current(cue);
      } catch {
        // Ignore malformed frames — the bridge is the source of truth.
      }
    });
    // EventSource auto-reconnects; surface the gap as "connecting" not "error"
    // unless it never opened.
    es.addEventListener("error", () => {
      setPhase((p) => (p === "live" ? "connecting" : "error"));
    });

    return () => es.close();
  }, [enabled, url]);

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
