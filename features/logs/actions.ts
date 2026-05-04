"use server";

import { db } from "@/db";
import { productionLogs } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export type SaveLogResult = {
  error?: string;
  success?: boolean;
};

export async function saveProductionLog(
  _prevState: SaveLogResult | undefined,
  formData: FormData,
): Promise<SaveLogResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to edit logs." };
  }

  const productionId = formData.get("production_id") as string;
  const content = formData.get("content") as string;

  if (!productionId) {
    return { error: "Missing production." };
  }

  const existing = await db
    .select()
    .from(productionLogs)
    .where(
      and(
        eq(productionLogs.productionId, productionId),
        eq(productionLogs.userId, user.id),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(productionLogs)
      .set({ content: content ?? "", updatedAt: new Date() })
      .where(eq(productionLogs.id, existing[0].id));
  } else {
    await db.insert(productionLogs).values({
      productionId,
      userId: user.id,
      content: content ?? "",
    });
  }

  return { success: true };
}
