import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionLog } from "@/features/logs/queries";
import { CreateReportForm } from "./create-report-form";

export default async function NewReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  console.log("[reports/new page] hit, slug=", slug);
  const user = await requireCurrentUser();
  console.log("[reports/new page] user:", user.id, "role:", user.role);

  if (!can(user.role, "reports:create")) {
    console.log("[reports/new page] redirect: lacks reports:create");
    redirect(`/productions/${slug}/reports`);
  }

  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);
  console.log("[reports/new page] production:", production?.id ?? "(null)");

  if (!production) {
    console.log("[reports/new page] 404: production not found");
    notFound();
  }

  const log = await getProductionLog(production.id, user.id);

  return (
    <div className="mx-auto max-w-4xl">
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

      <CreateReportForm
        productionId={production.id}
        slug={slug}
        logContent={log?.content ?? null}
      />
    </div>
  );
}
