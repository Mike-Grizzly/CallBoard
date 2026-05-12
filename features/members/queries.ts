import { db } from "@/db";
import {
  profiles,
  organizationMemberships,
  productionMemberships,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getOrganizationMembers(organizationId: string) {
  return db
    .select({
      id: organizationMemberships.id,
      userId: profiles.id,
      email: profiles.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      requestedRole: profiles.requestedRole,
      role: organizationMemberships.role,
      createdAt: organizationMemberships.createdAt,
    })
    .from(organizationMemberships)
    .innerJoin(profiles, eq(organizationMemberships.userId, profiles.id))
    .where(eq(organizationMemberships.organizationId, organizationId));
}

export type OrgMember = Awaited<
  ReturnType<typeof getOrganizationMembers>
>[number];

export async function getProductionMembers(productionId: string) {
  return db
    .select({
      id: productionMemberships.id,
      userId: profiles.id,
      email: profiles.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      role: productionMemberships.role,
      characterName: productionMemberships.characterName,
      createdAt: productionMemberships.createdAt,
    })
    .from(productionMemberships)
    .innerJoin(profiles, eq(productionMemberships.userId, profiles.id))
    .where(eq(productionMemberships.productionId, productionId));
}

export type ProductionMember = Awaited<
  ReturnType<typeof getProductionMembers>
>[number];

export async function getProductionMembership(
  userId: string,
  productionId: string,
) {
  const results = await db
    .select()
    .from(productionMemberships)
    .where(
      and(
        eq(productionMemberships.userId, userId),
        eq(productionMemberships.productionId, productionId),
      ),
    )
    .limit(1);

  return results[0] ?? null;
}

export async function getUserProductionIds(userId: string) {
  const rows = await db
    .select({ productionId: productionMemberships.productionId })
    .from(productionMemberships)
    .where(eq(productionMemberships.userId, userId));

  return new Set(rows.map((r) => r.productionId));
}
