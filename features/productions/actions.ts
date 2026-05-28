"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { productions } from "@/db/schema";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  validateProductionForm,
  type ProductionFormErrors,
} from "./validation";
import { createDefaultFolders } from "@/features/documents/actions";

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
