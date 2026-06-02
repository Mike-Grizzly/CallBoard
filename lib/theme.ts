// Client-side theme preference helpers. The preference ("light" | "dark" |
// "system") is stored in a cookie so the server layout can render the correct
// `data-theme` on first paint (no flash); "system" is resolved client-side
// against the OS `prefers-color-scheme`.

export const THEME_COOKIE = "proscene-theme";

export type ThemePref = "light" | "dark" | "system";
export const THEME_PREFS: ThemePref[] = ["light", "dark", "system"];

// The actual value written to body[data-theme]. Light maps to the warm
// palette (the app's default light theme).
export type EffectiveTheme = "warm" | "dark";

const THEME_COLOR_DARK = "#1d1b18";
const THEME_COLOR_LIGHT = "#fbf8f3";

export function readThemePref(): ThemePref {
  if (typeof document === "undefined") return "system";
  const m = document.cookie.match(/(?:^|;\s*)proscene-theme=([^;]+)/);
  const v = m ? decodeURIComponent(m[1]) : "system";
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

export function prefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function resolveTheme(pref: ThemePref): EffectiveTheme {
  if (pref === "dark") return "dark";
  if (pref === "light") return "warm";
  return prefersDark() ? "dark" : "warm";
}

/** Event fired after the theme preference changes, so `useThemePref`
 *  subscribers re-read the cookie. */
export const THEME_EVENT = "proscene-themechange";

/** Apply a preference: flip body[data-theme], persist the cookie, update the
 *  mobile status-bar color, and notify subscribers. */
export function applyThemePref(pref: ThemePref): void {
  if (typeof document === "undefined") return;
  const eff = resolveTheme(pref);
  document.body.dataset.theme = eff;
  document.cookie = `${THEME_COOKIE}=${pref}; path=/; max-age=31536000; samesite=lax`;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      eff === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT,
    );
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

/** Subscribe/snapshot helpers for `useSyncExternalStore`. */
export function subscribeThemePref(callback: () => void): () => void {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}
