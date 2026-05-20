import { db } from "@/db";
import {
  profiles,
  organizationMemberships,
  productionMemberships,
  productions,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveProductionColorToken } from "@/features/productions/constants";
import type { Role } from "@/types/roles";

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

export type DirectoryAssignment = {
  membershipId: string;
  productionId: string;
  productionTitle: string;
  productionSlug: string;
  role: Role;
  characterName: string | null;
  colorToken: string;
};

export type DirectoryPerson = {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  pronouns: string | null;
  status: string;
  role: Role;
  lastActiveAt: Date | null;
  createdAt: Date;
  assignments: DirectoryAssignment[];
};

/**
 * Org-wide people directory: every organization member with their profile,
 * org role, and the productions they're assigned to.
 */
export async function getPeopleDirectory(
  organizationId: string,
): Promise<DirectoryPerson[]> {
  const memberRows = await db
    .select({
      membershipId: organizationMemberships.id,
      userId: profiles.id,
      email: profiles.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      phone: profiles.phone,
      pronouns: profiles.pronouns,
      status: profiles.status,
      lastActiveAt: profiles.lastActiveAt,
      role: organizationMemberships.role,
      createdAt: organizationMemberships.createdAt,
    })
    .from(organizationMemberships)
    .innerJoin(profiles, eq(organizationMemberships.userId, profiles.id))
    .where(eq(organizationMemberships.organizationId, organizationId));

  const assignmentRows = await db
    .select({
      userId: productionMemberships.userId,
      membershipId: productionMemberships.id,
      productionId: productions.id,
      productionTitle: productions.title,
      productionSlug: productions.slug,
      productionColor: productions.color,
      role: productionMemberships.role,
      characterName: productionMemberships.characterName,
    })
    .from(productionMemberships)
    .innerJoin(
      productions,
      eq(productionMemberships.productionId, productions.id),
    )
    .where(eq(productions.organizationId, organizationId));

  const byUser = new Map<string, DirectoryAssignment[]>();
  for (const a of assignmentRows) {
    const list = byUser.get(a.userId) ?? [];
    list.push({
      membershipId: a.membershipId,
      productionId: a.productionId,
      productionTitle: a.productionTitle,
      productionSlug: a.productionSlug,
      role: a.role as Role,
      characterName: a.characterName,
      colorToken: resolveProductionColorToken({
        id: a.productionId,
        color: a.productionColor,
      }),
    });
    byUser.set(a.userId, list);
  }

  return memberRows.map((m) => ({
    membershipId: m.membershipId,
    userId: m.userId,
    email: m.email,
    firstName: m.firstName,
    lastName: m.lastName,
    phone: m.phone,
    pronouns: m.pronouns,
    status: m.status,
    role: m.role as Role,
    lastActiveAt: m.lastActiveAt,
    createdAt: m.createdAt,
    assignments: byUser.get(m.userId) ?? [],
  }));
}
