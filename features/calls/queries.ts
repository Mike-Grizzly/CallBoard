import { db } from "@/db";
import { calls } from "@/db/schema";
import { and, eq, gte, asc } from "drizzle-orm";

export async function getNextCall(productionId: string) {
  const today = new Date().toISOString().split("T")[0];
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
    .orderBy(asc(calls.callDate))
    .limit(1);
  return results[0] ?? null;
}

export async function getUpcomingCalls(productionId: string, limit = 10) {
  const today = new Date().toISOString().split("T")[0];
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
    .orderBy(asc(calls.callDate))
    .limit(limit);
}

export async function getCallById(callId: string) {
  const results = await db
    .select()
    .from(calls)
    .where(eq(calls.id, callId))
    .limit(1);
  return results[0] ?? null;
}

export type ScheduledCall = Awaited<ReturnType<typeof getNextCall>>;
