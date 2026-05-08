"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { rehearsalReports, productions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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

  const [{ next }] = await db
    .select({
      next: sql<number>`COALESCE(MAX(${rehearsalReports.reportNumber}), 0) + 1`,
    })
    .from(rehearsalReports)
    .where(eq(rehearsalReports.productionId, productionId));

  await db.insert(rehearsalReports).values({
    productionId,
    createdBy: user.id,
    reportNumber: Number(next),
    reportDate: data!.reportDate,
    generalNotes: data!.generalNotes,
    scheduledCall: data!.scheduledCall,
    actualStart: data!.actualStart,
    endTime: data!.endTime,
    nextRehearsalDate: data!.nextRehearsalDate,
    nextRehearsalTime: data!.nextRehearsalTime,
    nextRehearsalLocation: data!.nextRehearsalLocation,
    nextRehearsalNotes: data!.nextRehearsalNotes,
    deptScenery: data!.departments.deptScenery,
    deptProps: data!.departments.deptProps,
    deptCostumes: data!.departments.deptCostumes,
    deptHairMakeup: data!.departments.deptHairMakeup,
    deptLighting: data!.departments.deptLighting,
    deptSound: data!.departments.deptSound,
    deptSoundEffects: data!.departments.deptSoundEffects,
    deptMusic: data!.departments.deptMusic,
    deptChoreography: data!.departments.deptChoreography,
    deptVideo: data!.departments.deptVideo,
    deptCrew: data!.departments.deptCrew,
    deptOther: data!.departments.deptOther,
  });

  redirect(`/productions/${production[0].slug}/reports`);
}
