# Step 1: Foundation & App Shell

## Purpose
Establish the project skeleton: Next.js 16 App Router, app shell layout, routing, placeholder pages, Tailwind v4 theme, UI primitives, and database connection.

## User story
As a developer, I can run the app locally and see a navigable shell with sidebar, topbar, and placeholder pages for all planned features.

## Status: IMPLEMENTED

## Data model
- `organizations` — top-level tenant (single "default" org, lazy-created)
- `productions` — shows/workspaces (title, slug, status, dates)

## Routes/pages
- `/` — redirects to `/dashboard`
- `/dashboard` — placeholder (now personalized dashboard, see Step 4)
- `/productions` — placeholder (now production list, see Step 4)
- `/reports` — placeholder page
- `/documents` — placeholder page
- `/announcements` — placeholder page
- `/activity` — placeholder page
- `/settings` — placeholder (now redirects to `/settings/members`)

## Components
- `components/app-shell/topbar.tsx` — server component, logo, user email, logout
- `components/app-shell/sidebar.tsx` — client component, nav items filtered by capability
- `components/app-shell/nav-items.ts` — nav item definitions with label, href, icon, capability
- `components/app-shell/logout-button.tsx` — form-based logout
- `components/app-shell/placeholder-page.tsx` — generic "coming soon" page
- `components/ui/button.tsx` — Button with variants (default/outline/ghost) and sizes
- `components/ui/card.tsx` — Card family (Card, CardHeader, CardTitle, CardContent, etc.)
- `components/ui/separator.tsx` — horizontal/vertical separator
- `app/(app)/layout.tsx` — app shell layout (fetches user, renders topbar + sidebar + main)
- `app/layout.tsx` — root HTML layout with `suppressHydrationWarning`
- `app/globals.css` — Tailwind v4 with custom theme tokens (light-only)

## Permissions
- Sidebar nav items are filtered by `can(role, capability)` — items without a capability are always shown

## Edge cases
- Sidebar is hidden on mobile (no drawer alternative)
- Browser extensions (e.g., Grammarly) inject attributes on html/body — `suppressHydrationWarning` on root layout prevents console errors

## Manual test checklist
- [ ] `npm run dev` starts without errors
- [ ] Visiting `/` redirects to `/dashboard`
- [ ] Topbar shows "Show Portal" and user email (when logged in)
- [ ] Sidebar shows nav items appropriate to user's role
- [ ] Active sidebar item is highlighted
- [ ] Clicking each nav item navigates to the correct page
- [ ] No console errors in browser or terminal

## Architecture notes to preserve
- `(app)` route group wraps all authenticated pages
- Topbar is a server component (fetches user); sidebar is a client component (active state)
- Nav items defined in `nav-items.ts` with optional `capability` field for gating
- Root layout sets `lang="en"`, `suppressHydrationWarning` on html and body
- Tailwind v4 with CSS custom properties for theming (no tailwind.config file)
