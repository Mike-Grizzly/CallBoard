"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { rehearsalReports, productions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  validateReportForm,
  type ReportFormErrors,
} from "./validation";

export type CreateReportResult = {
  errors?: ReportFormErrors;
  error?: string;
};

export async function createReport(
  _prevState: CreateReportResult | undefined,
  formData: FormData,
): Promise<CreateReportResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to create reports." };
  }

  const productionId = formData.get("production_id") as string;

  if (!productionId) {
    return { error: "Missing production." };
  }

  const production = await db
    .select({ slug: productions.slug })
    .from(productions)
    .where(eq(productions.id, productionId))
    .limit(1);

  if (production.length === 0) {
    return { error: "Production not found." };
  }

  const { data, errors } = validateReportForm(formData);

  if (errors) {
    return { errors };
  }

  await db.insert(rehearsalReports).values({
    productionId,
    createdBy: user.id,
    reportDate: data!.reportDate,
    generalNotes: data!.generalNotes,
    scheduleNotes: data!.scheduleNotes,
  });

  redirect(`/productions/${production[0].slug}/reports`);
}
