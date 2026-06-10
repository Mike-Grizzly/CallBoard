"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

export type TrialTone = "info" | "warn" | "lock";

const TONE_STYLE: Record<TrialTone, { bg: string; fg: string; border: string }> = {
  info: { bg: "var(--bg-muted, #f4f1ec)", fg: "var(--ink, #222)", border: "var(--border, #e3ddd2)" },
  warn: { bg: "#fff7e6", fg: "#7a4e00", border: "#f1d9a8" },
  lock: { bg: "#fdecec", fg: "#8a1f1f", border: "#f1c2c2" },
};

// Re-surface the banner as an occasional reminder: closing it hides it for a
// day (per phase, so an escalation to a more urgent phase shows immediately),
// rather than nagging on every page load.
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const dismissKey = (phase: string) => `trial-banner-dismissed:${phase}`;
const noopSubscribe = () => () => {};

function isWithinCooldown(phase: string): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(dismissKey(phase));
  if (!raw) return false;
  const ts = Number(raw);
  return Number.isFinite(ts) && Date.now() - ts < COOLDOWN_MS;
}

export function TrialBannerClient({
  phase,
  tone,
  message,
  dismissible,
  isAdmin,
}: {
  phase: string;
  tone: TrialTone;
  message: string;
  dismissible: boolean;
  isAdmin: boolean;
}) {
  // Read the per-phase dismissal from localStorage in a hydration-safe way:
  // the server snapshot is always "show", the client reads the cooldown after
  // hydration (no setState-in-effect, no mismatch).
  const withinCooldown = useSyncExternalStore(
    noopSubscribe,
    () => (dismissible ? isWithinCooldown(phase) : false),
    () => false,
  );
  const [closed, setClosed] = useState(false);

  if (withinCooldown || closed) return null;

  const s = TONE_STYLE[tone];

  return (
    <div
      role="status"
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.border}`,
        borderRadius: 12,
        padding: "10px 14px",
        margin: "0 0 14px",
        fontSize: 13.5,
        lineHeight: 1.45,
      }}
    >
      <span style={{ flex: "1 1 280px" }}>{message}</span>
      <span style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        {isAdmin ? (
          <Link
            href="/settings/billing"
            className="btn primary"
            style={{ fontSize: 13, padding: "6px 12px", textDecoration: "none" }}
          >
            Subscribe
          </Link>
        ) : (
          <span style={{ opacity: 0.8 }}>Ask an admin to subscribe.</span>
        )}
        {dismissible && (
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(dismissKey(phase), String(Date.now()));
              setClosed(true);
            }}
            aria-label="Dismiss"
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              opacity: 0.6,
              padding: "0 2px",
            }}
          >
            ×
          </button>
        )}
      </span>
    </div>
  );
}
