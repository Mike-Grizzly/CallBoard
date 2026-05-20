import { db } from "@/db";
import { productionScenes, sceneBeats } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";

export async function getScenesByProduction(productionId: string) {
  return db
    .select()
    .from(productionScenes)
    .where(eq(productionScenes.productionId, productionId))
    .orderBy(asc(productionScenes.orderIndex));
}

export async function getBeatsByScene(sceneId: string) {
  return db
    .select()
    .from(sceneBeats)
    .where(eq(sceneBeats.sceneId, sceneId))
    .orderBy(asc(sceneBeats.orderIndex));
}

export async function getScenesWithBeats(productionId: string) {
  const scenes = await getScenesByProduction(productionId);
  if (scenes.length === 0) return [];

  const beats = await db
    .select()
    .from(sceneBeats)
    .where(
      inArray(
        sceneBeats.sceneId,
        scenes.map((s) => s.id),
      ),
    )
    .orderBy(asc(sceneBeats.orderIndex));

  const beatsByScene = new Map<string, typeof beats>();
  for (const beat of beats) {
    const list = beatsByScene.get(beat.sceneId);
    if (list) list.push(beat);
    else beatsByScene.set(beat.sceneId, [beat]);
  }

  return scenes.map((scene) => ({
    ...scene,
    beats: beatsByScene.get(scene.id) ?? [],
  }));
}

export type SceneWithBeats = Awaited<
  ReturnType<typeof getScenesWithBeats>
>[number];
