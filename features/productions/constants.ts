export const PRODUCTION_COLOR_PALETTE = [
  { name: "Clay", value: "var(--c-clay)" },
  { name: "Sage", value: "var(--c-sage)" },
  { name: "Dusk", value: "var(--c-dusk)" },
  { name: "Amber", value: "var(--c-amber)" },
  { name: "Plum", value: "var(--c-plum)" },
  { name: "Sand", value: "var(--c-sand)" },
] as const;

export type ProductionColor = (typeof PRODUCTION_COLOR_PALETTE)[number]["value"];

const ALLOWED = new Set<string>(PRODUCTION_COLOR_PALETTE.map((c) => c.value));

export function isValidProductionColor(value: unknown): value is ProductionColor {
  return typeof value === "string" && ALLOWED.has(value);
}

/**
 * Deterministic palette fallback for productions that haven't picked a color.
 * Stable per-id so reorders don't shuffle.
 */
export function fallbackColorForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PRODUCTION_COLOR_PALETTE[h % PRODUCTION_COLOR_PALETTE.length].value;
}

export function resolveProductionColor(production: {
  id: string;
  color: string | null;
}): string {
  return production.color && isValidProductionColor(production.color)
    ? production.color
    : fallbackColorForId(production.id);
}
