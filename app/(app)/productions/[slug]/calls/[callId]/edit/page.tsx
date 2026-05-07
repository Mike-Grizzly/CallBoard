import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getCallById } from "@/features/calls/queries";
import { deleteCall } from "@/features/calls/actions";
import { CallForm } from "../../new/call-form";

export default async function EditCallPage({
  params,
}: {
  params: Promise<{ slug: string; callId: string }>;
}) {
  const { slug, callId } = await params;
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    redirect(`/productions/${slug}`);
  }

  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);
  if (!production) notFound();

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  const call = await getCallById(callId);
  if (!call || call.productionId !== production.id) notFound();

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
          <span className="text-[color:var(--foreground)]">Edit call</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit call</h1>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Update details as you get more information closer to the call.
            </p>
          </div>
          <form action={deleteCall}>
            <input type="hidden" name="call_id" value={call.id} />
            <input type="hidden" name="production_id" value={production.id} />
            <button
              type="submit"
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
              onClick={(e) => {
                if (!confirm("Delete this call?")) e.preventDefault();
              }}
            >
              Delete call
            </button>
          </form>
        </div>
      </div>

      <CallForm
        productionId={production.id}
        slug={slug}
        existingCall={call}
      />
    </div>
  );
}
