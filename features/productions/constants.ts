export const PRODUCTION_COLOR_PALETTE = [
  { token: "clay", label: "Clay", cssVar: "var(--c-clay)" },
  { token: "sage", label: "Sage", cssVar: "var(--c-sage)" },
  { token: "dusk", label: "Dusk", cssVar: "var(--c-dusk)" },
  { token: "amber", label: "Amber", cssVar: "var(--c-amber)" },
  { token: "plum", label: "Plum", cssVar: "var(--c-plum)" },
  { token: "sand", label: "Sand", cssVar: "var(--c-sand)" },
] as const;

export type ProductionColorToken =
  (typeof PRODUCTION_COLOR_PALETTE)[number]["token"];

const TOKEN_TO_VAR: Record<string, string> = Object.fromEntries(
  PRODUCTION_COLOR_PALETTE.map((c) => [c.token, c.cssVar]),
);

// Keep accepting legacy "var(--c-clay)" strings written by earlier builds
const VAR_TO_TOKEN: Record<string, string> = Object.fromEntries(
  PRODUCTION_COLOR_PALETTE.map((c) => [c.cssVar, c.token]),
);

export function isValidProductionColor(
  value: unknown,
): value is ProductionColorToken {
  return typeof value === "string" && value in TOKEN_TO_VAR;
}

function normalizeColor(raw: string | null): ProductionColorToken | null {
  if (!raw) return null;
  if (raw in TOKEN_TO_VAR) return raw as ProductionColorToken;
  if (raw in VAR_TO_TOKEN) return VAR_TO_TOKEN[raw] as ProductionColorToken;
  return null;
}

/**
 * Deterministic palette fallback for productions that haven't picked a color.
 * Stable per-id so reorders don't shuffle.
 */
export function fallbackColorTokenForId(id: string): ProductionColorToken {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PRODUCTION_COLOR_PALETTE[h % PRODUCTION_COLOR_PALETTE.length].token;
}

export function resolveProductionColorToken(production: {
  id: string;
  color: string | null;
}): ProductionColorToken {
  return normalizeColor(production.color) ?? fallbackColorTokenForId(production.id);
}

/** CSS color value (e.g. `"var(--c-clay)"`) for a token. Use in inline `style`. */
export function colorVarForToken(token: ProductionColorToken): string {
  return TOKEN_TO_VAR[token];
}

/** Convenience: resolve a production directly to its CSS color value. */
export function resolveProductionColor(production: {
  id: string;
  color: string | null;
}): string {
  return colorVarForToken(resolveProductionColorToken(production));
}
