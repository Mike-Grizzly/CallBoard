"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { productionScenes, sceneBeats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
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

  await db.delete(sceneBeats).where(eq(sceneBeats.id, beatId));

  revalidatePath(`/productions`);
  return {};
}
