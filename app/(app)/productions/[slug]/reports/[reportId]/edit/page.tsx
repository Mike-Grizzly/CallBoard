import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  getProductionBySlug,
  getResolvedDepartments,
} from "@/features/productions/queries";
import { getProductionMembers } from "@/features/members/queries";
import { getReportById } from "@/features/reports/queries";
import { getReportAttachments } from "@/features/reports/attachments";
import {
  getReportAutofillOptions,
  personOptionsFromMembers,
} from "@/features/reports/input-options";
import { ReportForm } from "../../_components/report-form";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ slug: string; reportId: string }>;
}) {
  const { slug, reportId } = await params;
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    redirect(`/productions/${slug}/reports/${reportId}`);
  }

  const production = await getProductionBySlug(user.organizationId, slug);

  if (!production) {
    notFound();
  }

  const [report, members, attachmentRows, departments, autofill] =
    await Promise.all([
      getReportById(reportId),
      getProductionMembers(production.id),
      getReportAttachments(reportId),
      getResolvedDepartments(production.id),
      getReportAutofillOptions(production.id),
    ]);

  if (!report || report.productionId !== production.id) {
    notFound();
  }

  const mentionMembers = members.map((m) => ({
    id: m.userId,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    role: m.role,
  }));

  const existingAttachments = attachmentRows.map((a) => ({
    id: a.id,
    fileName: a.fileName,
    fileSize: a.fileSize,
    contentType: a.contentType,
  }));

  return (
    <ReportForm
      mode="edit"
      productionId={production.id}
      productionTitle={production.title}
      slug={slug}
      initial={report}
      departments={departments}
      existingAttachments={existingAttachments}
      members={mentionMembers}
      sceneOptions={autofill.sceneOptions}
      characterOptions={autofill.characterOptions}
      personOptions={personOptionsFromMembers(members)}
    />
  );
}
