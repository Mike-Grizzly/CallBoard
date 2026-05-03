import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import {
  getProductionMembers,
  getOrganizationMembers,
} from "@/features/members/queries";
import { ProductionMemberManager } from "./production-member-manager";

export default async function ProductionMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();

  if (!can(user.role, "productions:manage")) {
    redirect("/productions");
  }

  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);

  if (!production) {
    notFound();
  }

  const [productionMembers, orgMembers] = await Promise.all([
    getProductionMembers(production.id),
    getOrganizationMembers(org.id),
  ]);

  const assignedUserIds = new Set(productionMembers.map((m) => m.userId));
  const availableMembers = orgMembers.filter(
    (m) => !assignedUserIds.has(m.userId),
  );

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
          Manage Team — {production.title}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Assign organization members to this production with a specific role.
        </p>
      </div>

      <ProductionMemberManager
        productionId={production.id}
        currentMembers={productionMembers}
        availableMembers={availableMembers}
      />
    </div>
  );
}
