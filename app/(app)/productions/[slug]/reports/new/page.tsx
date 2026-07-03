import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  getProductionBySlug,
  getResolvedDepartments,
} from "@/features/productions/queries";
import { getProductionMembers } from "@/features/members/queries";
import {
  getReportAutofillOptions,
  personOptionsFromMembers,
} from "@/features/reports/input-options";
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

  const production = await getProductionBySlug(user.organizationId, slug);

  if (!production) {
    notFound();
  }

  const [members, departments, autofill] = await Promise.all([
    getProductionMembers(production.id),
    getResolvedDepartments(production.id),
    getReportAutofillOptions(production.id),
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
      departments={departments}
      members={mentionMembers}
      sceneOptions={autofill.sceneOptions}
      characterOptions={autofill.characterOptions}
      personOptions={personOptionsFromMembers(members)}
    />
  );
}
