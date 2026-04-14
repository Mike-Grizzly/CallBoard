# Show Portal

A lightweight production portal for small theatre companies — a single shared
workspace per show for communication, reports, documents, schedules, and
role-based visibility.

This repository is the MVP. It is being built in vertical slices per the
product tech packet. The current phase is **Phase 1: Foundation and app shell**.

---

## Tech stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript (strict)
- **UI**: Tailwind CSS v4 + local shadcn-style primitives + lucide-react icons
- **Auth / DB / Storage**: Supabase (auth wired in Phase 2)
- **ORM**: Drizzle (`drizzle-kit push` workflow during MVP)
- **Deployment target**: Vercel-ready; local-only during MVP development

---

## Project structure

```
app/
  (app)/                 Route group for the authenticated shell (no real auth yet)
    layout.tsx           Shared app shell (topbar + sidebar)
    dashboard/           Placeholder page
    productions/         Placeholder page
    reports/             Placeholder page
    documents/           Placeholder page
    announcements/       Placeholder page
    activity/            Placeholder page
    settings/            Placeholder page (admin-only later)
  layout.tsx             Root HTML layout
  page.tsx               Redirects to /dashboard
  globals.css            Tailwind + theme tokens

components/
  ui/                    Local UI primitives (button, card, separator)
  app-shell/             Topbar, sidebar, nav items, placeholder page

features/                Domain-specific UI/logic (empty in Phase 1)

lib/
  supabase/server.ts     Server-side Supabase client (Server Components / Actions)
  supabase/client.ts     Browser-side Supabase client
  permissions.ts         Capability-map skeleton (no enforcement yet)
  utils.ts               cn() helper

db/
  index.ts               Drizzle client
  schema/                Drizzle tables (organizations, productions)

types/
  roles.ts               Fixed role enum

drizzle.config.ts        Drizzle Kit config (uses DATABASE_URL)
```

---

## Environment variables

All four values come from your Supabase project dashboard. Copy
`.env.example` to `.env.local` and fill them in:

| Variable                        | Where to find it                                                  |
| ------------------------------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project Settings → API → Project URL                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` / `public` key                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Project Settings → API → `service_role` key (**server only**)     |
| `DATABASE_URL`                  | Project Settings → Database → Connection string → Transaction pooler URI |

`.env.local` is gitignored.

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in Supabase values
cp .env.example .env.local
# (edit .env.local)

# 3. Push the schema to Supabase
npm run db:push

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should be redirected
to `/dashboard`.

---

## Available scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start Next.js dev server                  |
| `npm run build`     | Production build                          |
| `npm run start`     | Run the production build                  |
| `npm run lint`      | Lint with ESLint                          |
| `npm run db:push`   | Sync Drizzle schema to Supabase Postgres  |
| `npm run db:studio` | Open Drizzle Studio against your database |

---

## Phase 1 manual test checklist

Use this to verify the foundation slice before moving on to Phase 2 (Auth).

1. [ ] `npm install` completes without errors.
2. [ ] `.env.local` exists and contains the four Supabase values.
3. [ ] `npm run db:push` runs successfully. Confirm in the Supabase dashboard
       (Table Editor) that the `organizations` and `productions` tables exist.
4. [ ] `npm run dev` boots without errors.
5. [ ] Visiting `http://localhost:3000/` redirects to `/dashboard`.
6. [ ] The top bar shows "Show Portal" and the sidebar lists:
       Productions, Dashboard, Reports, Documents, Announcements, Activity,
       Settings.
7. [ ] Clicking each sidebar item navigates to a placeholder page, the URL
       updates to the correct path, and the shell stays intact.
8. [ ] The active sidebar item is visually highlighted.
9. [ ] No console errors in the browser or terminal.

### Known limitations (by design)

- No auth — every page is publicly visible during Phase 1.
- No feature logic — every page is a static placeholder.
- `lib/permissions.ts` exists but `can()` always returns `false`. Real
  enforcement is wired up in Phase 3.
- The sidebar collapses to nothing on mobile; a proper mobile drawer will
  arrive with a later UX polish pass.
- Only two tables exist so far (`organizations`, `productions`). Additional
  tables (`rehearsal_reports`, `documents`, `announcements`, `activity_log`,
  memberships, users profile) will be added by their respective feature
  phases, not speculatively.

---

## Contributing

This project is built in strict vertical slices. Before adding a new feature,
read the tech packet and confirm the phase scope with the product owner. Do
not expand schema, permissions, or shared primitives speculatively.
