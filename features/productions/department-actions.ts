"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { productionDepartments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionDepartmentRows } from "./queries";
import { resolveDepartments } from "./departments";

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

/**
 * Reorder a production's departments from the rehearsal-report form. Gated on
 * `reports:create` (report managers own the report's structure), NOT the full
 * `productions:manage` — this ONLY reorders. Labels and membership are
 * re-derived server-side from the current department set, so a report manager
 * can't rename, add, or remove departments this way. The persisted order drives
 * both the report form and the distributed report's section order.
 */
export async function reorderProductionDepartments(
  productionId: string,
  orderedKeys: string[],
): Promise<DepartmentActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to reorder departments." };
  }
  if (!productionId) return { error: "Missing production." };
  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to this production." };
  }

  // The current effective department set (stored rows, or the catalog fallback
  // when a production never configured any). Labels come from here, never the
  // client.
  const stored = await getProductionDepartmentRows(productionId);
  const resolved = resolveDepartments(stored);
  const labelByKey = new Map(resolved.map((d) => [d.key, d.label]));

  // New order = the given keys (that actually exist) first, then any the client
  // didn't mention, so nothing is dropped.
  const seen = new Set<string>();
  const orderKeys: string[] = [];
  for (const k of orderedKeys) {
    if (labelByKey.has(k) && !seen.has(k)) {
      seen.add(k);
      orderKeys.push(k);
    }
  }
  for (const d of resolved) {
    if (!seen.has(d.key)) {
      seen.add(d.key);
      orderKeys.push(d.key);
    }
  }

  const rows = orderKeys.map((key, i) => ({
    productionId,
    key,
    label: labelByKey.get(key) ?? key,
    sortOrder: i,
  }));

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
