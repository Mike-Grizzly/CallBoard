"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { stageConfigurations, blockingPositions, beatComments, profiles, customSetPieces, beatArrows, mentions, sceneBeats, productionScenes, productions } from "@/db/schema";
import type { BeatArrow } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eq, and, asc } from "drizzle-orm";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { pushMentionNotifications } from "@/features/mentions/notify";

export type BlockingActionResult = { error?: string };

export type PositionRow = {
  entityType: string;
  entityId: string;
  xPercent: number;
  yPercent: number;
  rotation: number;
};

export async function fetchBeatPositions(
  beatId: string,
): Promise<PositionRow[]> {
  await requireCurrentUser();
  const rows = await db
    .select({
      entityType: blockingPositions.entityType,
      entityId: blockingPositions.entityId,
      xPercent: blockingPositions.xPercent,
      yPercent: blockingPositions.yPercent,
      rotation: blockingPositions.rotation,
    })
    .from(blockingPositions)
    .where(eq(blockingPositions.beatId, beatId));
  return rows;
}

// ─── Stage Configuration ────────────────────────────────────────────

// Server-issued signed upload URL for the rasterized ground-plan image
// that the setup wizard generates client-side from the chosen PDF page.
// We rasterize once at setup so the blocking canvas can render an <img>
// instead of running pdf.js on every load — fixes iOS Safari OOM and
// makes desktop loads faster too.
export async function requestGroundPlanImageUpload(
  productionId: string,
): Promise<{ error?: string; path?: string; token?: string }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to configure the stage." };
  }
  if (!productionId) return { error: "Production ID is required." };

  const storagePath = `ground-plans/${productionId}/${Date.now()}.jpg`;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return { error: error?.message ?? "Could not start upload." };
  }
  return { path: data.path, token: data.token };
}

// Returns a 1-hour signed URL for the rasterized ground plan, used by
// the blocking page to render the floor plan as a static <img>.
export async function getGroundPlanImageUrl(
  storagePath: string,
): Promise<string> {
  if (!storagePath) return "";
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? "";
}

export async function saveStageConfiguration(
  _prev: BlockingActionResult | undefined,
  formData: FormData,
): Promise<BlockingActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to configure the stage." };
  }

  const productionId = formData.get("production_id") as string;
  const prosceniumWidthFt = parseFloat(
    formData.get("proscenium_width_ft") as string,
  );
  const stageDepthFt = parseFloat(formData.get("stage_depth_ft") as string);
  const groundPlanDocumentId =
    (formData.get("ground_plan_document_id") as string) || null;
  const calibrationX1 = parseFloat(
    formData.get("calibration_x1") as string,
  );
  const calibrationY1 = parseFloat(
    formData.get("calibration_y1") as string,
  );
  const calibrationX2 = parseFloat(
    formData.get("calibration_x2") as string,
  );
  const calibrationY2 = parseFloat(
    formData.get("calibration_y2") as string,
  );
  const pixelsPerFoot = parseFloat(
    formData.get("pixels_per_foot") as string,
  );
  const groundPlanPage = parseInt(
    (formData.get("ground_plan_page") as string) || "1",
    10,
  );
  const groundPlanImagePath =
    (formData.get("ground_plan_image_path") as string) || null;

  if (!productionId) return { error: "Missing production ID." };
  if (isNaN(prosceniumWidthFt) || prosceniumWidthFt <= 0)
    return { error: "Proscenium width must be a positive number." };
  if (isNaN(stageDepthFt) || stageDepthFt <= 0)
    return { error: "Stage depth must be a positive number." };

  const existing = await db
    .select({ id: stageConfigurations.id })
    .from(stageConfigurations)
    .where(eq(stageConfigurations.productionId, productionId))
    .limit(1);

  const values = {
    productionId,
    prosceniumWidthFt,
    stageDepthFt,
    groundPlanDocumentId,
    calibrationX1: isNaN(calibrationX1) ? null : calibrationX1,
    calibrationY1: isNaN(calibrationY1) ? null : calibrationY1,
    calibrationX2: isNaN(calibrationX2) ? null : calibrationX2,
    calibrationY2: isNaN(calibrationY2) ? null : calibrationY2,
    pixelsPerFoot: isNaN(pixelsPerFoot) ? null : pixelsPerFoot,
    groundPlanPage: isNaN(groundPlanPage) || groundPlanPage < 1 ? 1 : groundPlanPage,
    groundPlanImagePath,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db
      .update(stageConfigurations)
      .set(values)
      .where(eq(stageConfigurations.id, existing[0].id));
  } else {
    await db.insert(stageConfigurations).values(values);
  }

  revalidatePath(`/productions`);
  return {};
}

// ─── Blocking Positions ─────────────────────────────────────────────

export type SavePositionPayload = {
  beatId: string;
  entityType: "actor" | "set_piece";
  entityId: string;
  xPercent: number;
  yPercent: number;
  rotation?: number;
};

export async function saveBlockingPosition(
  payload: SavePositionPayload,
): Promise<BlockingActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to edit blocking." };
  }

  const { beatId, entityType, entityId, xPercent, yPercent, rotation = 0 } =
    payload;

  const existing = await db
    .select({ id: blockingPositions.id })
    .from(blockingPositions)
    .where(
      and(
        eq(blockingPositions.beatId, beatId),
        eq(blockingPositions.entityType, entityType),
        eq(blockingPositions.entityId, entityId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(blockingPositions)
      .set({ xPercent, yPercent, rotation, updatedBy: user.id, updatedAt: new Date() })
      .where(eq(blockingPositions.id, existing[0].id));
  } else {
    await db.insert(blockingPositions).values({
      beatId,
      entityType,
      entityId,
      xPercent,
      yPercent,
      rotation,
      updatedBy: user.id,
    });
  }

  return {};
}

export async function removeBlockingPosition(
  beatId: string,
  entityType: string,
  entityId: string,
): Promise<BlockingActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to edit blocking." };
  }

  await db
    .delete(blockingPositions)
    .where(
      and(
        eq(blockingPositions.beatId, beatId),
        eq(blockingPositions.entityType, entityType),
        eq(blockingPositions.entityId, entityId),
      ),
    );

  return {};
}

// ─── Beat Comments ──────────────────────────────────────────────────

export async function getBeatComments(beatId: string) {
  await requireCurrentUser();
  return db
    .select({
      id: beatComments.id,
      beatId: beatComments.beatId,
      createdBy: beatComments.createdBy,
      body: beatComments.body,
      mentionedUserIds: beatComments.mentionedUserIds,
      createdAt: beatComments.createdAt,
      authorFirstName: profiles.firstName,
      authorLastName: profiles.lastName,
      authorEmail: profiles.email,
    })
    .from(beatComments)
    .innerJoin(profiles, eq(beatComments.createdBy, profiles.id))
    .where(eq(beatComments.beatId, beatId))
    .orderBy(asc(beatComments.createdAt));
}

export type BeatCommentWithAuthor = Awaited<ReturnType<typeof getBeatComments>>[number];

export type CreateBeatCommentPayload = {
  beatId: string;
  body: string;
  mentionedUserIds: string[];
};

export async function createBeatComment(
  payload: CreateBeatCommentPayload,
): Promise<BlockingActionResult & { id?: string }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:view")) {
    return { error: "You don't have permission to comment here." };
  }

  const { beatId, body, mentionedUserIds } = payload;
  const trimmed = body.trim();
  if (!trimmed) return { error: "Comment cannot be empty." };
  if (trimmed.length > 2000) return { error: "Comment is too long." };

  const [row] = await db
    .insert(beatComments)
    .values({
      beatId,
      createdBy: user.id,
      body: trimmed,
      mentionedUserIds,
    })
    .returning({ id: beatComments.id });

  // Surface @mentions on the recipients' dashboards. Beat comments carry the
  // mentioned user ids explicitly (not data-id HTML), so write the mention
  // rows directly. Resolve the production/org from the beat's scene.
  const recipients = [...new Set(mentionedUserIds)].filter(
    (id) => id && id !== user.id,
  );
  if (recipients.length > 0) {
    const [prod] = await db
      .select({
        productionId: productions.id,
        organizationId: productions.organizationId,
      })
      .from(sceneBeats)
      .innerJoin(
        productionScenes,
        eq(sceneBeats.sceneId, productionScenes.id),
      )
      .innerJoin(productions, eq(productionScenes.productionId, productions.id))
      .where(eq(sceneBeats.id, beatId))
      .limit(1);

    if (prod) {
      const snippet = trimmed
        .replace(/@\{([^}]+)\}/g, "@$1")
        .slice(0, 200);
      await db.insert(mentions).values(
        recipients.map((mentionedUserId) => ({
          organizationId: prod.organizationId,
          productionId: prod.productionId,
          mentionedUserId,
          mentionedById: user.id,
          contextType: "blocking",
          contextId: row.id,
          contextTitle: "Blocking note",
          snippet,
        })),
      );
      await pushMentionNotifications({
        mentionedById: user.id,
        countsByUser: Object.fromEntries(recipients.map((id) => [id, 1])),
        contextLabel: "a blocking note",
      });
      revalidatePath("/dashboard");
    }
  }

  revalidatePath("/productions");
  return { id: row.id };
}

export async function deleteBeatComment(
  commentId: string,
): Promise<BlockingActionResult> {
  const user = await requireCurrentUser();

  const existing = await db
    .select({ createdBy: beatComments.createdBy })
    .from(beatComments)
    .where(eq(beatComments.id, commentId))
    .limit(1);

  if (!existing[0]) return { error: "Comment not found." };

  const isOwner = existing[0].createdBy === user.id;
  const canModerate = can(user.role, "blocking:edit");

  if (!isOwner && !canModerate) {
    return { error: "You don't have permission to delete this comment." };
  }

  await db.delete(beatComments).where(eq(beatComments.id, commentId));
  await db
    .delete(mentions)
    .where(
      and(
        eq(mentions.contextType, "blocking"),
        eq(mentions.contextId, commentId),
      ),
    );
  revalidatePath("/productions");
  revalidatePath("/dashboard");
  return {};
}

// ─── Custom Set Pieces ───────────────────────────────────────────────

export type CustomSetPieceClient = {
  id: string;
  name: string;
  storagePath: string;
  fileType: string;
  imageUrl: string;
};

export async function getCustomSetPieceUrls(
  productionId: string,
): Promise<Record<string, string>> {
  const user = await requireCurrentUser();
  if (!(await userCanAccessProduction(user, productionId))) return {};

  const pieces = await db
    .select({ storagePath: customSetPieces.storagePath })
    .from(customSetPieces)
    .where(eq(customSetPieces.productionId, productionId));

  if (pieces.length === 0) return {};

  const supabase = await createSupabaseServerClient();
  const entries = await Promise.all(
    pieces.map(async ({ storagePath }) => {
      const { data } = await supabase.storage
        .from("attachments")
        .createSignedUrl(storagePath, 3600);
      return [storagePath, data?.signedUrl ?? ""] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function requestCustomSetPieceUpload(
  productionId: string,
  fileName: string,
  contentType: string,
  fileSize: number,
): Promise<{ error?: string; path?: string; token?: string }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to upload set pieces." };
  }

  if (!productionId) return { error: "Production ID is required." };
  if (!fileName || fileSize <= 0) return { error: "No file selected." };

  const allowed = ["image/svg+xml", "image/png", "image/jpeg"];
  if (!allowed.includes(contentType)) {
    return { error: "Only SVG, PNG, and JPG files are supported." };
  }
  if (fileSize > 5 * 1024 * 1024) {
    return { error: "File must be under 5 MB." };
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `set-pieces/${productionId}/${Date.now()}-${safeName}`;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return { error: error?.message ?? "Could not start upload." };
  }

  return { path: data.path, token: data.token };
}

export async function finalizeCustomSetPieceUpload(input: {
  productionId: string;
  storagePath: string;
  fileName: string;
  name?: string;
}): Promise<{ error?: string; piece?: CustomSetPieceClient }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to upload set pieces." };
  }

  if (!input.productionId || !input.storagePath) {
    return { error: "Upload could not be completed." };
  }
  if (!input.storagePath.startsWith(`set-pieces/${input.productionId}/`)) {
    return { error: "Upload could not be verified." };
  }

  const fileType = input.fileName.split(".").pop()?.toLowerCase() ?? "png";
  const name = input.name?.trim() || input.fileName.replace(/\.[^.]+$/, "");

  const [row] = await db
    .insert(customSetPieces)
    .values({
      productionId: input.productionId,
      name,
      storagePath: input.storagePath,
      fileType,
      uploadedBy: user.id,
    })
    .returning();

  const supabase = await createSupabaseServerClient();
  const { data: urlData } = await supabase.storage
    .from("attachments")
    .createSignedUrl(input.storagePath, 3600);

  revalidatePath("/productions");
  return {
    piece: {
      id: row.id,
      name: row.name,
      storagePath: row.storagePath,
      fileType: row.fileType,
      imageUrl: urlData?.signedUrl ?? "",
    },
  };
}

export async function deleteCustomSetPiece(
  pieceId: string,
): Promise<{ error?: string }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to delete set pieces." };
  }

  const [piece] = await db
    .select()
    .from(customSetPieces)
    .where(eq(customSetPieces.id, pieceId))
    .limit(1);
  if (!piece) return { error: "Set piece not found." };

  const supabase = await createSupabaseServerClient();
  await supabase.storage.from("attachments").remove([piece.storagePath]);
  await db.delete(customSetPieces).where(eq(customSetPieces.id, pieceId));

  revalidatePath("/productions");
  return {};
}

// ─── Beat Arrows ────────────────────────────────────────────────────

export async function fetchBeatArrows(beatId: string) {
  await requireCurrentUser();
  return db
    .select({
      id: beatArrows.id,
      fromX: beatArrows.fromX,
      fromY: beatArrows.fromY,
      toX: beatArrows.toX,
      toY: beatArrows.toY,
      color: beatArrows.color,
    })
    .from(beatArrows)
    .where(eq(beatArrows.beatId, beatId));
}

export async function createBeatArrow(
  beatId: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
): Promise<{ arrow?: { id: string; fromX: number; fromY: number; toX: number; toY: number; color: string }; error?: string }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to add arrows." };
  }
  const [arrow] = await db
    .insert(beatArrows)
    .values({ beatId, fromX, fromY, toX, toY, color })
    .returning({
      id: beatArrows.id,
      fromX: beatArrows.fromX,
      fromY: beatArrows.fromY,
      toX: beatArrows.toX,
      toY: beatArrows.toY,
      color: beatArrows.color,
    });
  return { arrow };
}

export async function deleteBeatArrow(
  arrowId: string,
): Promise<{ error?: string }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to delete arrows." };
  }
  await db.delete(beatArrows).where(eq(beatArrows.id, arrowId));
  return {};
}
