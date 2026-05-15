import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembers } from "@/features/members/queries";
import { getReportById } from "@/features/reports/queries";
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

  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);

  if (!production) {
    notFound();
  }

  const [report, members] = await Promise.all([
    getReportById(reportId),
    getProductionMembers(production.id),
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

  return (
    <ReportForm
      mode="edit"
      productionId={production.id}
      productionTitle={production.title}
      slug={slug}
      logContent={null}
      initial={report}
      members={mentionMembers}
    />
  );
}
