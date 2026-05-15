import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembers } from "@/features/members/queries";
import { getProductionLog } from "@/features/logs/queries";
import { ReportForm } from "../_components/report-form";

export default async function NewReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    redirect(`/productions/${slug}/reports`);
  }

  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);

  if (!production) {
    notFound();
  }

  const [log, members] = await Promise.all([
    getProductionLog(production.id, user.id),
    getProductionMembers(production.id),
  ]);

  const mentionMembers = members.map((m) => ({
    id: m.userId,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    role: m.role,
  }));

  return (
    <ReportForm
      mode="create"
      productionId={production.id}
      productionTitle={production.title}
      slug={slug}
      logContent={log?.content ?? null}
      members={mentionMembers}
    />
  );
}
