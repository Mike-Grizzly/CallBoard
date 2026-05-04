import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { CreateReportForm } from "./create-report-form";

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

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <Link
          href={`/productions/${slug}/reports`}
          className="text-sm text-[color:var(--muted-foreground)] underline underline-offset-4 hover:text-[color:var(--foreground)]"
        >
          &larr; Back to reports
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          New Rehearsal Report
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          {production.title}
        </p>
      </div>

      <CreateReportForm productionId={production.id} slug={slug} />
    </div>
  );
}
