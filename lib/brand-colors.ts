// Brand color injection — converts user-provided hex colors into CSS variable
// overrides that apply across all four app themes (warm/dark/dusk/cool).
//
// Mapping:
//   Primary   → --accent family (buttons, active states, links, focus rings)
//   Secondary → --c-sage family (production status, success indicators)
//   Highlight → --c-amber family (pinned items, announcements, callouts)
//
// Text-on-color (--on-accent etc.) is computed from WCAG relative luminance so
// labels on filled surfaces are always black or white, never illegible.
//
// Injection strategy: inline `style` attribute on a wrapper element. CSS custom
// properties set via inline style always win over stylesheet-defined values —
// no cascade order dependency, no specificity battle with body[data-theme] rules.

function isValidHex(hex: string | null | undefined): hex is string {
  return typeof hex === "string" && /^#[0-9a-fA-F]{6}$/.test(hex);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// WCAG 2.1 relative luminance → pick black or white label text.
export function contrastText(hex: string): "#000000" | "#ffffff" {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.179 ? "#000000" : "#ffffff";
}

/**
 * Returns a plain object of CSS custom property overrides to spread onto a
 * wrapper element's `style` prop. Inline CSS custom properties always win over
 * any stylesheet rule regardless of specificity or source order — this is the
 * most reliable way to override theme variables set by body[data-theme].
 *
 * Returns null when no valid colors are supplied.
 */
export function buildBrandStyle(
  primary?: string | null,
  secondary?: string | null,
  highlight?: string | null,
): Record<string, string> | null {
  const vars: Record<string, string> = {};

  if (isValidHex(primary)) {
    const onAccent = contrastText(primary);
    vars["--accent"] = primary;
    vars["--accent-soft"] = hexToRgba(primary, 0.14);
    vars["--accent-ink"] = primary;
    vars["--accent-strong"] = primary;
    vars["--on-accent"] = onAccent;
  }

  if (isValidHex(secondary)) {
    vars["--c-sage"] = secondary;
    vars["--c-sage-soft"] = hexToRgba(secondary, 0.15);
    vars["--on-secondary"] = contrastText(secondary);
  }

  if (isValidHex(highlight)) {
    vars["--c-amber"] = highlight;
    vars["--c-amber-soft"] = hexToRgba(highlight, 0.15);
    vars["--on-highlight"] = contrastText(highlight);
  }

  return Object.keys(vars).length > 0 ? vars : null;
}
