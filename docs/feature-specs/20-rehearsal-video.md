# Step 20: Rehearsal Video (link-only embeds + timestamp notes)

## Purpose
Let companies share rehearsal footage with the cast and crew by **linking**
externally hosted videos (YouTube / Vimeo) on a per-production tab, with a
collaborative timestamped-notes panel. The hosting platform stores,
transcodes and streams the bytes, so this adds **no storage or egress cost** —
the deliberate interim before native hosting.

## User story
As a stage manager, I can paste a YouTube or Vimeo link of a rehearsal,
title it, and the cast/crew can watch it embedded on the production page.
Anyone can pin a note to a moment ("12:20 — tempo dragging in the finale");
clicking the note seeks the player to that second.

## Status: IMPLEMENTED (not browser-verified)

## Why link-only (cost context)
Native video hosting is a real feature with its own provider, billing model,
upload pipeline and player — **storage at rest is cheap; egress/bandwidth is
the cost driver** and scales with how much footage is watched. Hosting on
YouTube/Vimeo sidesteps all of it. Native hosting (Mux / Cloudflare Stream
with direct/resumable uploads, transcoding, adaptive-bitrate delivery and a
`videos` storage pipeline) is a future phase; **Download** is intentionally
omitted here because it isn't possible for hosted links.

## Data model (`db/schema/rehearsal-videos.ts`)
- `rehearsal_videos` — `productionId`, `createdBy`, `title`, `description`,
  `url` (verbatim), `provider` (`youtube`|`vimeo`), `videoId` (provider id),
  `embedHash` (Vimeo private/unlisted only), `recordedDate` (optional, "REC"
  badge), `durationSeconds` (filled from the player on first load),
  `createdAt`, `deletedAt` (soft delete).
- `video_timestamp_notes` — `videoId`, `authorId`, `seconds`, `body`,
  `createdAt`.

> **Migration:** the project uses `drizzle-kit push` (no SQL migration files).
> Run `npm run db:push` to create both tables. Equivalent raw SQL is in the
> session notes if applying via the Supabase SQL editor instead.

## Permissions (`lib/permissions.ts`)
Two new capabilities:
- `videos:view` — all roles (admin, producer, director, choreographer,
  stage_manager, cast, crew).
- `videos:create` — admin, producer, director, choreographer, stage_manager
  (leadership + SMs). Governs adding/removing videos.

Timestamp notes are open to **any production member** (`videos:view`); a note
can be deleted by its author or a production manager (`productions:manage`).

## Feature module (`features/videos/`)
- `constants.ts` — pure (no `"use server"`): provider labels, `formatTimecode`,
  `gradientForId` (deterministic library-card colour), length limits.
- `validation.ts` — `parseVideoUrl` (provider + id from all common YouTube/
  Vimeo URL shapes; returns null for anything else), `buildEmbedUrl`,
  `buildShareUrl`. **Embed URLs are built from the validated id/hash — never
  from user-supplied HTML** (sidesteps the documented `dangerouslySetInnerHTML`
  sanitization risk).
- `queries.ts` — `getVideosByProduction` (with note counts), `getVideoCount­ByProduction`
  (tab badge), `getTimestampNotesByVideo`.
- `actions.ts` — `createVideo`/`deleteVideo` (gated `videos:create` + access +
  `assertCanMutate` billing guard), `addTimestampNote`/`deleteTimestampNote`,
  `setVideoDuration` (idempotent, member-callable), `fetchTimestampNotes`
  (client refresh).

## Routes / components
- `app/(app)/productions/[slug]/videos/page.tsx` — server: gates on
  `videos:view` + membership, loads the library and the newest video's notes.
- `videos-client.tsx` — library grid (gradient cards, duration badge, note
  count), now-playing header w/ "REC" badge, 16:9 player, speed cycle,
  share-timestamped-link, timestamp-notes side panel (seek-on-click, add note
  at the live playhead), add-video modal.
- `video-player.tsx` — loads the **YouTube IFrame Player API** / **Vimeo
  Player SDK** via an injected `<script>` (no new npm dependency) and exposes a
  `seekTo` / `getCurrentTime` / `setPlaybackRate` imperative handle.
- Tab registered in `productions/[slug]/layout.tsx` (icon `Clapperboard`, count
  badge) and `production-tabs.tsx` ICON map.

## Known limitations / future
- **No Download** and no true clip trim ("Share clip" copies a timestamped deep
  link) — both require native hosting.
- Library cards use deterministic gradient tiles, not real thumbnails (those
  need a per-provider API call).
- Custom dark scrubber with note markers (from the concept) was deferred — the
  player uses the platforms' native controls.
- Vimeo private videos require the embed allow-list to include the app domain.
