import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getProductionLog } from "@/features/logs/queries";
import { LogEditor } from "./log-editor";

export default async function LogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();
  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);

  if (!production) {
    notFound();
  }

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) {
      redirect("/productions");
    }
  }

  if (!can(user.role, "reports:create")) {
    redirect(`/productions/${slug}`);
  }

  const log = await getProductionLog(production.id, user.id);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/productions/${slug}`}
          className="text-sm text-[color:var(--muted-foreground)] underline underline-offset-4 hover:text-[color:var(--foreground)]"
        >
          &larr; Back to {production.title}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Daily Log
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Your personal running notes for {production.title}. Use this to draft
          thoughts before creating a formal report.
        </p>
      </div>

      <LogEditor
        productionId={production.id}
        initialContent={log?.content ?? ""}
      />
    </div>
  );
}
