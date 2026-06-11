import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Icon } from "@/components/ui/icon";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getTemplatesForProduction } from "@/features/call-templates/queries";
import { GenerateForm, type TemplateOption } from "./generate-form";

export default async function GenerateCallsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const [{ slug }, { template }] = await Promise.all([params, searchParams]);
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

  const templates = await getTemplatesForProduction(production.id);
  const options: TemplateOption[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    callTime: t.callTime,
    endTime: t.endTime,
    location: t.location,
    focus: t.focus,
    scenes: t.scenes,
    castCalled: t.castCalled,
    schedule: t.schedule,
    notes: t.notes,
  }));

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
          <span className="text-[color:var(--foreground)]">Generate schedule</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Generate a schedule
            </h1>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Repeat a call across a date range — every Tuesday and Thursday for
              six weeks, say. Each call stays individually editable.
            </p>
          </div>
          <Link
            href={`/productions/${slug}/calls/templates`}
            className="shrink-0 inline-flex items-center gap-1.5 text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
          >
            <Icon name="Tag" width={15} height={15} />
            Templates
          </Link>
        </div>
      </div>

      <GenerateForm
        productionId={production.id}
        slug={slug}
        templates={options}
        prefillTemplateId={template}
      />
    </div>
  );
}
