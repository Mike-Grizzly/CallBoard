import type { VideoProvider } from "./constants";

/**
 * Parsed result of a pasted YouTube/Vimeo URL. `embedHash` is only set for
 * Vimeo private/unlisted links (the `h=` parameter). Everything we need to
 * build a safe embed lives here — we never store or render raw embed HTML.
 */
export type ParsedVideo = {
  provider: VideoProvider;
  videoId: string;
  embedHash: string | null;
};

const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;
const VIMEO_ID = /^\d+$/;

/**
 * Parse a YouTube or Vimeo URL into a provider + id. Returns null for
 * anything we don't recognise, so callers can reject untrusted input instead
 * of embedding an arbitrary origin.
 *
 * Accepts the common shapes:
 *   YouTube — youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID,
 *             youtube.com/shorts/ID, youtube.com/live/ID
 *   Vimeo   — vimeo.com/123, vimeo.com/123/HASH, player.vimeo.com/video/123,
 *             vimeo.com/channels/NAME/123, vimeo.com/groups/NAME/videos/123
 */
export function parseVideoUrl(raw: string): ParsedVideo | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  // ----- YouTube -----
  if (host === "youtu.be") {
    const id = segments[0];
    return id && YOUTUBE_ID.test(id)
      ? { provider: "youtube", videoId: id, embedHash: null }
      : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && YOUTUBE_ID.test(v)) {
      return { provider: "youtube", videoId: v, embedHash: null };
    }
    // /embed/ID, /shorts/ID, /live/ID, /v/ID
    if (["embed", "shorts", "live", "v"].includes(segments[0])) {
      const id = segments[1];
      if (id && YOUTUBE_ID.test(id)) {
        return { provider: "youtube", videoId: id, embedHash: null };
      }
    }
    return null;
  }

  // ----- Vimeo -----
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    // The numeric id is the last all-digit segment; a following segment (or
    // ?h=) is the private hash.
    const numericIndex = segments.findIndex((s) => VIMEO_ID.test(s));
    if (numericIndex === -1) return null;
    const id = segments[numericIndex];
    const hashFromPath = segments[numericIndex + 1];
    const hashFromQuery = url.searchParams.get("h");
    const embedHash =
      (hashFromQuery && /^[a-zA-Z0-9]+$/.test(hashFromQuery) && hashFromQuery) ||
      (hashFromPath && /^[a-zA-Z0-9]+$/.test(hashFromPath) && hashFromPath) ||
      null;
    return { provider: "vimeo", videoId: id, embedHash };
  }

  return null;
}

/**
 * Build the embed URL we feed to the player iframe. Constructed entirely from
 * the validated id/hash — never from user-supplied HTML — which sidesteps the
 * sanitisation risk documented for RichTextDisplay.
 */
export function buildEmbedUrl(
  provider: VideoProvider,
  videoId: string,
  embedHash: string | null,
): string {
  if (provider === "youtube") {
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;
  }
  // Vimeo
  const params = new URLSearchParams();
  if (embedHash) params.set("h", embedHash);
  const qs = params.toString();
  return `https://player.vimeo.com/video/${videoId}${qs ? `?${qs}` : ""}`;
}

/**
 * A canonical "watch" link with a start time, used by the Share-clip button to
 * copy a timestamped deep link (a true clip trim isn't possible on hosted
 * video).
 */
export function buildShareUrl(
  provider: VideoProvider,
  videoId: string,
  embedHash: string | null,
  seconds: number,
): string {
  const t = Math.max(0, Math.floor(seconds));
  if (provider === "youtube") {
    return `https://youtu.be/${videoId}?t=${t}`;
  }
  const hash = embedHash ? `/${embedHash}` : "";
  return `https://vimeo.com/${videoId}${hash}#t=${t}s`;
}
