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
 * Builds a `<style>` tag body that overrides brand CSS variables for every
 * theme variant. Returns null when no valid colors are supplied.
 *
 * Targeting `body[data-theme]` wins the specificity battle against the
 * per-theme `:root` and `body[data-theme="x"]` rules in globals.css because
 * this `<style>` is injected later in the document.
 */
export function buildBrandStyles(
  primary?: string | null,
  secondary?: string | null,
  highlight?: string | null,
): string | null {
  if (!isValidHex(primary) && !isValidHex(secondary) && !isValidHex(highlight)) {
    return null;
  }

  // Light-mode variable overrides
  const light: string[] = [];
  // Dark/dusk get slightly more opaque soft variants so they're visible on
  // dark backgrounds.
  const dark: string[] = [];

  if (isValidHex(primary)) {
    const onAccent = contrastText(primary);
    const lightSoft = hexToRgba(primary, 0.12);
    const darkSoft = hexToRgba(primary, 0.22);
    light.push(
      `--accent:${primary}`,
      `--accent-soft:${lightSoft}`,
      `--accent-ink:${primary}`,
      `--accent-strong:${primary}`,
      `--on-accent:${onAccent}`,
    );
    dark.push(
      `--accent:${primary}`,
      `--accent-soft:${darkSoft}`,
      `--accent-ink:${primary}`,
      `--accent-strong:${primary}`,
      `--on-accent:${onAccent}`,
    );
  }

  if (isValidHex(secondary)) {
    const onSecondary = contrastText(secondary);
    light.push(
      `--c-sage:${secondary}`,
      `--c-sage-soft:${hexToRgba(secondary, 0.15)}`,
      `--on-secondary:${onSecondary}`,
    );
    dark.push(
      `--c-sage:${secondary}`,
      `--c-sage-soft:${hexToRgba(secondary, 0.22)}`,
      `--on-secondary:${onSecondary}`,
    );
  }

  if (isValidHex(highlight)) {
    const onHighlight = contrastText(highlight);
    light.push(
      `--c-amber:${highlight}`,
      `--c-amber-soft:${hexToRgba(highlight, 0.15)}`,
      `--on-highlight:${onHighlight}`,
    );
    dark.push(
      `--c-amber:${highlight}`,
      `--c-amber-soft:${hexToRgba(highlight, 0.22)}`,
      `--on-highlight:${onHighlight}`,
    );
  }

  const lightBlock = light.map((v) => `  ${v};`).join("\n");
  const darkBlock = dark.map((v) => `  ${v};`).join("\n");

  // body[data-theme] covers all explicit theme variants.
  // body:not([data-theme]) covers the brief moment before the theme script runs.
  return [
    `body[data-theme], body:not([data-theme]) {\n${lightBlock}\n}`,
    `body[data-theme="dark"], body[data-theme="dusk"] {\n${darkBlock}\n}`,
  ].join("\n");
}
