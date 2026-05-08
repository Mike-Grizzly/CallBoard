import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership, getProductionMembers } from "@/features/members/queries";
import { CallForm } from "./call-form";

export default async function NewCallPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ slug }, { date }] = await Promise.all([params, searchParams]);
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    redirect(`/productions/${slug}/calls`);
  }

  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);
  if (!production) notFound();

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  const allMembers = await getProductionMembers(production.id);
  const castMembers = allMembers.filter((m) => m.role === "cast");

  // Validate date param format (YYYY-MM-DD)
  const prefillDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <nav className="mb-3 flex items-center gap-1.5 text-sm text-[color:var(--muted-foreground)]">
          <Link
            href="/productions"
            className="hover:text-[color:var(--foreground)] transition-colors"
          >
            Productions
          </Link>
          <span>/</span>
          <Link
            href={`/productions/${slug}`}
            className="hover:text-[color:var(--foreground)] transition-colors"
          >
            {production.title}
          </Link>
          <span>/</span>
          <Link
            href={`/productions/${slug}/calls`}
            className="hover:text-[color:var(--foreground)] transition-colors"
          >
            Calls
          </Link>
          <span>/</span>
          <span className="text-[color:var(--foreground)]">Schedule call</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight">Schedule a call</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Add a date now — time, location, and cast can be filled in as you get
          more information.
        </p>
      </div>

      <CallForm
        productionId={production.id}
        slug={slug}
        castMembers={castMembers}
        prefillDate={prefillDate}
      />
    </div>
  );
}
