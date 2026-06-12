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

> **Migration:** applied directly to the Supabase `CallBoard` project
> (migration `add_rehearsal_videos_and_timestamp_notes`, 2026-06-12) — both
> tables exist with RLS enabled / no policies, matching the app convention
> (DB access is via the Drizzle pooler connection, which bypasses RLS). No
> `db:push` needed.

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

## Providers
- **YouTube** and **Vimeo** — full experience (embedded player + JS API for
  seek, playhead, speed; timestamp notes work).
- **Google Drive** (added 2026-06-12) — `drive.google.com/file/d/{id}/...`,
  `open?id=`, `uc?id=` links embed via the `/file/d/{id}/preview` player.
  Drive exposes **no JS player API**, so for Drive videos the UI degrades:
  no timestamp notes, no seeking, no speed control. The notes panel is
  replaced with a "Timestamps unavailable — use YouTube/Vimeo" notice, and the
  add-video modal says it works best with YouTube/Vimeo. `supportsTimestampNotes(provider)`
  in `features/videos/constants.ts` is the single switch. Caveats: the Drive
  file must be shared "anyone with the link", and Drive enforces playback
  quotas (not a CDN), so popular files can hit "can't be played right now".

## Known limitations / future
- **No Download** and no true clip trim ("Share clip" copies a timestamped deep
  link; for Drive it copies the file view URL) — both require native hosting.
- Library cards use deterministic gradient tiles, not real thumbnails (those
  need a per-provider API call).
- Custom dark scrubber with note markers (from the concept) was deferred — the
  player uses the platforms' native controls.
- Vimeo private videos require the embed allow-list to include the app domain.
