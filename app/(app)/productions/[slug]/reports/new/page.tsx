import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembers } from "@/features/members/queries";
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

  const members = await getProductionMembers(production.id);

  const mentionMembers = members.map((m) => ({
    id: m.userId,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    role: m.role,
  }));

  return (
    <>
      <div
        className="card card-pad"
        style={{
          background: "var(--c-amber-soft)",
          border: "1px solid color-mix(in oklch, var(--c-amber) 30%, transparent)",
          color: "var(--ink)",
          fontSize: 13,
          lineHeight: 1.5,
          marginBottom: 12,
        }}
      >
        <strong>Tip:</strong> save the report as a draft first to attach files
        — the attachments panel appears once the report exists.
      </div>
      <ReportForm
        mode="create"
        productionId={production.id}
        productionTitle={production.title}
        slug={slug}
        members={mentionMembers}
      />
    </>
  );
}
