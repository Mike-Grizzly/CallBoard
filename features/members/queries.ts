import { db } from "@/db";
import {
  users,
  organizationMemberships,
  productionMemberships,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getOrganizationMembers(organizationId: string) {
  return db
    .select({
      id: organizationMemberships.id,
      userId: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: organizationMemberships.role,
      createdAt: organizationMemberships.createdAt,
    })
    .from(organizationMemberships)
    .innerJoin(users, eq(organizationMemberships.userId, users.id))
    .where(eq(organizationMemberships.organizationId, organizationId));
}

export type OrgMember = Awaited<
  ReturnType<typeof getOrganizationMembers>
>[number];

export async function getProductionMembers(productionId: string) {
  return db
    .select({
      id: productionMemberships.id,
      userId: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: productionMemberships.role,
      createdAt: productionMemberships.createdAt,
    })
    .from(productionMemberships)
    .innerJoin(users, eq(productionMemberships.userId, users.id))
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
