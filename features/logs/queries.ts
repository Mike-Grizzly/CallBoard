import { db } from "@/db";
import { productionLogs } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function getProductionLog(productionId: string, userId: string) {
  const results = await db
    .select()
    .from(productionLogs)
    .where(
      and(
        eq(productionLogs.productionId, productionId),
        eq(productionLogs.userId, userId),
      ),
    )
    .limit(1);

  return results[0] ?? null;
}
