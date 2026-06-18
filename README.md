# Proscene

A lightweight production portal for small theatre companies — one shared
workspace per show for communication, rehearsal reports, documents, schedules,
script tools, and role-based visibility.

Production site: [proscene.app](https://proscene.app)

> **Status:** actively developed. See [`docs/current-status.md`](docs/current-status.md)
> for the authoritative, up-to-date picture of what is built. The high-level
> capability areas below are stable; individual features evolve quickly.

---

## What it does

- **Organizations & productions** — each company gets an org; each show is a
  production with its own members and roles.
- **Roles & permissions** — six roles mapped to capabilities via a central
  `can(role, capability)` check, enforced in both server actions and UI.
- **Rehearsal reports & daily log** — structured reports with rich text and
  file attachments.
- **Document center** — per-production documents with signed-URL downloads.
- **Announcements & notes** — rich-text announcements with read receipts and
  per-production notes/mentions.
- **Script tools** — upload and analyze scripts (cast list, scene breakdown),
  with optional AI assistance.
- **Notifications** — in-app plus optional Web Push (PWA).

---

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript (strict)
- **UI:** Tailwind CSS v4 + local primitives + lucide-react, TipTap rich text
- **Auth / DB / Storage:** Supabase (email/password + Google OAuth)
- **ORM:** Drizzle
- **Email:** Resend
- **Deployment:** Vercel

---

## Architecture at a glance

- Auth and route protection run through `proxy.ts` (not `middleware.ts`).
- Feature code lives in `features/{name}/` with `queries.ts` / `actions.ts`.
- Server actions return typed results, check `can(role, capability)`, and call
  `revalidatePath()`.
- Permission checks happen in **both** server actions (security) and UI (UX).
- Uploaded files live in a single private Supabase Storage bucket
  (`attachments`); access is mediated by short-lived signed URLs.

See [`docs/architecture.md`](docs/architecture.md) for the full picture.

---

## Local setup

This app requires your own Supabase project (and, for the optional features,
Resend / Anthropic / Web Push keys).

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your values
cp .env.example .env.local
# edit .env.local — every variable is documented inline in .env.example

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

All environment variables — required and optional — are documented inline in
[`.env.example`](.env.example). Never commit real secrets; `.env*` is
gitignored.

---

## Available scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start the Next.js dev server              |
| `npm run build`     | Production build                          |
| `npm run start`     | Run the production build                  |
| `npm run lint`      | Lint with ESLint                          |
| `npm run db:push`   | Sync the Drizzle schema to Postgres       |
| `npm run db:studio` | Open Drizzle Studio against your database |

---

## Documentation

The [`docs/`](docs) folder is the persistent project context — architecture,
development rules, feature specs, current status, decisions, and open
questions. `CLAUDE.md` and `AGENTS.md` provide context for AI coding assistants.

---

## License

Copyright (C) 2026 Proscene.

Licensed under the **GNU Affero General Public License v3.0** — see
[`LICENSE`](LICENSE). In short: you're free to use, study, modify, and share
this code, but if you run a modified version as a network service, you must
make your modified source available to its users (AGPL §13).
