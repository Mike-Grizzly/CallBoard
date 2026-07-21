# Branding — how to change the product's colours

**One file controls all brand colour: `app/brand-tokens.css`.**

The app and the marketing site both read their colour from the `--brand-*`
"seed" variables defined there. Change a seed, save, and the new colour appears
everywhere at once — every button, link, pill, avatar, and surface across the
app (all themes) and the marketing website. You never edit component CSS to
rebrand.

This exists because an earlier rebrand "didn't spread": the app and marketing
each defined colour independently, so changing one left the other behind. That
can't happen now — there is a single source, and both sides reference it.

---

## The palette today: "paper & spotlight"

| Role | Seed | Value |
|---|---|---|
| Page background | `--brand-paper` | `#F8F5EF` warm off-white |
| Cards / elevated | `--brand-elev` | `#FFFFFF` |
| Muted bands / rail | `--brand-muted` | `#EFEAE0` |
| Primary text | `--brand-ink` | `#15181F` dark blue (near-black) |
| Dark sections / footer | `--brand-night` | `#14171E` |
| **Accent** (buttons, links) | `--brand-accent` | `#E0A23A` spotlight amber |
| Text on an accent button | `--brand-on-accent` | `#15181F` dark ink |

(There are a few more — soft/bright accent tints, secondary inks, night inks.
They're all grouped and commented in the file.)

---

## How to rebrand (the common case: change the accent colour)

1. Open `app/brand-tokens.css`.
2. In the `:root { … }` block, change the **accent** seeds:
   - `--brand-accent` — the main accent (buttons, links, active states).
   - `--brand-accent-strong` — the filled-button background (usually the same
     value as `--brand-accent`).
   - `--brand-accent-soft` — the pale tint used behind pills and icon chips.
   - `--brand-accent-ink` — accent-coloured *text* on a light background.
   - `--brand-on-accent` — the text/icon colour that sits **on** a filled accent
     button. **This is contrast-critical** (see below).
3. Save. That's it — the whole product updates.

To change the neutrals (paper / ink / borders) instead, edit the surface and ink
seeds in the same block the same way.

### The one rule you must respect: text-on-accent contrast

`--brand-on-accent` must be legible on `--brand-accent`.

- If your accent is **light** (like amber), `--brand-on-accent` must be a **dark**
  colour (we use the dark ink). White text on a light accent fails accessibility
  contrast (WCAG AA).
- If your accent is **dark** (like the old crimson, or a navy), `--brand-on-accent`
  should be **white**.

Quick check: paste your accent and your on-accent into any online contrast
checker; you want a ratio of **4.5:1 or higher**.

---

## Light / dusk / dark themes

The app has three themes. They are handled with separate seeds so each can be
tuned independently:

- **Light** uses the main seeds above (`--brand-accent`, `--brand-on-accent`, …).
- **Dusk** uses the `--brand-accent-dusk*` seeds.
- **Dark** uses the `--brand-accent-dark*` seeds.

> **Current state:** light mode is on the amber brand. **Dusk and dark are still
> the old crimson** — placeholders left in place until the dusk/dark brand is
> finalised. When you have those values, replace the `--brand-accent-dusk*` and
> `--brand-accent-dark*` seeds (and flip `--brand-on-accent-dusk` /
> `--brand-on-accent-dark` from white to the dark ink, since the new accent will
> be light). Everything else follows automatically.

The **marketing site is always light** on purpose — it reads the canonical
(never-themed) `--brand-accent`, so a visitor whose app theme is dark will still
see the light marketing site, not a recoloured one. Do not point the marketing
tokens at the dusk/dark seeds.

---

## What updates automatically vs. what doesn't

**Updates automatically** (reads the seeds): every colour on every app screen and
every marketing page — buttons, links, pills, avatars, focus rings, backgrounds,
borders, text.

**Does NOT update automatically** (these are image/asset files, not CSS):

- The logo SVGs — `public/brand-paper.svg`, `public/brand-ink.svg`, and the
  marketing wordmark in `app/(marketing)/_components/brand-mark.tsx`. If the
  rebrand changes the mark itself, replace those assets.
- One small decorative logo badge uses a fixed `amber → dark-red` gradient; if you
  move far from amber, check it still looks right (search `linear-gradient` near
  `--accent` in `app/globals.css`).
- Any raster screenshots in marketing/blog content.

---

## After a rebrand — verify

1. `npm run build` (catches CSS errors).
2. Look at the app in **all three themes** (light / dusk / dark) — the theme
   switch is in Settings → Appearance.
3. Check a few **filled accent buttons** for legible text (the contrast rule
   above), and glance at the **marketing site** to confirm it looks intentional.

Record the change in `docs/decision-log.md`.
