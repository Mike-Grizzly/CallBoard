"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { productionScenes, sceneBeats, blockingPositions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { assertCanMutate } from "@/features/billing/guard";
import { validateSceneForm, validateBeatForm } from "./validation";

export type SceneActionResult = { error?: string };

export async function createScene(
  _prev: SceneActionResult | undefined,
  formData: FormData,
): Promise<SceneActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to manage scenes." };
  }

  const { data, errors } = validateSceneForm(formData);
  if (errors) return { error: Object.values(errors)[0] };

  if (!(await userCanAccessProduction(user, data!.productionId))) {
    return { error: "You don't have permission to manage scenes." };
  }

  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  await db.insert(productionScenes).values({
    productionId: data!.productionId,
    actNumber: data!.actNumber,
    sceneNumber: data!.sceneNumber,
    title: data!.title,
    orderIndex: data!.orderIndex,
  });

  revalidatePath(`/productions`);
  return {};
}

export async function updateScene(
  _prev: SceneActionResult | undefined,
  formData: FormData,
): Promise<SceneActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to manage scenes." };
  }

  const sceneId = formData.get("scene_id") as string;
  const { data, errors } = validateSceneForm(formData);
  if (errors) return { error: Object.values(errors)[0] };
  if (!sceneId) return { error: "Missing scene ID." };

  const [scene] = await db
    .select({ productionId: productionScenes.productionId })
    .from(productionScenes)
    .where(eq(productionScenes.id, sceneId))
    .limit(1);
  if (!scene) return { error: "Missing scene ID." };
  if (!(await userCanAccessProduction(user, scene.productionId))) {
    return { error: "You don't have permission to manage scenes." };
  }

  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  await db
    .update(productionScenes)
    .set({
      actNumber: data!.actNumber,
      sceneNumber: data!.sceneNumber,
      title: data!.title,
      orderIndex: data!.orderIndex,
    })
    .where(eq(productionScenes.id, sceneId));

  revalidatePath(`/productions`);
  return {};
}

export async function deleteScene(
  _prev: SceneActionResult | undefined,
  formData: FormData,
): Promise<SceneActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to manage scenes." };
  }

  const sceneId = formData.get("scene_id") as string;
  if (!sceneId) return { error: "Missing scene ID." };

  const [scene] = await db
    .select({ productionId: productionScenes.productionId })
    .from(productionScenes)
    .where(eq(productionScenes.id, sceneId))
    .limit(1);
  if (!scene) return { error: "Missing scene ID." };
  if (!(await userCanAccessProduction(user, scene.productionId))) {
    return { error: "You don't have permission to manage scenes." };
  }

  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  await db.delete(productionScenes).where(eq(productionScenes.id, sceneId));

  revalidatePath(`/productions`);
  return {};
}

export async function createBeat(
  _prev: SceneActionResult | undefined,
  formData: FormData,
): Promise<SceneActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to manage beats." };
  }

  const { data, errors } = validateBeatForm(formData);
  if (errors) return { error: Object.values(errors)[0] };

  const [scene] = await db
    .select({ productionId: productionScenes.productionId })
    .from(productionScenes)
    .where(eq(productionScenes.id, data!.sceneId))
    .limit(1);
  if (!scene) return { error: "Missing required fields." };
  if (!(await userCanAccessProduction(user, scene.productionId))) {
    return { error: "You don't have permission to manage beats." };
  }

  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  await db.insert(sceneBeats).values({
    sceneId: data!.sceneId,
    label: data!.label,
    orderIndex: data!.orderIndex,
  });

  revalidatePath(`/productions`);
  return {};
}

export async function updateBeat(
  _prev: SceneActionResult | undefined,
  formData: FormData,
): Promise<SceneActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to manage beats." };
  }

  const beatId = formData.get("beat_id") as string;
  const label = (formData.get("label") as string)?.trim();
  if (!beatId || !label) return { error: "Missing required fields." };

  const [beat] = await db
    .select({ productionId: productionScenes.productionId })
    .from(sceneBeats)
    .innerJoin(productionScenes, eq(sceneBeats.sceneId, productionScenes.id))
    .where(eq(sceneBeats.id, beatId))
    .limit(1);
  if (!beat) return { error: "Missing required fields." };
  if (!(await userCanAccessProduction(user, beat.productionId))) {
    return { error: "You don't have permission to manage beats." };
  }

  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  await db
    .update(sceneBeats)
    .set({ label })
    .where(eq(sceneBeats.id, beatId));

  revalidatePath(`/productions`);
  return {};
}

export async function deleteBeat(
  _prev: SceneActionResult | undefined,
  formData: FormData,
): Promise<SceneActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to manage beats." };
  }

  const beatId = formData.get("beat_id") as string;
  if (!beatId) return { error: "Missing beat ID." };

  const [beat] = await db
    .select({ productionId: productionScenes.productionId })
    .from(sceneBeats)
    .innerJoin(productionScenes, eq(sceneBeats.sceneId, productionScenes.id))
    .where(eq(sceneBeats.id, beatId))
    .limit(1);
  if (!beat) return { error: "Missing beat ID." };
  if (!(await userCanAccessProduction(user, beat.productionId))) {
    return { error: "You don't have permission to manage beats." };
  }

  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  await db.delete(sceneBeats).where(eq(sceneBeats.id, beatId));

  revalidatePath(`/productions`);
  return {};
}

export async function saveBeatNotes(
  beatId: string,
  notes: string,
): Promise<{ error?: string }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to edit beat notes." };
  }
  const [beat] = await db
    .select({ productionId: productionScenes.productionId })
    .from(sceneBeats)
    .innerJoin(productionScenes, eq(sceneBeats.sceneId, productionScenes.id))
    .where(eq(sceneBeats.id, beatId))
    .limit(1);
  if (!beat) return { error: "Beat not found." };
  if (!(await userCanAccessProduction(user, beat.productionId))) {
    return { error: "You don't have permission to edit beat notes." };
  }
  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  await db.update(sceneBeats).set({ notes }).where(eq(sceneBeats.id, beatId));
  revalidatePath(`/productions`);
  return {};
}

export type EnsureFirstBeatResult = {
  sceneId?: string;
  beatId?: string;
  error?: string;
};

// Lazy first-time setup for the blocking canvas. The editor's mental model
// is "place people, then hit Capture Beat" — but every drag/drop handler
// requires an existing beat. Rather than surface that as a setup step, the
// page calls this on load to make sure a scene and beat exist; from the
// user's POV they just open the tool and start placing.
export async function ensureFirstSceneAndBeat(
  productionId: string,
): Promise<EnsureFirstBeatResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to manage scenes." };
  }
  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have permission to manage scenes." };
  }

  const existingScene = await db
    .select({ id: productionScenes.id })
    .from(productionScenes)
    .where(eq(productionScenes.productionId, productionId))
    .orderBy(productionScenes.orderIndex)
    .limit(1);

  let sceneId: string;
  if (existingScene.length > 0) {
    sceneId = existingScene[0].id;
  } else {
    const [scene] = await db
      .insert(productionScenes)
      .values({
        productionId,
        actNumber: 1,
        sceneNumber: 1,
        title: "Scene 1",
        orderIndex: 0,
      })
      .returning({ id: productionScenes.id });
    sceneId = scene.id;
  }

  const existingBeat = await db
    .select({ id: sceneBeats.id })
    .from(sceneBeats)
    .where(eq(sceneBeats.sceneId, sceneId))
    .orderBy(sceneBeats.orderIndex)
    .limit(1);

  if (existingBeat.length > 0) {
    return { sceneId, beatId: existingBeat[0].id };
  }

  const [beat] = await db
    .insert(sceneBeats)
    .values({ sceneId, label: "Beat 1", orderIndex: 0 })
    .returning({ id: sceneBeats.id });

  return { sceneId, beatId: beat.id };
}

export type CaptureNextBeatResult = { beatId?: string; error?: string };

export async function captureNextBeat(
  sceneId: string,
  label: string,
  orderIndex: number,
  sourceBeatId: string | null,
): Promise<CaptureNextBeatResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "blocking:edit")) {
    return { error: "You don't have permission to manage beats." };
  }

  const [scene] = await db
    .select({ productionId: productionScenes.productionId })
    .from(productionScenes)
    .where(eq(productionScenes.id, sceneId))
    .limit(1);
  if (!scene) return { error: "Scene not found." };
  if (!(await userCanAccessProduction(user, scene.productionId))) {
    return { error: "You don't have permission to manage beats." };
  }

  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  const [newBeat] = await db
    .insert(sceneBeats)
    .values({ sceneId, label, orderIndex })
    .returning({ id: sceneBeats.id });

  // Copy positions from the source beat so the new beat starts where the last left off
  if (sourceBeatId) {
    const existing = await db
      .select()
      .from(blockingPositions)
      .where(eq(blockingPositions.beatId, sourceBeatId));

    if (existing.length > 0) {
      await db.insert(blockingPositions).values(
        existing.map((p) => ({
          beatId: newBeat.id,
          entityType: p.entityType,
          entityId: p.entityId,
          xPercent: p.xPercent,
          yPercent: p.yPercent,
          rotation: p.rotation,
          updatedBy: user.id,
        })),
      );
    }
  }

  revalidatePath(`/productions`);
  return { beatId: newBeat.id };
}
