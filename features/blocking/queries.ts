import { db } from "@/db";
import {
  stageConfigurations,
  blockingPositions,
  productionMemberships,
  profiles,
  customSetPieces,
  beatArrows,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function getStageConfiguration(productionId: string) {
  const rows = await db
    .select()
    .from(stageConfigurations)
    .where(eq(stageConfigurations.productionId, productionId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getBlockingPositionsForBeat(beatId: string) {
  return db
    .select()
    .from(blockingPositions)
    .where(eq(blockingPositions.beatId, beatId));
}

export async function getCastMembers(productionId: string) {
  const rows = await db
    .select({
      membershipId: productionMemberships.id,
      userId: productionMemberships.userId,
      role: productionMemberships.role,
      characterName: productionMemberships.characterName,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      email: profiles.email,
    })
    .from(productionMemberships)
    .innerJoin(profiles, eq(productionMemberships.userId, profiles.id))
    .where(
      and(
        eq(productionMemberships.productionId, productionId),
        eq(productionMemberships.role, "cast"),
      ),
    );
  return rows;
}

export type CastMember = Awaited<ReturnType<typeof getCastMembers>>[number];

export async function getCustomSetPieces(productionId: string) {
  return db
    .select()
    .from(customSetPieces)
    .where(eq(customSetPieces.productionId, productionId))
    .orderBy(asc(customSetPieces.createdAt));
}

export type CustomSetPieceRow = Awaited<ReturnType<typeof getCustomSetPieces>>[number];

export async function getArrowsForBeat(beatId: string) {
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
    .where(eq(beatArrows.beatId, beatId))
    .orderBy(asc(beatArrows.createdAt));
}
