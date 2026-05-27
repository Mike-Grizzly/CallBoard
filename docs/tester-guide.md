# Proscene — Tester Guide

Welcome, and thanks for trying Proscene. This is a closed beta — the
product is feature-complete but has never been used by anyone outside
the developer's hands. Your feedback is what shapes the public launch.

This guide tells you what to try, what's known to be rough, and where
the product is headed.

---

## Getting in

You'll receive an invite email from `noreply@proscene.app` with the
subject line **"You're invited to … on Proscene"**. Click the
**Accept invitation** button. You'll land on a one-click confirm
page, then a welcome screen where you set your password. You're
signed in immediately — no separate "sign up" step.

- The app lives at **https://proscene.app**.
- It works on desktop, tablet, and phone (more on mobile below).
- You can **install it to your home screen** on iOS or Android for an
  app-like experience: in Safari/Chrome, tap Share → Add to Home
  Screen. It launches full-screen with no browser chrome.

If the invite link ever says "expired" or "invalid": the link is
single-use and time-limited. Hit "Resend invite" from the People page
(or ask whoever invited you) to get a fresh one.

---

## What's there to try

The app is organized around your **organization** (your theatre
company), the **productions** inside it, and the **people** who work
on them. Most of the day-to-day work lives inside a production.

### Workspace level (across all productions)

- **Today / Dashboard** — your home base. Shows your next call, your
  productions, recent @mentions, and pinned items.
- **Calendar** — every call across every production you're on, with
  month / week / day / agenda views. Each production has a distinct
  color so the calendar is scannable at a glance.
- **Notes (workspace feed)** — every note you've written across every
  production, newest first. Quick way to find that "follow up about
  costumes" you scribbled three rehearsals ago.
- **People** *(admin/producer only)* — the org directory. Invite new
  members one at a time or via CSV import; assign them to productions
  in bulk.

### Inside a production

- **Overview** — production-level summary, upcoming rehearsals,
  recent announcements, pinned items.
- **Rehearsal Reports** — the daily report flow. Fill out call times,
  attendance, scenes worked, breaks, schedule changes, line notes,
  injuries, department notes, and next-rehearsal info. **Save as
  draft** to keep working on it; **Distribute** flips it final and
  immediately opens the email-recipient picker so you can send it
  out in one flow. File attachments live inline in the form — pick
  one and it'll upload when you save.
- **Calendar (production-scoped)** — the same calendar UI as
  workspace, filtered to this show.
- **My Notes** — private notes for yourself, scoped to this show.
  To-do list + freeform notes with a tag library. Notes are always
  private — only you see them.
- **Your Script** — per-user PDF script viewer with highlights,
  sticky notes, cue markers, and bookmarks. Annotations are private
  to you. Editing is mouse-driven — on phones it's view-only for now.
- **Blocking** — a stage canvas where you place actor tokens and set
  pieces on a ground-plan PDF, per beat, per scene. Director / SM /
  choreographer can edit; everyone else can view. On phones it's
  view-only with swipe to navigate beats.
- **Announcements** — org-wide or production-scoped posts with
  optional pinning. Use `@name` to tag someone — they'll see it on
  their dashboard.
- **Documents** — the file directory for the production, organized
  by category (script, music, design, etc.). Upload, view inline,
  download via signed URL.
- **Members** — who's on this show and what role they play. Admins
  can assign character names to cast.

### Conventions to know

- **@mentions** work inside rehearsal reports (general + department
  notes), announcements, and your private notes. The person you tag
  gets a card on their dashboard.
- **Roles:** admin, producer, director, stage_manager, cast, crew,
  choreographer. Permissions cascade from there — admins do
  everything, cast/crew can view most things and edit very little.
- **Pinning:** you can pin a report, document, announcement, or
  production card to your dashboard for quick access. Hover and
  click the pin icon.

---

## What's known to be rough

These aren't surprises — we know about them. Mentioning them so you
don't waste time reporting them.

- **Touch editing of the blocking canvas and script editor is
  disabled.** Both tools are drag-and-drop / mouse-driven. They work
  fine on tablets with a stylus or mouse, and on desktop. On a phone
  they're view-only — you can navigate beats, see annotations, but
  you can't drop tokens or draw highlights. We're planning real touch
  support after beta.
- **iOS auto-zoom after sign-in.** On iPhone, after you type your
  password and sign in, the whole app sometimes stays zoomed in.
  Pinch out to fix it. We have a fix lined up.
- **Mobile production header / tab strip density** can feel a little
  tight when you're inside a show. Polish pass coming after beta
  surfaces the rest of the rough edges.
- **No dark mode.** Light theme only for now.
- **No offline mode.** The PWA installs and runs like an app, but
  needs a network connection to load fresh data. Service-worker
  offline caching is deferred until testers ask for it.
- **No real-time updates.** If someone else updates a report or
  posts an announcement, you won't see it until you refresh.
- **Email delivery can be slow on first sends.** `proscene.app` is a
  brand-new sending domain — Gmail does extra spam-scoring on it for
  the first few weeks. Sometimes a report email takes 30+ seconds
  to land. The send itself isn't broken; it's just delivery latency.
- **Activity log / document comments / AI script analysis** are
  placeholders. Don't be surprised that those pages don't do anything
  yet.

---

## How to give feedback

**The fastest path:** in the app, open **Settings → Send feedback**
(reachable from the gear icon on the desktop rail, or **More →
Settings** on mobile). It opens an email to `feedback@proscene.app`.

Bug reports help most when they include:

1. **What you were trying to do.** "I was filling out a rehearsal report
   for…"
2. **What you expected to happen.** "…and clicking Distribute should…"
3. **What actually happened.** "…but the button just spun for 10 seconds
   and nothing changed."
4. **Your device + browser.** "iPhone 14, Safari, iOS 17."
5. **A screenshot if it's a UI thing.** Easier than describing.

Feature requests are welcome too — same email. If you're not sure
whether something is a bug or a missing feature, just say what you
tried to do. We'll figure it out.

---

## Rough roadmap — what's expected after beta

Beta is the soft launch. Once we've shaken out the rough edges with
real users, here's the order things are likely to ship in. None of
this is locked — your feedback during beta will reorder it.

### During beta — week 1 (Tier 1)

- **Multi-organization support.** The first beta workspace is a single
  shared org. Within the first week we're opening this up so each
  theatre company gets its own walled-off workspace — your productions,
  people, announcements, and documents are visible only to your team.
  Existing testers will be moved into their own org as part of the
  rollout.
- **Better mobile chrome.** Production header polish, tab-strip
  density, broader review of in-production navigation on phones.
- **Touch editing for blocking + script editor.** Goal is at least
  tablet parity for blocking (stylus-friendly), with phone editing as
  a stretch goal.
- **iOS post-auth zoom reset.** Properly fix the zoomed-in-after-
  sign-in behavior on iPhone.
- **Marketing / landing site at the apex domain.** The product currently
  lives at `proscene.app` — eventually that domain will host a marketing
  page and the app will move to a subpath or subdomain.

### Soon after (Tier 2 — integrations)

- **Documents ↔ rehearsal-report attachments are linked both ways.**
  Pick a file from your Documents directory when attaching to a
  report; have new attachments auto-promote into Documents (with an
  opt-out and a folder picker so they go to the right place).
- **Next Rehearsal ↔ calendar.** The Next Rehearsal block on a
  rehearsal report can pull from the next scheduled call on your
  calendar, OR auto-create a calendar entry when you type one in
  manually. No more double-entering.
- **Email notifications.** Optional email alerts for @mentions and
  new reports / announcements.

### Mid-term (Tier 3)

- **Recurring calls.** Currently every call is a one-off; recurring
  schedules (Tuesday/Thursday 7–10 for 8 weeks) are coming.
- **Real-time live updates.** No more refreshing to see what someone
  else just posted.
- **Document comments.** Threaded comments on individual documents
  (the placeholder is already in the viewer).
- **Production color polish + better calendar legend.**

### Long-term (post-public-launch)

- **Native iOS / Android apps in the App Store and Play Store.**
  Wrapped Proscene in a Capacitor shell so it appears as a real app
  — same codebase, no second app to maintain.
- **Paid plans.** Storage tiers and feature gating around them. The
  free tier will stay viable for small theatre companies.
- **AI script analysis.** Surface characters, scenes, props from a
  script PDF automatically. Schema fields exist (`processingStatus`)
  but no processing logic yet.
- **Activity log.** A unified feed of "what happened in this
  production today." Page exists as a placeholder.

---

## Questions during beta?

Email `feedback@proscene.app` — it forwards to a real inbox and
gets read every day. Thanks for trying it.
