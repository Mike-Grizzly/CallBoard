import { db } from "@/db";
import {
  stageConfigurations,
  blockingPositions,
  productionMemberships,
  profiles,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
