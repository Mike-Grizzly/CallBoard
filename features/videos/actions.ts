"use server";

import { db } from "@/db";
import { rehearsalVideos, videoTimestampNotes } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { assertCanMutate } from "@/features/billing/guard";
import { parseVideoUrl } from "./validation";
import {
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_NOTE_LENGTH,
} from "./constants";

export type VideoActionResult = { error?: string; success?: boolean };

/** Add a YouTube/Vimeo link to a production's video library. */
export async function createVideo(
  formData: FormData,
): Promise<VideoActionResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "videos:create")) {
    return { error: "You don't have permission to add videos." };
  }

  const productionId = formData.get("production_id") as string;
  const title = (formData.get("title") as string)?.trim();
  const url = (formData.get("url") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const recordedDate = (formData.get("recorded_date") as string)?.trim() || null;

  if (!productionId || !title || !url) {
    return { error: "A title and video link are required." };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: `Title must be ${MAX_TITLE_LENGTH} characters or less.` };
  }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less.`,
    };
  }

  const parsed = parseVideoUrl(url);
  if (!parsed) {
    return { error: "Enter a valid YouTube or Vimeo link." };
  }

  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to this production." };
  }

  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  await db.insert(rehearsalVideos).values({
    productionId,
    createdBy: user.id,
    title,
    description,
    url,
    provider: parsed.provider,
    videoId: parsed.videoId,
    embedHash: parsed.embedHash,
    recordedDate,
  });

  revalidatePath("/productions");
  return { success: true };
}

export async function deleteVideo(
  formData: FormData,
): Promise<VideoActionResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "videos:create")) {
    return { error: "You don't have permission to remove videos." };
  }

  const videoId = formData.get("video_id") as string;
  if (!videoId) return { error: "Missing video id." };

  const video = await resolveAccessibleVideo(videoId);
  if (!video) return { error: "Video not found." };

  await db
    .update(rehearsalVideos)
    .set({ deletedAt: new Date() })
    .where(eq(rehearsalVideos.id, videoId));

  revalidatePath("/productions");
  return { success: true };
}

/**
 * Persist the runtime the player reports on first load. Idempotent — only
 * writes when the duration is still unknown — so it's safe to call from the
 * client every time a video opens. Open to any production member.
 */
export async function setVideoDuration(
  videoId: string,
  durationSeconds: number,
): Promise<VideoActionResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "videos:view")) {
    return { error: "You don't have permission to view videos." };
  }
  if (!videoId || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return { error: "Invalid duration." };
  }

  const video = await resolveAccessibleVideo(videoId);
  if (!video) return { error: "Video not found." };
  if (video.durationSeconds != null) return { success: true };

  await db
    .update(rehearsalVideos)
    .set({ durationSeconds: Math.round(durationSeconds) })
    .where(
      and(
        eq(rehearsalVideos.id, videoId),
        isNull(rehearsalVideos.durationSeconds),
      ),
    );

  revalidatePath("/productions");
  return { success: true };
}

/** Pin a note to a moment in a video. Any production member may add one. */
export async function addTimestampNote(
  formData: FormData,
): Promise<VideoActionResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "videos:view")) {
    return { error: "You don't have permission to add notes." };
  }

  const videoId = formData.get("video_id") as string;
  const body = (formData.get("body") as string)?.trim();
  const seconds = Number(formData.get("seconds"));

  if (!videoId || !body) {
    return { error: "Note text is required." };
  }
  if (body.length > MAX_NOTE_LENGTH) {
    return { error: `Note must be ${MAX_NOTE_LENGTH} characters or less.` };
  }
  if (!Number.isFinite(seconds) || seconds < 0) {
    return { error: "Invalid timestamp." };
  }

  const video = await resolveAccessibleVideo(videoId);
  if (!video) return { error: "Video not found." };

  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  await db.insert(videoTimestampNotes).values({
    videoId,
    authorId: user.id,
    seconds: Math.round(seconds),
    body,
  });

  revalidatePath("/productions");
  return { success: true };
}

/** Remove a timestamp note. Allowed for its author or a production manager. */
export async function deleteTimestampNote(
  formData: FormData,
): Promise<VideoActionResult> {
  const user = await requireCurrentUser();

  const noteId = formData.get("note_id") as string;
  if (!noteId) return { error: "Missing note id." };

  const [note] = await db
    .select({
      authorId: videoTimestampNotes.authorId,
      videoId: videoTimestampNotes.videoId,
    })
    .from(videoTimestampNotes)
    .where(eq(videoTimestampNotes.id, noteId))
    .limit(1);

  if (!note) return { error: "Note not found." };

  const video = await resolveAccessibleVideo(note.videoId);
  if (!video) return { error: "Note not found." };

  const isAuthor = note.authorId === user.id;
  const isManager = can(user.role, "productions:manage");
  if (!isAuthor && !isManager) {
    return { error: "You can only remove your own notes." };
  }

  await db
    .delete(videoTimestampNotes)
    .where(eq(videoTimestampNotes.id, noteId));

  revalidatePath("/productions");
  return { success: true };
}

/** Client-callable refresh of the notes panel after a mutation. */
export async function fetchTimestampNotes(videoId: string) {
  await requireCurrentUser();
  const { getTimestampNotesByVideo } = await import("./queries");
  return getTimestampNotesByVideo(videoId);
}

/**
 * Load a video and confirm the caller can access its production. Returns null
 * (rather than throwing) so callers fail closed with a generic message.
 */
async function resolveAccessibleVideo(videoId: string) {
  const user = await requireCurrentUser();

  const [video] = await db
    .select({
      productionId: rehearsalVideos.productionId,
      provider: rehearsalVideos.provider,
      videoId: rehearsalVideos.videoId,
      embedHash: rehearsalVideos.embedHash,
      durationSeconds: rehearsalVideos.durationSeconds,
    })
    .from(rehearsalVideos)
    .where(
      and(eq(rehearsalVideos.id, videoId), isNull(rehearsalVideos.deletedAt)),
    )
    .limit(1);

  if (!video) return null;
  if (!(await userCanAccessProduction(user, video.productionId))) return null;

  return video;
}
