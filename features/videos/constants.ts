/**
 * Shared constants/types for the Rehearsal Video feature. Pure module (no
 * "use server") so it is safe to import from both server actions and client
 * components without tripping the constants-in-server-file hydration trap.
 */

export type VideoProvider = "youtube" | "vimeo";

export const PROVIDER_LABELS: Record<VideoProvider, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
};

export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_NOTE_LENGTH = 1000;

/** Format whole seconds as `M:SS` or `H:MM:SS` (matches the concept badges). */
export function formatTimecode(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Deterministic gradient for a library card, keyed off the video id so each
 * session keeps a stable colour (the concept uses coloured tiles, not real
 * thumbnails — those need a per-provider API call we deliberately skip here).
 */
export function gradientForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  const hue2 = (hue + 28) % 360;
  return `linear-gradient(135deg, hsl(${hue} 42% 32%), hsl(${hue2} 38% 22%))`;
}
