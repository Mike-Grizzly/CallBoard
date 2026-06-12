import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { productions } from "./productions";
import { profiles } from "./users";

/**
 * Rehearsal videos are *links* to externally hosted footage (YouTube /
 * Vimeo), not files in our storage bucket. We persist only metadata + the
 * provider's video id; the platform hosts, transcodes and streams the bytes,
 * so this adds no storage/egress cost. Native hosting (Mux/Cloudflare Stream)
 * is a future phase — see docs/feature-specs.
 */
export const rehearsalVideos = pgTable("rehearsal_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id")
    .notNull()
    .references(() => productions.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  // Original URL the stage manager pasted, kept verbatim for reference.
  url: text("url").notNull(),
  // "youtube" | "vimeo".
  provider: text("provider").notNull(),
  // Provider-native video id (YouTube 11-char id, Vimeo numeric id).
  videoId: text("video_id").notNull(),
  // Vimeo private/unlisted videos carry an embed hash (the `h=` param). Null
  // for YouTube and public Vimeo.
  embedHash: text("embed_hash"),
  // Date the rehearsal was recorded ("REC May 4" badge). Optional.
  recordedDate: date("recorded_date"),
  // Filled in from the player once it loads (getDuration). Lets the library
  // show real runtimes without a server-side API call.
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

/**
 * Timestamped notes pinned to a moment in a video (the right-hand panel in
 * the concept). Collaborative: anyone who can view the production may add
 * one; the player seeks to `seconds` when a note is clicked.
 */
export const videoTimestampNotes = pgTable("video_timestamp_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id")
    .notNull()
    .references(() => rehearsalVideos.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  // Playback position in whole seconds.
  seconds: integer("seconds").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RehearsalVideo = typeof rehearsalVideos.$inferSelect;
export type NewRehearsalVideo = typeof rehearsalVideos.$inferInsert;
export type VideoTimestampNote = typeof videoTimestampNotes.$inferSelect;
