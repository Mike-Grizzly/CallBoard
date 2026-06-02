"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Sun, Sunset, Moon, Monitor } from "lucide-react";
import {
  applyThemePref,
  readThemePref,
  resolveTheme,
  subscribeThemePref,
  type ThemePref,
} from "@/lib/theme";

const OPTIONS: { pref: ThemePref; label: string; Icon: typeof Sun }[] = [
  { pref: "light", label: "Light", Icon: Sun },
  { pref: "dusk", label: "Dusk", Icon: Sunset },
  { pref: "dark", label: "Dark", Icon: Moon },
  { pref: "system", label: "System", Icon: Monitor },
];

// Read the preference from the cookie without setState-in-effect. The server
// snapshot is seeded from the cookie (via `initialPref`) so the first render
// matches; the client re-reads on mount and on theme-change events.
function useThemePref(initialPref: ThemePref): ThemePref {
  return useSyncExternalStore(
    subscribeThemePref,
    () => readThemePref(),
    () => initialPref,
  );
}

/**
 * Theme switcher. `segmented` shows the three labelled options (Settings,
 * mobile More); `icon` is a compact cycle button for the rail footer.
 * Persists via cookie and applies instantly with no reload. While on
 * "system" it follows live OS changes.
 */
export function ThemeControl({
  variant = "segmented",
  initialPref = "system",
}: {
  variant?: "segmented" | "icon";
  initialPref?: ThemePref;
}) {
  const pref = useThemePref(initialPref);

  // Follow OS changes while the preference is "system".
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemePref("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  if (variant === "icon") {
    const idx = OPTIONS.findIndex((o) => o.pref === pref);
    const active = OPTIONS[idx === -1 ? OPTIONS.length - 1 : idx];
    const next = OPTIONS[(idx + 1) % OPTIONS.length];
    const ActiveIcon = active.Icon;
    return (
      <button
        type="button"
        className="theme-quick"
        onClick={() => applyThemePref(next.pref)}
        title={`Theme: ${active.label} — switch to ${next.label}`}
        aria-label={`Theme: ${active.label}. Switch to ${next.label}.`}
      >
        <ActiveIcon className="ico" width={16} height={16} aria-hidden />
      </button>
    );
  }

  return (
    <div className="theme-seg" role="group" aria-label="Theme">
      {OPTIONS.map(({ pref: p, label, Icon }) => (
        <button
          key={p}
          type="button"
          className="theme-seg-btn"
          data-active={pref === p ? "1" : "0"}
          onClick={() => applyThemePref(p)}
          aria-pressed={pref === p}
        >
          <Icon width={15} height={15} aria-hidden />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

/** Small caption naming the currently-applied theme (for Settings). */
export function ThemeStatusNote({
  initialPref = "system",
}: {
  initialPref?: ThemePref;
}) {
  const pref = useThemePref(initialPref);
  if (pref !== "system") return null;
  const eff = resolveTheme("system") === "dark" ? "Dark" : "Light";
  return (
    <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
      Following your system ({eff} right now).
    </p>
  );
}
