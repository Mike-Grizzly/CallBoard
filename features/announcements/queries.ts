import { db } from "@/db";
import {
  announcements,
  announcementProductions,
  profiles,
  productions,
  productionMemberships,
  organizationMemberships,
  announcementAcks,
} from "@/db/schema";
import {
  eq,
  desc,
  and,
  or,
  inArray,
  count,
  countDistinct,
  ne,
  gte,
  sql,
} from "drizzle-orm";
import { sanitizeHtml } from "@/lib/sanitize";
import { can } from "@/lib/permissions";
import type { Role } from "@/types/roles";
import type { AnnouncementPriority } from "@/db/schema";
import {
  getOrganizationMembers,
  getUserProductionIds,
} from "@/features/members/queries";

/** A production an announcement is broadcast to (for the scope chip + picker). */
export type AnnouncementTarget = {
  id: string;
  title: string;
  slug: string;
  color: string | null;
};

/** Scope derived from the audience: org-wide, several shows, or one show. */
export type AnnouncementScope = "org" | "multi" | "prod";

export function announcementScope(
  orgWide: boolean,
  targetCount: number,
): AnnouncementScope {
  if (orgWide) return "org";
  return targetCount > 1 ? "multi" : "prod";
}

const announcementCore = {
  id: announcements.id,
  title: announcements.title,
  body: announcements.body,
  pinned: announcements.pinned,
  priority: announcements.priority,
  requireAck: announcements.requireAck,
  orgWide: announcements.orgWide,
  createdAt: announcements.createdAt,
  createdById: announcements.createdBy,
  authorFirstName: profiles.firstName,
  authorLastName: profiles.lastName,
  authorEmail: profiles.email,
};

/**
 * Attach each announcement's target productions (the join-table audience).
 * Org-wide announcements have no targets. Done in a single batched query so
 * the list views stay O(1) round-trips.
 */
async function attachTargets<T extends { id: string; orgWide: boolean }>(
  rows: T[],
): Promise<(T & { targets: AnnouncementTarget[] })[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const links = await db
    .select({
      announcementId: announcementProductions.announcementId,
      id: productions.id,
      title: productions.title,
      slug: productions.slug,
      color: productions.color,
    })
    .from(announcementProductions)
    .innerJoin(
      productions,
      eq(announcementProductions.productionId, productions.id),
    )
    .where(inArray(announcementProductions.announcementId, ids))
    .orderBy(productions.title);

  const map = new Map<string, AnnouncementTarget[]>();
  for (const l of links) {
    const arr = map.get(l.announcementId) ?? [];
    arr.push({ id: l.id, title: l.title, slug: l.slug, color: l.color });
    map.set(l.announcementId, arr);
  }
  return rows.map((r) => ({ ...r, targets: map.get(r.id) ?? [] }));
}

/** Announcement ids whose audience includes any of the given productions. */
function announcementIdsTargeting(productionIds: string[]) {
  return db
    .select({ id: announcementProductions.announcementId })
    .from(announcementProductions)
    .where(inArray(announcementProductions.productionId, productionIds));
}

/**
 * Announcements visible on a production page — org-wide ones plus any whose
 * audience includes this production.
 */
export async function getAnnouncementsByProduction(
  productionId: string,
  orgId: string,
) {
  const rows = await db
    .select(announcementCore)
    .from(announcements)
    .innerJoin(profiles, eq(announcements.createdBy, profiles.id))
    .where(
      and(
        eq(announcements.organizationId, orgId),
        or(
          eq(announcements.orgWide, true),
          inArray(announcements.id, announcementIdsTargeting([productionId])),
        ),
      ),
    )
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
  return attachTargets(rows);
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
          eq(announcements.orgWide, true),
          inArray(announcements.id, announcementIdsTargeting([productionId])),
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
    const rows = await db
      .select(announcementCore)
      .from(announcements)
      .innerJoin(profiles, eq(announcements.createdBy, profiles.id))
      .where(eq(announcements.organizationId, orgId))
      .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
    return attachTargets(rows);
  }

  const productionIds = [...(await getUserProductionIds(userId))];

  const audience =
    productionIds.length > 0
      ? or(
          eq(announcements.orgWide, true),
          inArray(announcements.id, announcementIdsTargeting(productionIds)),
        )
      : eq(announcements.orgWide, true);

  const rows = await db
    .select(announcementCore)
    .from(announcements)
    .innerJoin(profiles, eq(announcements.createdBy, profiles.id))
    .where(and(eq(announcements.organizationId, orgId), audience))
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
  return attachTargets(rows);
}

/**
 * Announcements in the user's audience that REQUIRE acknowledgement and that
 * they haven't acknowledged yet — powers the acknowledge banner. Excludes the
 * user's own posts and anything older than 30 days. Audience = org-wide plus
 * announcements targeting a production the user is in.
 */
export async function getUnacknowledgedAnnouncements(
  userId: string,
  orgId: string,
  productionIds: string[],
) {
  const audience =
    productionIds.length > 0
      ? or(
          eq(announcements.orgWide, true),
          inArray(announcements.id, announcementIdsTargeting(productionIds)),
        )
      : eq(announcements.orgWide, true);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      orgWide: announcements.orgWide,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
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
        eq(announcements.requireAck, true),
        ne(announcements.createdBy, userId),
        audience,
        sql`${announcementAcks.id} is null`,
        gte(announcements.createdAt, since),
      ),
    )
    .orderBy(desc(announcements.createdAt))
    .limit(10);

  const withTargets = await attachTargets(rows);
  return withTargets.map((r) => {
    const scopeLabel = r.orgWide
      ? "Company-wide"
      : r.targets.length === 1
        ? r.targets[0].title
        : `${r.targets.length} productions`;
    const href =
      !r.orgWide && r.targets.length === 1
        ? `/productions/${r.targets[0].slug}/announcements`
        : "/announcements";
    return { id: r.id, title: r.title, scopeLabel, href };
  });
}

export type AnnouncementWithMeta = Awaited<
  ReturnType<typeof getAnnouncementsByProduction>
>[number];

export type AnnouncementAckInfo = {
  /** How many people have acknowledged. */
  acked: number;
  /** Audience size: org members (org-wide) or the deduped union of the
   *  targeted productions' members. */
  total: number;
  /** Whether the current user has acknowledged. */
  mine: boolean;
};

/**
 * Acknowledgement rollup for a set of announcements: per-announcement acked
 * count, audience size, and whether the current user has acknowledged. The
 * audience is the org's members for org-wide announcements and the deduped
 * union of the targeted productions' members for scoped ones.
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
        orgWide: announcements.orgWide,
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

  const scopedIds = scopes.filter((s) => !s.orgWide).map((s) => s.id);

  // Deduped union of members across each scoped announcement's productions.
  const scopedTotals: Record<string, number> = {};
  if (scopedIds.length > 0) {
    const rows = await db
      .select({
        announcementId: announcementProductions.announcementId,
        value: countDistinct(productionMemberships.userId),
      })
      .from(announcementProductions)
      .innerJoin(
        productionMemberships,
        eq(
          productionMemberships.productionId,
          announcementProductions.productionId,
        ),
      )
      .where(inArray(announcementProductions.announcementId, scopedIds))
      .groupBy(announcementProductions.announcementId);
    for (const r of rows) scopedTotals[r.announcementId] = r.value;
  }

  const orgTotal = orgRow?.value ?? 0;
  const ackedMap = new Map(ackCounts.map((r) => [r.announcementId, r.value]));
  const mineSet = new Set(myAcks.map((r) => r.announcementId));

  const out: Record<string, AnnouncementAckInfo> = {};
  for (const s of scopes) {
    out[s.id] = {
      acked: ackedMap.get(s.id) ?? 0,
      total: s.orgWide ? orgTotal : (scopedTotals[s.id] ?? 0),
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
  priority: AnnouncementPriority;
  requireAck: boolean;
  scope: AnnouncementScope;
  scopeLabel: string;
  scopeTone: "amber" | "dusk" | "plum";
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
 * Members in an announcement's audience: org members for org-wide, otherwise
 * the deduped union of the targeted productions' members.
 */
async function getAudienceMembers(
  orgWide: boolean,
  orgId: string,
  productionIds: string[],
): Promise<
  { userId: string; firstName: string | null; lastName: string | null; email: string }[]
> {
  if (orgWide) {
    return getOrganizationMembers(orgId);
  }
  if (productionIds.length === 0) return [];
  const rows = await db
    .selectDistinct({
      userId: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      email: profiles.email,
    })
    .from(productionMemberships)
    .innerJoin(profiles, eq(productionMemberships.userId, profiles.id))
    .where(inArray(productionMemberships.productionId, productionIds));
  return rows;
}

/**
 * Full announcement plus its acknowledgement roster, for the detail drawer.
 * Returns null if the announcement doesn't exist, isn't in the user's org, or
 * the user isn't in its audience. The roster is the audience (org members for
 * org-wide, the deduped union of the targeted productions' members for scoped)
 * minus the author, each flagged acked/not with a timestamp, acknowledged
 * first.
 */
export async function getAnnouncementDetailForUser(
  userId: string,
  orgId: string,
  role: Role,
  announcementId: string,
): Promise<AnnouncementDetail | null> {
  const [row] = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      priority: announcements.priority,
      requireAck: announcements.requireAck,
      orgWide: announcements.orgWide,
      createdBy: announcements.createdBy,
      createdAt: announcements.createdAt,
      organizationId: announcements.organizationId,
      authorFirst: profiles.firstName,
      authorLast: profiles.lastName,
      authorEmail: profiles.email,
    })
    .from(announcements)
    .innerJoin(profiles, eq(announcements.createdBy, profiles.id))
    .where(eq(announcements.id, announcementId))
    .limit(1);

  if (!row || row.organizationId !== orgId) return null;

  const targetIds = row.orgWide
    ? []
    : (
        await db
          .select({ productionId: announcementProductions.productionId })
          .from(announcementProductions)
          .where(eq(announcementProductions.announcementId, announcementId))
      ).map((r) => r.productionId);

  const canManage = can(role, "productions:manage");
  if (!row.orgWide && !canManage) {
    const prodIds = await getUserProductionIds(userId);
    if (!targetIds.some((id) => prodIds.has(id))) return null;
  }

  const members = await getAudienceMembers(row.orgWide, orgId, targetIds);

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

  const scope = announcementScope(row.orgWide, targetIds.length);
  let scopeLabel: string;
  let scopeTone: "amber" | "dusk" | "plum";
  if (scope === "org") {
    scopeLabel = "Company-wide";
    scopeTone = "amber";
  } else if (scope === "multi") {
    scopeLabel = `${targetIds.length} productions`;
    scopeTone = "plum";
  } else {
    // Single production — look up its title for the label.
    const [prod] = await db
      .select({ title: productions.title })
      .from(productions)
      .where(eq(productions.id, targetIds[0]))
      .limit(1);
    scopeLabel = prod?.title ?? "Production";
    scopeTone = "dusk";
  }

  return {
    id: row.id,
    title: row.title,
    bodyHtml: row.body ? sanitizeHtml(row.body) : "",
    priority: row.priority as AnnouncementPriority,
    requireAck: row.requireAck,
    scope,
    scopeLabel,
    scopeTone,
    authorName,
    createdAtIso: row.createdAt.toISOString(),
    mineAcked: ackMap.has(userId),
    ackedCount: roster.filter((r) => r.acked).length,
    total: roster.length,
    roster,
  };
}

/** A targetable production for the composer audience picker. */
export type ComposerProduction = {
  id: string;
  title: string;
  slug: string;
  status: string;
  color: string | null;
  members: number;
};

/**
 * Active (non-archived) productions with member counts, for the composer's
 * audience picker, plus the org's distinct member count (the org-wide reach).
 */
export async function getComposerAudience(orgId: string): Promise<{
  productions: ComposerProduction[];
  orgMemberCount: number;
}> {
  const [prods, [orgRow]] = await Promise.all([
    db
      .select({
        id: productions.id,
        title: productions.title,
        slug: productions.slug,
        status: productions.status,
        color: productions.color,
        members: count(productionMemberships.id),
      })
      .from(productions)
      .leftJoin(
        productionMemberships,
        eq(productionMemberships.productionId, productions.id),
      )
      .where(
        and(
          eq(productions.organizationId, orgId),
          sql`${productions.archivedAt} is null`,
        ),
      )
      .groupBy(productions.id)
      .orderBy(desc(productions.createdAt)),
    db
      .select({ value: count() })
      .from(organizationMemberships)
      .where(eq(organizationMemberships.organizationId, orgId)),
  ]);

  return {
    productions: prods,
    orgMemberCount: orgRow?.value ?? 0,
  };
}

/**
 * Deduped audience members for the post-time notification fan-out: org members
 * for org-wide, otherwise the union of the targeted productions' members.
 */
export async function getFanoutAudience(
  orgWide: boolean,
  orgId: string,
  productionIds: string[],
): Promise<
  { userId: string; email: string; firstName: string | null; lastName: string | null }[]
> {
  const members = await getAudienceMembers(orgWide, orgId, productionIds);
  return members.map((m) => ({
    userId: m.userId,
    email: m.email,
    firstName: m.firstName,
    lastName: m.lastName,
  }));
}
