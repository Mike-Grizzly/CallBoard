// Shared presentation helpers for the announcement surfaces (server-side).

const AVATAR_PALETTE = ["clay", "sage", "dusk", "amber", "plum", "sand"] as const;

/** Deterministic avatar colour token (e.g. "clay") from a seed string. */
export function avatarColor(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

/** Up-to-two-letter initials from a display name. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Compact relative time: "now", "5m", "3h", "2d", else a short date. */
export function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  producer: "Producer",
  director: "Director",
  choreographer: "Choreographer",
  stage_manager: "Stage Manager",
  cast: "Cast",
  crew: "Crew",
};

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}
