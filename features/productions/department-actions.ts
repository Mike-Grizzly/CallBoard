"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { productionDepartments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { can } from "@/lib/permissions";

export type DepartmentActionResult = { error?: string };

export type DepartmentInput = { key: string; label: string };

/**
 * Replace a production's department set. Used by the Settings tab to
 * add/remove/rename/reorder departments. Order is taken from the array; the
 * whole set is rewritten in one transaction (the set is small).
 */
export async function saveProductionDepartments(
  productionId: string,
  items: DepartmentInput[],
): Promise<DepartmentActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "productions:manage")) {
    return { error: "You don't have permission to manage this production." };
  }
  if (!productionId) return { error: "Missing production." };
  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to this production." };
  }

  // Sanitize: trim, drop blank keys, dedupe by key, cap the label length.
  const seen = new Set<string>();
  const rows: { productionId: string; key: string; label: string; sortOrder: number }[] = [];
  for (const item of items) {
    const key = (item.key ?? "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    rows.push({
      productionId,
      key,
      label: (item.label ?? "").trim().slice(0, 80),
      sortOrder: rows.length,
    });
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(productionDepartments)
      .where(eq(productionDepartments.productionId, productionId));
    if (rows.length > 0) {
      await tx.insert(productionDepartments).values(rows);
    }
  });

  revalidatePath(`/productions`);
  return {};
}
