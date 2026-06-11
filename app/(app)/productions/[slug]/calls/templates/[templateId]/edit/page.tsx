import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getTemplateById } from "@/features/call-templates/queries";
import { TemplateForm } from "../../new/template-form";
import { DeleteTemplateButton } from "./delete-template-button";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ slug: string; templateId: string }>;
}) {
  const { slug, templateId } = await params;
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    redirect(`/productions/${slug}/calls`);
  }

  const production = await getProductionBySlug(user.organizationId, slug);
  if (!production) notFound();

  if (!can(user.role, "productions:manage")) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  const template = await getTemplateById(templateId);
  if (!template || template.productionId !== production.id) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <nav className="mb-3 flex items-center gap-1.5 text-sm text-[color:var(--muted-foreground)]">
          <Link
            href={`/productions/${slug}/calls`}
            className="hover:text-[color:var(--foreground)] transition-colors"
          >
            Calendar
          </Link>
          <span>/</span>
          <Link
            href={`/productions/${slug}/calls/templates`}
            className="hover:text-[color:var(--foreground)] transition-colors"
          >
            Templates
          </Link>
          <span>/</span>
          <span className="text-[color:var(--foreground)]">{template.name}</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Edit template</h1>
          <DeleteTemplateButton
            templateId={template.id}
            productionId={production.id}
          />
        </div>
      </div>

      <TemplateForm
        productionId={production.id}
        slug={slug}
        existingTemplate={template}
      />
    </div>
  );
}
