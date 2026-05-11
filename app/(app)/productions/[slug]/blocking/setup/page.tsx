import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getDocumentsByProduction } from "@/features/documents/queries";
import { getStageConfiguration } from "@/features/blocking/queries";
import { SetupWizard } from "./setup-wizard";

export default async function BlockingSetupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();
  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);

  if (!production) notFound();

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  if (!can(user.role, "blocking:edit")) {
    redirect(`/productions/${slug}/blocking`);
  }

  const [allDocuments, existingConfig] = await Promise.all([
    getDocumentsByProduction(production.id),
    getStageConfiguration(production.id),
  ]);

  const pdfDocuments = allDocuments.filter(
    (d) => d.contentType === "application/pdf",
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Stage Setup
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Configure the stage for {production.title}. Select a ground plan and
          define the stage dimensions.
        </p>
      </div>
      <SetupWizard
        productionId={production.id}
        productionSlug={slug}
        pdfDocuments={pdfDocuments}
        existingConfig={existingConfig}
      />
    </div>
  );
}
