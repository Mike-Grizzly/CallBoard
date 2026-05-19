import { db } from "@/db";
import { calls, productions, productionMemberships } from "@/db/schema";
import { and, eq, gte, lte, asc, inArray } from "drizzle-orm";

function nowParts() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return { today, currentTime: `${hh}:${mm}` };
}

export async function getNextCall(productionId: string) {
  const { today, currentTime } = nowParts();

  const results = await db
    .select()
    .from(calls)
    .where(
      and(
        eq(calls.productionId, productionId),
        gte(calls.callDate, today),
        eq(calls.status, "scheduled"),
      ),
    )
    .orderBy(asc(calls.callDate), asc(calls.callTime))
    .limit(20);

  for (const call of results) {
    // Skip calls whose end window has already closed today
    if (call.callDate === today && call.endTime && call.endTime <= currentTime) {
      continue;
    }

    const isLive =
      call.callDate === today &&
      (!call.callTime || call.callTime <= currentTime) &&
      (!call.endTime || call.endTime > currentTime);

    return { ...call, isLive };
  }
  return null;
}

export async function getUpcomingCalls(productionId: string, limit = 10) {
  const { today } = nowParts();
  return db
    .select()
    .from(calls)
    .where(
      and(
        eq(calls.productionId, productionId),
        gte(calls.callDate, today),
        eq(calls.status, "scheduled"),
      ),
    )
    .orderBy(asc(calls.callDate), asc(calls.callTime))
    .limit(limit);
}

export async function getAllCallsForProduction(productionId: string) {
  return db
    .select()
    .from(calls)
    .where(eq(calls.productionId, productionId))
    .orderBy(asc(calls.callDate), asc(calls.callTime));
}

export async function getCallById(callId: string) {
  const results = await db
    .select()
    .from(calls)
    .where(eq(calls.id, callId))
    .limit(1);
  return results[0] ?? null;
}

export type ScheduledCall = NonNullable<Awaited<ReturnType<typeof getNextCall>>>;

/**
 * All calls for productions the user is a member of, within a date window.
 * Used by the personal calendar at /calendar.
 *
 * `manageAll` short-circuits the membership filter for admins/producers,
 * who can see every production in the org regardless of membership.
 */
export async function getCallsForUserInRange(args: {
  userId: string;
  organizationId: string;
  startDate: string;
  endDate: string;
  manageAll: boolean;
}) {
  const { userId, organizationId, startDate, endDate, manageAll } = args;

  const baseWhere = and(
    eq(productions.organizationId, organizationId),
    gte(calls.callDate, startDate),
    lte(calls.callDate, endDate),
    eq(calls.status, "scheduled"),
  );

  if (manageAll) {
    return db
      .select({
        id: calls.id,
        productionId: calls.productionId,
        callDate: calls.callDate,
        callTime: calls.callTime,
        endTime: calls.endTime,
        location: calls.location,
        focus: calls.focus,
        productionTitle: productions.title,
        productionSlug: productions.slug,
        productionColor: productions.color,
      })
      .from(calls)
      .innerJoin(productions, eq(calls.productionId, productions.id))
      .where(baseWhere)
      .orderBy(asc(calls.callDate), asc(calls.callTime));
  }

  return db
    .selectDistinct({
      id: calls.id,
      productionId: calls.productionId,
      callDate: calls.callDate,
      callTime: calls.callTime,
      endTime: calls.endTime,
      location: calls.location,
      focus: calls.focus,
      productionTitle: productions.title,
      productionSlug: productions.slug,
      productionColor: productions.color,
    })
    .from(calls)
    .innerJoin(productions, eq(calls.productionId, productions.id))
    .innerJoin(
      productionMemberships,
      eq(productionMemberships.productionId, productions.id),
    )
    .where(and(baseWhere, eq(productionMemberships.userId, userId)))
    .orderBy(asc(calls.callDate), asc(calls.callTime));
}

export type UserCalendarCall = Awaited<
  ReturnType<typeof getCallsForUserInRange>
>[number];

export async function getNextCallsForProductions(
  productionIds: string[],
): Promise<Record<string, ScheduledCall | null>> {
  if (productionIds.length === 0) return {};

  const { today, currentTime } = nowParts();

  const results = await db
    .select()
    .from(calls)
    .where(
      and(
        inArray(calls.productionId, productionIds),
        gte(calls.callDate, today),
        eq(calls.status, "scheduled"),
      ),
    )
    .orderBy(asc(calls.productionId), asc(calls.callDate), asc(calls.callTime));

  const map: Record<string, ScheduledCall | null> = Object.fromEntries(
    productionIds.map((id) => [id, null]),
  );

  for (const id of productionIds) {
    for (const call of results) {
      if (call.productionId !== id) continue;
      if (call.callDate === today && call.endTime && call.endTime <= currentTime) continue;
      const isLive =
        call.callDate === today &&
        (!call.callTime || call.callTime <= currentTime) &&
        (!call.endTime || call.endTime > currentTime);
      map[id] = { ...call, isLive };
      break;
    }
  }

  return map;
}
