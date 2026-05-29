"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { productions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  validateProductionForm,
  type ProductionFormErrors,
} from "./validation";
import { createDefaultFolders } from "@/features/documents/actions";

export type ProductionMutationResult = {
  error?: string;
  success?: boolean;
};

export type CreateProductionResult = {
  errors?: ProductionFormErrors;
  error?: string;
};

export async function createProduction(
  _prevState: CreateProductionResult | undefined,
  formData: FormData,
): Promise<CreateProductionResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "productions:manage")) {
    return { error: "You don't have permission to create productions." };
  }

  const { data, errors } = validateProductionForm(formData);

  if (errors) {
    return { errors };
  }

  const [newProduction] = await db
    .insert(productions)
    .values({
      organizationId: user.organizationId,
      title: data!.title,
      slug: data!.slug,
      status: data!.status,
      color: data!.color,
      openingDate: data!.openingDate,
      closingDate: data!.closingDate,
    })
    .returning({ id: productions.id });

  await createDefaultFolders(newProduction.id);

  redirect("/productions");
}

/**
 * Soft-archive a production. Hides it from the workspace's default
 * lists and from the rail, but preserves all downstream records
 * (reports, calls, blocking, documents) so it can be restored intact.
 *
 * Org-scoped: we only touch productions in the caller's current
 * workspace, so a stale id from a different org is a no-op.
 */
export async function archiveProduction(
  productionId: string,
): Promise<ProductionMutationResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "productions:manage")) {
    return { error: "You don't have permission to archive productions." };
  }
  if (!productionId) return { error: "Missing production." };

  const result = await db
    .update(productions)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(productions.id, productionId),
        eq(productions.organizationId, user.organizationId),
      ),
    )
    .returning({ id: productions.id });

  if (result.length === 0) {
    return { error: "Production not found in this workspace." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function unarchiveProduction(
  productionId: string,
): Promise<ProductionMutationResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "productions:manage")) {
    return { error: "You don't have permission to restore productions." };
  }
  if (!productionId) return { error: "Missing production." };

  const result = await db
    .update(productions)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(productions.id, productionId),
        eq(productions.organizationId, user.organizationId),
      ),
    )
    .returning({ id: productions.id });

  if (result.length === 0) {
    return { error: "Production not found in this workspace." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
