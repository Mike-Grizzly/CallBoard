import { db } from "@/db";
import { callTemplates, type CallTemplate } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function getTemplatesForProduction(
  productionId: string,
): Promise<CallTemplate[]> {
  return db
    .select()
    .from(callTemplates)
    .where(eq(callTemplates.productionId, productionId))
    .orderBy(asc(callTemplates.name));
}

export async function getTemplateById(
  id: string,
): Promise<CallTemplate | null> {
  const rows = await db
    .select()
    .from(callTemplates)
    .where(eq(callTemplates.id, id))
    .limit(1);
  return rows[0] ?? null;
}
