import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { TemplateForm } from "./template-form";

export default async function NewTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
          <span className="text-[color:var(--foreground)]">New template</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight">New rehearsal template</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Save a reusable set of call defaults — then apply it to a single call
          or generate a whole recurring schedule.
        </p>
      </div>

      <TemplateForm productionId={production.id} slug={slug} />
    </div>
  );
}
