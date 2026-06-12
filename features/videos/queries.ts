import { db } from "@/db";
import { rehearsalVideos, videoTimestampNotes, profiles } from "@/db/schema";
import { and, eq, asc, desc, isNull, count } from "drizzle-orm";

/** Library list for a production (newest first), with author + note counts. */
export async function getVideosByProduction(productionId: string) {
  const noteCounts = db
    .select({
      videoId: videoTimestampNotes.videoId,
      value: count().as("note_count"),
    })
    .from(videoTimestampNotes)
    .groupBy(videoTimestampNotes.videoId)
    .as("note_counts");

  return db
    .select({
      id: rehearsalVideos.id,
      title: rehearsalVideos.title,
      description: rehearsalVideos.description,
      url: rehearsalVideos.url,
      provider: rehearsalVideos.provider,
      videoId: rehearsalVideos.videoId,
      embedHash: rehearsalVideos.embedHash,
      recordedDate: rehearsalVideos.recordedDate,
      durationSeconds: rehearsalVideos.durationSeconds,
      createdAt: rehearsalVideos.createdAt,
      createdByFirstName: profiles.firstName,
      createdByLastName: profiles.lastName,
      createdByEmail: profiles.email,
      noteCount: noteCounts.value,
    })
    .from(rehearsalVideos)
    .innerJoin(profiles, eq(rehearsalVideos.createdBy, profiles.id))
    .leftJoin(noteCounts, eq(noteCounts.videoId, rehearsalVideos.id))
    .where(
      and(
        eq(rehearsalVideos.productionId, productionId),
        isNull(rehearsalVideos.deletedAt),
      ),
    )
    .orderBy(desc(rehearsalVideos.createdAt));
}

/** Non-deleted video count for a production (tab badge). */
export async function getVideoCountByProduction(
  productionId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(rehearsalVideos)
    .where(
      and(
        eq(rehearsalVideos.productionId, productionId),
        isNull(rehearsalVideos.deletedAt),
      ),
    );
  return row?.value ?? 0;
}

/** Timestamp notes for one video, earliest position first (panel order). */
export async function getTimestampNotesByVideo(videoId: string) {
  return db
    .select({
      id: videoTimestampNotes.id,
      seconds: videoTimestampNotes.seconds,
      body: videoTimestampNotes.body,
      createdAt: videoTimestampNotes.createdAt,
      authorId: videoTimestampNotes.authorId,
      authorFirstName: profiles.firstName,
      authorLastName: profiles.lastName,
      authorEmail: profiles.email,
    })
    .from(videoTimestampNotes)
    .innerJoin(profiles, eq(videoTimestampNotes.authorId, profiles.id))
    .where(eq(videoTimestampNotes.videoId, videoId))
    .orderBy(asc(videoTimestampNotes.seconds), asc(videoTimestampNotes.createdAt));
}

export type VideoWithMeta = Awaited<
  ReturnType<typeof getVideosByProduction>
>[number];

export type TimestampNoteRow = Awaited<
  ReturnType<typeof getTimestampNotesByVideo>
>[number];
