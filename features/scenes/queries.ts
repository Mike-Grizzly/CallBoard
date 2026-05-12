import { db } from "@/db";
import { productionScenes, sceneBeats } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

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
  const result = await Promise.all(
    scenes.map(async (scene) => ({
      ...scene,
      beats: await getBeatsByScene(scene.id),
    })),
  );
  return result;
}

export type SceneWithBeats = Awaited<
  ReturnType<typeof getScenesWithBeats>
>[number];
