# Branding — how the product's colours work

The brand is **three themes that share one accent** (spotlight amber), from the
"Brand Color Explorer" handoff (`handoff/handoff 2/proscene-brand-tokens/`):

| App theme (`data-theme`) | Handoff name | Character |
|---|---|---|
| **light** (`:root`) | Proscene | warm paper canvas + **dark ink side rail** |
| **dusk** | Proscene Medium | **split**: ink canvas + paper `.card` tiles |
| **dark** | Proscene Dark | full ink surfaces |

All three use the **same amber accent** `#E0A23A`, and text on a filled accent
button is the **dark ink** `#15181F` in *every* theme (amber is light, so dark
text clears WCAG AA on it — even in dark mode).

The theme switcher is in **Settings → Appearance** (light / dusk / dark / system).

---

## Where the colours live

- **`app/brand-tokens.css`** — the **accent** (shared by all three themes *and*
  the marketing site). This is the single knob for "what colour is the brand."
- **`app/globals.css`** theme blocks — each theme's **surfaces, ink, borders, and
  rail** values (`:root` = light, `body[data-theme="dusk"]`, `body[data-theme="dark"]`).
- **`app/(marketing)/marketing.css`** — the marketing site's own always-light
  neutrals (slightly lighter paper than the app), but it reads the **shared amber
  accent** so the brand colour can never drift between app and site.

Everything in the app reads these through semantic tokens (`var(--accent)`,
`var(--ink)`, `var(--bg)`, `var(--on-accent)`, `var(--rail-bg)`, …). There are no
hardcoded brand colours in component CSS — keep it that way.

---

## To change the accent colour (the common rebrand)

Edit the seeds in **`app/brand-tokens.css`**:

```css
--brand-accent:            #E0A23A;  /* the accent — buttons, links, active   */
--brand-accent-on:         #15181F;  /* text/icon ON a filled accent button   */
--brand-accent-soft-light: #F6E7C7;  /* soft tint on paper (light theme/cards)*/
--brand-accent-ink-light:  #9A6716;  /* accent text on paper                  */
--brand-accent-soft-dark:  #3A2E16;  /* soft tint on ink (dusk/dark)          */
--brand-accent-ink-dark:   #E9BC6C;  /* accent text on ink                    */
```

Save — every theme and the marketing site update at once.

### The one rule: text-on-accent contrast
`--brand-accent-on` must be legible on `--brand-accent` (aim for **4.5:1** in a
contrast checker). Amber is light, so its on-accent is **dark**. If you switch to
a **dark** accent (e.g. a navy), change `--brand-accent-on` to **white**.

## To change a theme's surfaces / ink / rail

Edit that theme's block in `app/globals.css` (`:root` for light, or the
`body[data-theme="dusk"|"dark"]` blocks). Each block defines `--bg`, `--bg-elev`,
`--ink*`, `--border*`, and the `--rail-*` set. The values came verbatim from the
handoff's `proscene-themes.css`, so that file is the reference if you re-tune.

### The dark ink rail
The side rail is dark ink in **every** theme. It doesn't have its own component
rules per colour — the `.rail` selector remaps the general tokens to the
`--rail-*` set inside its own scope, so the existing rail markup renders dark
automatically. To recolour the rail, edit the `--rail-*` values in the theme
blocks.

### The split "Medium" (dusk) theme
Dusk is a **split**: the page canvas is ink, but `.card` tiles flip back to paper
(`body[data-theme="dusk"] .card { … }` in `globals.css`). **Only `.card`
surfaces flip** — elevated surfaces that aren't `.card` (some drawers, menus,
inputs) stay on the ink canvas by design. If a surface should read as a paper
tile in Medium mode, give it the `.card` class.

---

## What updates automatically vs. what doesn't

**Automatic** (reads the tokens): every colour on every app screen (all three
themes) and every marketing page — buttons, links, pills, avatars, rings,
surfaces, borders, text, the rail.

**NOT automatic** (image assets, not CSS):
- Logo SVGs — `public/brand-paper.svg`, `public/brand-ink.svg`, and the marketing
  wordmark `app/(marketing)/_components/brand-mark.tsx`. Replace these if the mark
  changes.
- One small decorative logo badge uses a fixed `amber → dark-red` gradient
  (`linear-gradient` near `--accent` in `globals.css`) — check it if you move far
  from amber.

---

## After a rebrand — verify
1. `npm run build`.
2. View the app in **all three themes** (Settings → Appearance) — check the rail,
   a few `.card` tiles, and filled accent buttons for legible text.
3. Glance at the **marketing site** (it keeps its own light neutrals + shares the
   accent).
4. Record the change in `docs/decision-log.md`.
