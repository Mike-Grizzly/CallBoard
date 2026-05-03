"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { productions } from "@/db/schema";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import {
  validateProductionForm,
  type ProductionFormErrors,
} from "./validation";

export type CreateProductionResult = {
  errors?: ProductionFormErrors;
};

export async function createProduction(
  _prevState: CreateProductionResult | undefined,
  formData: FormData,
): Promise<CreateProductionResult> {
  const { data, errors } = validateProductionForm(formData);

  if (errors) {
    return { errors };
  }

  const org = await getOrCreateDefaultOrganization();

  await db.insert(productions).values({
    organizationId: org.id,
    title: data!.title,
    slug: data!.slug,
    status: data!.status,
    openingDate: data!.openingDate,
    closingDate: data!.closingDate,
  });

  redirect("/productions");
}
