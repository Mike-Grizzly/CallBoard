import { db } from "@/db";
import { calls } from "@/db/schema";
import { and, eq, gte, asc, inArray } from "drizzle-orm";

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
