# Proscene brand color handoff

Three color themes for the CallBoard / Proscene UI rebrand, extracted verbatim
from `Brand Color Explorer.html`. Hand this folder to Claude Code to recolor the
app.

## Files
- `proscene-themes.css` — drop-in CSS. Each theme is a `[data-theme="…"]` block
  of CSS custom properties. Also includes the split-mode card override.
- `proscene-themes.json` — same values as structured data, for programmatic use
  (Tailwind config, Style Dictionary, theme generators, etc.).

## The three themes
All three share **one accent** — spotlight amber `#E0A23A` — and the **Geist**
display font. They differ only in surface + ink direction:

| Theme            | `data-theme`     | Canvas `--bg` | Text `--ink` | Character |
|------------------|------------------|---------------|--------------|-----------|
| Proscene         | `proscene`       | `#ECE6DA` paper | `#15181F` ink | Warm light UI, dark ink side rail |
| Proscene Medium  | `proscene-mid`   | `#20252F` ink   | `#F5F2EA` paper | **Split**: ink canvas, paper content tiles |
| Proscene Dark    | `proscene-dark`  | `#16191F` ink   | `#F5F2EA` paper | Full dark UI, darkest rail |

## How to apply
```html
<link rel="stylesheet" href="proscene-themes.css">
...
<body data-theme="proscene">          <!-- or proscene-mid / proscene-dark -->
```

The tokens map onto the existing `proscene.css` variable system already used
across the app (`--bg`, `--bg-elev`, `--ink`, `--accent`, `--rail-*`, etc.), so
swapping the `data-theme` value reskins the whole UI without touching component
markup.

## Split-mode note (Proscene Medium only)
`proscene-mid` puts an ink canvas behind **paper content tiles**. The canvas
tokens are dark, but inside `.card` the surface + ink tokens are re-mapped back
to paper so tile interiors read light. `proscene-themes.css` includes this as:

```css
[data-theme="proscene-mid"] .card { --bg:#ECE6DA; --ink:#15181F; /* … */ }
```

If your card/tile component uses a class other than `.card`, point that selector
at the real class name.

## Token groups
- **Surfaces:** `--bg`, `--bg-elev`, `--bg-muted`, `--bg-sunken`
- **Borders:** `--border`, `--border-strong`
- **Text (ink):** `--ink`, `--ink-2`, `--ink-3`, `--ink-4` (primary → faintest)
- **Accent:** `--accent`, `--accent-soft`, `--accent-ink`, `--accent-on`
- **Category softs:** `--c-amber-soft`, `--c-clay-soft`, `--c-sage-soft`, `--c-dusk-soft`
- **Side rail:** `--rail-bg`, `--rail-border`, `--rail-ink`, `--rail-ink-dim`,
  `--rail-active-bg`, `--rail-active-ink`, `--rail-hover-bg`, `--rail-mark-bg`,
  `--rail-mark-ink`, `--rail-accent`
- **Type:** `--font-display` (Geist)
