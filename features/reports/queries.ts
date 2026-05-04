import { db } from "@/db";
import { rehearsalReports, profiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getReportsByProduction(productionId: string) {
  return db
    .select({
      id: rehearsalReports.id,
      reportDate: rehearsalReports.reportDate,
      generalNotes: rehearsalReports.generalNotes,
      scheduleNotes: rehearsalReports.scheduleNotes,
      createdAt: rehearsalReports.createdAt,
      createdById: profiles.id,
      createdByEmail: profiles.email,
      createdByFirstName: profiles.firstName,
      createdByLastName: profiles.lastName,
    })
    .from(rehearsalReports)
    .innerJoin(profiles, eq(rehearsalReports.createdBy, profiles.id))
    .where(eq(rehearsalReports.productionId, productionId))
    .orderBy(desc(rehearsalReports.reportDate));
}

export type ReportWithAuthor = Awaited<
  ReturnType<typeof getReportsByProduction>
>[number];

export async function getReportById(reportId: string) {
  const results = await db
    .select({
      id: rehearsalReports.id,
      productionId: rehearsalReports.productionId,
      reportDate: rehearsalReports.reportDate,
      generalNotes: rehearsalReports.generalNotes,
      scheduleNotes: rehearsalReports.scheduleNotes,
      createdAt: rehearsalReports.createdAt,
      createdByEmail: profiles.email,
      createdByFirstName: profiles.firstName,
      createdByLastName: profiles.lastName,
    })
    .from(rehearsalReports)
    .innerJoin(profiles, eq(rehearsalReports.createdBy, profiles.id))
    .where(eq(rehearsalReports.id, reportId))
    .limit(1);

  return results[0] ?? null;
}
