import { db } from "@/db";
import {
  announcements,
  profiles,
  productions,
  productionMemberships,
  organizationMemberships,
  announcementAcks,
} from "@/db/schema";
import { eq, desc, and, or, isNull, inArray, count, ne, gte } from "drizzle-orm";
import { sanitizeHtml } from "@/lib/sanitize";
import { can } from "@/lib/permissions";
import {
  getOrganizationMembers,
  getProductionMembers,
  getUserProductionIds,
} from "@/features/members/queries";

const announcementFields = {
  id: announcements.id,
  title: announcements.title,
  body: announcements.body,
  pinned: announcements.pinned,
  createdAt: announcements.createdAt,
  productionId: announcements.productionId,
  createdById: announcements.createdBy,
  authorFirstName: profiles.firstName,
  authorLastName: profiles.lastName,
  authorEmail: profiles.email,
  productionTitle: productions.title,
};

export async function getAnnouncementsByProduction(productionId: string, orgId: string) {
  return db
    .select(announcementFields)
    .from(announcements)
    .innerJoin(profiles, eq(announcements.createdBy, profiles.id))
    .leftJoin(productions, eq(announcements.productionId, productions.id))
    .where(
      and(
        eq(announcements.organizationId, orgId),
        or(
          eq(announcements.productionId, productionId),
          isNull(announcements.productionId),
        ),
      ),
    )
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
}

/**
 * Count of announcements visible on a production page — the production's
 * own plus org-wide ones. Used for the tab badge.
 */
export async function getAnnouncementCountByProduction(
  productionId: string,
  orgId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(announcements)
    .where(
      and(
        eq(announcements.organizationId, orgId),
        or(
          eq(announcements.productionId, productionId),
          isNull(announcements.productionId),
        ),
      ),
    );
  return row?.value ?? 0;
}

export async function getAnnouncementsForUser(
  userId: string,
  orgId: string,
  canManageProductions: boolean,
) {
  if (canManageProductions) {
    return db
      .select(announcementFields)
      .from(announcements)
      .innerJoin(profiles, eq(announcements.createdBy, profiles.id))
      .leftJoin(productions, eq(announcements.productionId, productions.id))
      .where(eq(announcements.organizationId, orgId))
      .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
  }

  const memberships = await db
    .select({ productionId: productionMemberships.productionId })
    .from(productionMemberships)
    .where(eq(productionMemberships.userId, userId));

  const productionIds = memberships.map((m) => m.productionId);

  return db
    .select(announcementFields)
    .from(announcements)
    .innerJoin(profiles, eq(announcements.createdBy, profiles.id))
    .leftJoin(productions, eq(announcements.productionId, productions.id))
    .where(
      and(
        eq(announcements.organizationId, orgId),
        productionIds.length > 0
          ? or(isNull(announcements.productionId), inArray(announcements.productionId, productionIds))
          : isNull(announcements.productionId),
      ),
    )
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
}

/**
 * Announcements in the user's audience that they haven't acknowledged yet —
 * powers the acknowledge banner. Excludes the user's own posts and anything
 * older than 30 days (so enabling acks doesn't resurface ancient notices).
 * Audience = org-wide (null production) plus productions the user is in.
 */
export async function getUnacknowledgedAnnouncements(
  userId: string,
  orgId: string,
  productionIds: string[],
) {
  const audience =
    productionIds.length > 0
      ? or(
          isNull(announcements.productionId),
          inArray(announcements.productionId, productionIds),
        )
      : isNull(announcements.productionId);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      productionId: announcements.productionId,
      productionTitle: productions.title,
      productionSlug: productions.slug,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .leftJoin(productions, eq(announcements.productionId, productions.id))
    .leftJoin(
      announcementAcks,
      and(
        eq(announcementAcks.announcementId, announcements.id),
        eq(announcementAcks.userId, userId),
      ),
    )
    .where(
      and(
        eq(announcements.organizationId, orgId),
        ne(announcements.createdBy, userId),
        audience,
        isNull(announcementAcks.id),
        gte(announcements.createdAt, since),
      ),
    )
    .orderBy(desc(announcements.createdAt))
    .limit(10);
}

export type AnnouncementWithMeta = Awaited<
  ReturnType<typeof getAnnouncementsByProduction>
>[number];

export type AnnouncementAckInfo = {
  /** How many people have acknowledged. */
  acked: number;
  /** Audience size: org members (org-wide) or production members (scoped). */
  total: number;
  /** Whether the current user has acknowledged. */
  mine: boolean;
};

/**
 * Acknowledgement rollup for a set of announcements: per-announcement acked
 * count, audience size, and whether the current user has acknowledged. The
 * audience is the org's members for org-wide announcements (null production)
 * and the production's members for production-scoped ones.
 */
export async function getAckInfoForAnnouncements(
  announcementIds: string[],
  userId: string,
  orgId: string,
): Promise<Record<string, AnnouncementAckInfo>> {
  if (announcementIds.length === 0) return {};

  const [scopes, ackCounts, myAcks, [orgRow]] = await Promise.all([
    db
      .select({
        id: announcements.id,
        productionId: announcements.productionId,
      })
      .from(announcements)
      .where(inArray(announcements.id, announcementIds)),
    db
      .select({
        announcementId: announcementAcks.announcementId,
        value: count(),
      })
      .from(announcementAcks)
      .where(inArray(announcementAcks.announcementId, announcementIds))
      .groupBy(announcementAcks.announcementId),
    db
      .select({ announcementId: announcementAcks.announcementId })
      .from(announcementAcks)
      .where(
        and(
          eq(announcementAcks.userId, userId),
          inArray(announcementAcks.announcementId, announcementIds),
        ),
      ),
    db
      .select({ value: count() })
      .from(organizationMemberships)
      .where(eq(organizationMemberships.organizationId, orgId)),
  ]);

  const productionIds = [
    ...new Set(scopes.map((s) => s.productionId).filter((p): p is string => !!p)),
  ];
  const prodTotals: Record<string, number> = {};
  if (productionIds.length > 0) {
    const rows = await db
      .select({
        productionId: productionMemberships.productionId,
        value: count(),
      })
      .from(productionMemberships)
      .where(inArray(productionMemberships.productionId, productionIds))
      .groupBy(productionMemberships.productionId);
    for (const r of rows) prodTotals[r.productionId] = r.value;
  }

  const orgTotal = orgRow?.value ?? 0;
  const ackedMap = new Map(ackCounts.map((r) => [r.announcementId, r.value]));
  const mineSet = new Set(myAcks.map((r) => r.announcementId));

  const out: Record<string, AnnouncementAckInfo> = {};
  for (const s of scopes) {
    out[s.id] = {
      acked: ackedMap.get(s.id) ?? 0,
      total: s.productionId ? prodTotals[s.productionId] ?? 0 : orgTotal,
      mine: mineSet.has(s.id),
    };
  }
  return out;
}

export type AnnouncementRosterEntry = {
  userId: string;
  name: string;
  initials: string;
  acked: boolean;
  ackedAtIso: string | null;
  isMe: boolean;
};

export type AnnouncementDetail = {
  id: string;
  title: string;
  bodyHtml: string;
  scopeLabel: string;
  scopeTone: "amber" | "dusk";
  authorName: string;
  createdAtIso: string;
  mineAcked: boolean;
  ackedCount: number;
  total: number;
  roster: AnnouncementRosterEntry[];
};

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b || name[0] || "?").toUpperCase();
}

/**
 * Full announcement plus its acknowledgement roster, for the detail drawer.
 * Returns null if the announcement doesn't exist, isn't in the user's org, or
 * the user isn't in its audience. The roster is the audience (org members for
 * org-wide, production members for scoped) minus the author, each flagged
 * acked/not with a timestamp, acknowledged first.
 */
export async function getAnnouncementDetailForUser(
  userId: string,
  orgId: string,
  role: string,
  announcementId: string,
): Promise<AnnouncementDetail | null> {
  const [row] = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      productionId: announcements.productionId,
      createdBy: announcements.createdBy,
      createdAt: announcements.createdAt,
      organizationId: announcements.organizationId,
      authorFirst: profiles.firstName,
      authorLast: profiles.lastName,
      authorEmail: profiles.email,
      productionTitle: productions.title,
    })
    .from(announcements)
    .innerJoin(profiles, eq(announcements.createdBy, profiles.id))
    .leftJoin(productions, eq(announcements.productionId, productions.id))
    .where(eq(announcements.id, announcementId))
    .limit(1);

  if (!row || row.organizationId !== orgId) return null;

  const canManage = can(role, "productions:manage");
  if (row.productionId && !canManage) {
    const prodIds = await getUserProductionIds(userId);
    if (!prodIds.has(row.productionId)) return null;
  }

  const members: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  }[] = row.productionId
    ? await getProductionMembers(row.productionId)
    : await getOrganizationMembers(orgId);

  const acks = await db
    .select({
      userId: announcementAcks.userId,
      ackedAt: announcementAcks.ackedAt,
    })
    .from(announcementAcks)
    .where(eq(announcementAcks.announcementId, announcementId));
  const ackMap = new Map(acks.map((a) => [a.userId, a.ackedAt]));

  const roster: AnnouncementRosterEntry[] = members
    .filter((m) => m.userId !== row.createdBy)
    .map((m) => {
      const name =
        `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.email;
      const ackedAt = ackMap.get(m.userId) ?? null;
      return {
        userId: m.userId,
        name,
        initials: nameInitials(name),
        acked: !!ackedAt,
        ackedAtIso: ackedAt ? ackedAt.toISOString() : null,
        isMe: m.userId === userId,
      };
    });

  roster.sort((a, b) => {
    if (a.acked !== b.acked) return a.acked ? -1 : 1;
    if (a.acked && b.acked)
      return (a.ackedAtIso ?? "").localeCompare(b.ackedAtIso ?? "");
    return a.name.localeCompare(b.name);
  });

  const authorName =
    `${row.authorFirst ?? ""} ${row.authorLast ?? ""}`.trim() ||
    row.authorEmail;

  return {
    id: row.id,
    title: row.title,
    bodyHtml: row.body ? sanitizeHtml(row.body) : "",
    scopeLabel: row.productionId
      ? (row.productionTitle ?? "Production")
      : "Company-wide",
    scopeTone: row.productionId ? "dusk" : "amber",
    authorName,
    createdAtIso: row.createdAt.toISOString(),
    mineAcked: ackMap.has(userId),
    ackedCount: roster.filter((r) => r.acked).length,
    total: roster.length,
    roster,
  };
}
