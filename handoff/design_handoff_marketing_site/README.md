# Handoff: Proscene Marketing Website

## Overview
A 6‑page marketing site for **Proscene** — a production-management app for theatre stage managers, cast, crew, and creative teams. The site sells the product (calls, calendar, script, blocking, reports, people, mobile, and AI Script Setup), presents pricing for two buyer types (organizations and individuals), and hosts an FAQ and a blog.

Pages: **Home, Features, Pricing, FAQ, Blog (index), Blog post**.

> **Brand naming note:** the public product brand is **Proscene**. The current HTML wordmark renders it as "ProScene" (capital S). Some internal code/mockups elsewhere say "CallBoard" — never surface that name. Confirm the exact wordmark casing ("Proscene" vs "ProScene") with the team before building; the rest of this doc keeps the casing as it appears in the files.

## About the Design Files
The files in `site/` are **design references created in HTML/CSS/JS** — prototypes showing the intended look and behavior. They are clean, framework-free static pages and are intentionally close to production, but the task is to **recreate them in the target codebase's environment** (e.g. Next.js/React, Astro, Vue, plain static) using that project's established patterns, component conventions, and build tooling. If there is no existing environment, **Astro or Next.js (static export)** suit this content-driven marketing site well.

The shared nav and footer are injected by JavaScript (`site.js`) in the prototype; in a component framework these should become real layout components, and each page's repeated chrome should be a shared layout.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are all specified here and in the files. Recreate the UI faithfully using the codebase's libraries. Exact tokens are in `site/site.css` `:root` (also listed below).

---

## Design Tokens
All tokens live in `site/site.css` under `:root`. Source of truth is that file; reproduced here for convenience.

### Color — "paper & spotlight" (light surfaces) + "house lights down" (dark islands)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#F8F5EF` | Page background (warm paper) |
| `--bg-elev` | `#FFFFFF` | Elevated/white surfaces, cards, nav |
| `--bg-muted` | `#EFEAE0` | Muted section bands |
| `--bg-sunken` | `#E6DECF` | Sunken fills, tracks |
| `--border` | `#E5DCCC` | Hairline borders |
| `--border-strong` | `#D3C7B1` | Stronger borders |
| `--ink` | `#15181F` | Primary text / **dark logo mark** (reads as near-black "dark blue") |
| `--ink-2` | `#3A3F48` | Secondary text |
| `--ink-3` | `#5F636C` | Tertiary text |
| `--ink-4` | `#94908A` | Muted/labels |
| `--night` | `#14171E` | Dark "island" sections + footer |
| `--night-elev` | `#20252F` | Dark cards |
| `--night-border` | `#2D3340` | Dark borders |
| `--night-ink` | `#F5F2EA` | Text on dark |
| `--night-ink-2` | `#C5C8CF` | Secondary text on dark |
| `--night-ink-3` | `#9398A4` | Muted text on dark |
| `--accent` | `#E0A23A` | Spotlight amber (primary accent, CTAs) |
| `--accent-soft` | `#F8E9CB` | Soft amber tint (pills, icon chips) |
| `--accent-ink` | `#9C6B14` | Amber text on light |
| `--accent-bright` | `#ECB04E` | Brighter amber |
| `--on-accent` | `#15181F` | Text on amber buttons |

Categorical tints (used sparingly for feature tags/pills), defined in oklch — see `:root`: `--c-sage`, `--c-amber`, `--c-dusk`, `--c-clay`, `--c-sand`, `--c-plum`, each with a `-soft` companion.

### Color usage / theme rhythm (important)
The site **leans dark but is deliberately mixed** (to differ from the all-dark competitor, callboards.app):
- **Nav: white** (`--bg-elev`, translucent + blur), dark text, **dark ink logo mark**, amber "Start free" button. Bottom hairline border; on scroll the border strengthens.
- **Footer: dark** (`--night`).
- **Home & Features heroes: dark** ("stage" treatment) — a dark gradient background with light text and a light product UI mock that "pops." Home hero uses the `.night` class on the `.hero` section; Features hero (`.dh-hero`) sets a dark gradient via the page's inline `<style>`.
- **Pricing, FAQ, Blog heroes: light/paper**, and most body sections across all pages are light. A few dark "island" sections (`.night`) punctuate the flow (e.g. Home "mobile" + "belief", Features "mobile").

### Spacing / radius / shadows
- Radius: `--radius-s 6px`, `--radius 10px`, `--radius-l 14px`, `--radius-xl 22px`.
- Shadows: `--shadow-1` … `--shadow-4` (soft, warm-tinted) — see `:root`.
- Section padding: `.section` = `clamp(56px,9vw,104px) 0`; `.section-tight` = `clamp(40px,6vw,64px) 0`.
- Container: `--maxw 1180px`; horizontal pad `--pad-x clamp(20px,5vw,40px)` (`.wrap`); narrow container `.wrap-narrow` max 820px.

### Typography
- **Display & UI:** `Inter` (weights 400/500/600/700, plus italics). Loaded via Google Fonts in each page `<head>`.
- **Mono:** `Geist Mono` (400/500) — used for timestamps, eyebrow/labels in product mocks, code-like chrome.
- Tokens: `--font-display`, `--font-ui` (both Inter), `--font-mono` (Geist Mono).
- Key type styles (see `site.css`): `.display` (clamp 40–76px, weight 700, letter-spacing −.03em; on the home hero it's uppercase 800), `h2.title` (clamp 30–48px/700), `h3.subtitle`, `.lede` (clamp 17–20px), `.eyebrow` (12.5px, 600, .14em tracking, uppercase, amber, with a short rule before it; `.no-rule` removes the rule). Italic `<em>` inside display/title is amber.

> Note: the brand board (`/Proscene Brand Board.html` at project root) pairs **Newsreader + Geist**; the shipped site standardized on **Inter + Geist Mono**. Build with Inter + Geist Mono to match the prototypes unless the team says otherwise.

---

## Shared chrome (nav + footer)
Injected by `site/site.js` in the prototype. Recreate as layout components.

**Top nav** (sticky): logo (proscenium-arch SVG mark, **filled `--ink`** in nav + amber wordmark "Pro" + accent "Scene") · primary links **Features, Pricing, Blog, FAQ** · right side **"Sign in"** (text link) + **"Start free"** (amber primary button). Mobile: links collapse into a hamburger menu (`.nav-toggle`). Active page link uses `aria-current="page"`. The logo mark is an inline SVG with a mask cutting three "marquee slats" out of the arch (see `logoMark()` in `site.js`).

**Footer** (dark): brand + blurb, plus 3 link columns — **Product** (Features, Pricing, What's new, Mobile app), **Resources** (Walkthroughs, FAQ, Help center), **Company** (About, Careers, Contact, Book a demo). Bottom row: © year + social icons (Instagram/X/YouTube). Note: there is intentionally **no "Reviews" page** and no "Customer stories" link (removed — see Content Integrity below).

All non-functional links use `data-noop` (JS calls `preventDefault`). Replace with real routes when building.

---

## Screens / Views

### 1. Home (`index.html`)
- **Hero (dark):** eyebrow "For cast, crew & creative teams"; H1 "The one place your *show* lives." (uppercase display); lede; buttons "Start free" (amber) + "Book a demo"; a check note "Free for your first production · No card required". Right: a **browser-window product mock** ("Next call" card: show, time, title "Act II, Stumble Run", confirmations avatars + progress bar 82%, Send call / View day, tab strip). A small floating "3 just confirmed" chip overlaps the window.
- **Problem/Solution (light, white bg):** centered eyebrow "Stop scattering the production", H2, lede, then a 3‑up **values** row: *Cast always know the call* (people icon), *Crew work from one source* (**wrench** icon), *Creative teams stay aligned* (**feather/quill** icon). Icons sit in rounded tinted chips.
- **Feature split 1 — Production calendar (muted bg):** copy + checklist on one side, a calendar `.panel` mock (week rows with colored day pills, a flagged conflict row) on the other. A floating "Conflict caught early" chip.
- **Feature split 2 — Rehearsal reports (white):** flipped split; report `.panel` mock (department-tagged note rows, "Sent to 5 departments · Delivered").
- **How it works (white):** 3 big italic numbered steps (Create the production / Invite the company / Run the room).
- **Mobile (dark `.night`):** copy + checklist + a CSS phone mock (amber header, "Up next" list, "Confirm call ✓").
- **Belief (dark `.night`, joins the mobile block):** eyebrow "Why we built it", large pull-quote "The work is hard enough. Knowing *where to be* shouldn't be.", supporting line. (This replaced a fabricated testimonial.)
- **Final CTA (amber band):** "Your next production is *already late* to load in." + Start free / Book a demo.
- A **STATS band is present but commented out** in the HTML (40k+/1,200/11hrs/4.9) — intentionally hidden until real numbers exist. Do **not** ship it with placeholder numbers.

### 2. Features (`features.html`)
- **Dashboard hero (dark):** eyebrow "The workspace", H1 "Your whole production, *at a glance.*", lede, Start free / Book a demo, check note. Below: a large **"dashboard at a glance"** browser-window mock (greeting band, bento of tiles: focal "Next call", "Today" timeline, "Waiting on you" mentions, then a shows strip). All `.dh-` classes live in `dash-hero.css`.
- **AI Script Setup (marquee feature):** eyebrow + headline "Upload the script. Start with the show already *built.*", checklist, and a **mock review panel** (header "AI Script Setup" with a **scan icon** — *not* a sparkle; a quota pill "4 of 5 analyses left"; a file sub-line; "Cast & characters" rows with Principal/Supporting type tags; "Scene breakdown" rows; "Bookmarks · musical numbers"; Apply to production / Discard; a "Reused a verified breakdown — no AI tokens used." line). Then an **Upload → Review → Apply** 3‑step strip and a "Beta soon" note about per-role line highlighting.
- **Audience switcher + per-tool sections:** a sticky **segmented control** ("For Cast & Crew" / "For Creative Teams") with a contextual jump-nav. Below, tool sections (Stage Management [cast only], Calls, Calendar, Script, Blocking, Reports, People) each with **two copy variants** that swap by audience (CSS-driven via `body[data-segment]`), sharing the same animated demo `.panel`. Final **Mobile** section (dark) is shared. Logic + scrollspy at the bottom of the file; segment persists in `localStorage`.

### 3. Pricing (`pricing.html`)
- **Hero (light):** eyebrow "Pricing", H1 "Pay for the shows *you run.*", lede, then two controls: an **audience segmented control** ("For individuals" [default, first] / "For companies") and a **billing toggle** ("Monthly" [default] / "Annual save ~20%").
- **Companies panel** (`data-aud-panel="companies"`): 3 org tiers — **Season** ($25/mo · $249/yr · 1 production · 100 GB), **Repertory** ($49 · $499 · 3 · 250 GB, flagged "Most popular"), **Company** ($79 · $799 · unlimited · 500 GB). A "Participants are always free" banner, an "Every paid plan includes" feature grid, a full comparison table (Participant / Season / Repertory / Company), and a school-pricing line.
- **Individuals panel** (`data-aud-panel="designers"`): "Proscene Studio" (New · coming soon) — 3 personal tiers: **Single Tool** ($5.99/$59), **Studio** ($9.99/$99, "Best value"), **Studio Pro** ($14.99/$149). Two clarifying notes (solo prep vs. team workspace; org invites stay free). CTAs are "Notify me" (not yet purchasable).
- **Behavior:** segmented control swaps which panel shows (`body[data-aud]`); billing toggle rewrites prices/period/sub-labels from `data-amt-monthly`/`data-amt-annual`/`data-sub-*` attributes. Audience persists in `localStorage` and is deep-linkable via hash (`#individuals` / `#companies`). Defaults: **individuals + monthly**. Both toggles are styled with the same segmented-control + thumb pattern.

### 4. FAQ (`faq.html`)
- Hero with a search input; sticky category sidebar (Getting started, The company, Features, Billing, Data & privacy) with counts + scrollspy; accordion `<details>` Q&A groups; a "Still have a question?" contact card. Client-side search filters questions live. Billing answers reflect the current model (org subscribes, Season/Repertory/Company, 60-day trial starting at first production, Proscene Studio for individuals, discounted school pricing).

### 5. Blog index (`blog.html`)
- Hero + filter tabs (decorative), a featured post, a grid of post cards (striped `.ph` placeholder thumbnails with mono labels for where real images go), a newsletter card. All bylines are "The ProScene team" (no fabricated individuals).

### 6. Blog post (`blog-post.html`)
- Long-form article template ("Set up your first production in ProScene"): hero with back link, meta, title, lede, byline; article body with step headings, callouts, inline `.panel` mocks, a pull-quote, a placeholder cover/screenshot, and a footer with share + a "more posts" row.

---

## Interactions & Behavior
- **Reveal-on-scroll:** elements with `.reveal` fade/translate in via IntersectionObserver, with failsafes (reveal-in-view on load/scroll + a 1.4s timeout that forces everything visible). Respect `prefers-reduced-motion`.
- **Pricing audience switch:** segmented tablist (roving tabindex, arrow/Home/End keys, animated `.aud-thumb`); toggles `body[data-aud]`; persists to `localStorage` (`proscene:pricing:aud`); hash deep-link.
- **Pricing billing toggle:** rewrites `[data-amt-*]`, `[data-per]`, `[data-sub-*]` text; default Monthly.
- **Features audience switch:** identical tablist pattern toggling `body[data-segment]` (`proscene:features:segment`); contextual jump-nav hides links not relevant to the segment; scrollspy highlights the active tool.
- **FAQ:** live search filter over `<details>`; sidebar scrollspy.
- **Feature/animated demos:** scroll-triggered, multi-phase product demos driven by `feature-demos.js` + `feature-demos.css` (`data-demo`, `data-phases`, `data-interval`, `data-rest` attributes). These are decorative product simulations — re-implement as needed or replace with real product screenshots/video.
- **Nav:** sticky; `data-scrolled` toggles the border; mobile hamburger toggles `data-open`.
- All placeholder links carry `data-noop`. Wire real destinations on build (auth `/signup`, `/contact?reason=school`, app links, etc.).

## State
Mostly presentational. Client state needed: pricing audience + billing period; features segment; FAQ search query; nav open/scrolled; reveal observers. Persisted keys: `proscene:pricing:aud`, `proscene:features:segment`. No data fetching in the marketing site.

## Punctuation / copy convention
The copy intentionally contains **no em-dashes (—)**. Keep it that way when editing or adding copy (use commas, colons, or periods).

## Content integrity (do not reintroduce)
This site is **pre-launch**. The following were deliberately removed and must not be re-added without real data: customer logos / "Trusted at" rows, named testimonials/reviews (the entire Reviews page was deleted), usage stats (40k+/1,200/etc., currently commented out), and fabricated customer "stories"/author bylines. Education pricing is "discounted, hand-verified," **not** free. The Designer/Studio tiers are **not yet purchasable** ("coming soon" / "Notify me").

## Assets
- **Logo:** inline SVG, generated in `site.js` (`logoMark()`), a proscenium arch with three masked marquee slats. Mark color is `--ink` in the nav, `--accent` elsewhere by default. No external logo file.
- **Set-piece SVGs:** `site/setpieces/` (bench, rug, table-round, throne, tree) — used in the Blocking ground-plan demo.
- **Icons:** inline SVGs in a lucide-style stroke aesthetic. Notable intentional choices: the AI feature uses a **scan** glyph (deliberately *not* a sparkle/"AI" cliché); Home values use people / **wrench** / **feather** icons.
- **Imagery placeholders:** blog uses striped `.ph` blocks with mono labels (e.g. `reports-feature.jpg`) marking where real images belong. Supply real product imagery on build.
- **Fonts:** Google Fonts — Inter + Geist Mono (linked in each `<head>`). Self-host for production if desired.

## Files (in this bundle, under `site/`)
- `index.html`, `features.html`, `pricing.html`, `faq.html`, `blog.html`, `blog-post.html` — the six pages.
- `site.css` — global tokens + shared components (nav, footer, buttons, pills, cards, hero, sections, dark `.night` islands, reveal, responsive). **Start here.**
- `site.js` — nav + footer injection, logo SVG, reveal observer, noop link handler.
- `dash-hero.css` — Features page dashboard hero (`.dh-` classes).
- `feature-demos.css` / `feature-demos.js` — animated product demos used in feature splits.
- `setpieces/` — ground-plan SVGs.

Each page also has a page-local `<style>` block for layout specific to that page (hero grids, pricing tiers/toggle, faq layout, blog grid, AI section). Read those alongside `site.css`.
