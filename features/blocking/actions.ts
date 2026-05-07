"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { stageConfigurations, blockingPositions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

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
