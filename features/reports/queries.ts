import { db } from "@/db";
import { rehearsalReports, profiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getReportsByProduction(productionId: string) {
  return db
    .select({
      id: rehearsalReports.id,
      reportNumber: rehearsalReports.reportNumber,
      reportDate: rehearsalReports.reportDate,
      generalNotes: rehearsalReports.generalNotes,
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
      reportNumber: rehearsalReports.reportNumber,
      reportDate: rehearsalReports.reportDate,
      scheduledCall: rehearsalReports.scheduledCall,
      actualStart: rehearsalReports.actualStart,
      endTime: rehearsalReports.endTime,
      generalNotes: rehearsalReports.generalNotes,
      scheduleNotes: rehearsalReports.scheduleNotes,
      nextRehearsalDate: rehearsalReports.nextRehearsalDate,
      nextRehearsalTime: rehearsalReports.nextRehearsalTime,
      nextRehearsalLocation: rehearsalReports.nextRehearsalLocation,
      nextRehearsalNotes: rehearsalReports.nextRehearsalNotes,
      deptScenery: rehearsalReports.deptScenery,
      deptProps: rehearsalReports.deptProps,
      deptCostumes: rehearsalReports.deptCostumes,
      deptHairMakeup: rehearsalReports.deptHairMakeup,
      deptLighting: rehearsalReports.deptLighting,
      deptSound: rehearsalReports.deptSound,
      deptSoundEffects: rehearsalReports.deptSoundEffects,
      deptMusic: rehearsalReports.deptMusic,
      deptChoreography: rehearsalReports.deptChoreography,
      deptVideo: rehearsalReports.deptVideo,
      deptCrew: rehearsalReports.deptCrew,
      deptOther: rehearsalReports.deptOther,
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

export type ReportDetail = NonNullable<
  Awaited<ReturnType<typeof getReportById>>
>;

export async function getLatestReportNextCall(productionId: string) {
  const results = await db
    .select({
      id: rehearsalReports.id,
      nextRehearsalDate: rehearsalReports.nextRehearsalDate,
      nextRehearsalTime: rehearsalReports.nextRehearsalTime,
      nextRehearsalLocation: rehearsalReports.nextRehearsalLocation,
    })
    .from(rehearsalReports)
    .where(eq(rehearsalReports.productionId, productionId))
    .orderBy(desc(rehearsalReports.reportDate))
    .limit(1);
  return results[0] ?? null;
}
