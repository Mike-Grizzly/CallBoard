import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  getProductionBySlug,
  getProductionRoles,
} from "@/features/productions/queries";
import {
  getProductionMembers,
  getOrganizationMembers,
} from "@/features/members/queries";
import { ProductionMemberManager } from "./production-member-manager";
import { CastList } from "./cast-list";

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

  const production = await getProductionBySlug(user.organizationId, slug);

  if (!production) {
    notFound();
  }

  const [productionMembers, orgMembers, roles] = await Promise.all([
    getProductionMembers(production.id),
    getOrganizationMembers(user.organizationId),
    getProductionRoles(production.id),
  ]);

  const assignedUserIds = new Set(productionMembers.map((m) => m.userId));
  const availableMembers = orgMembers.filter(
    (m) => !assignedUserIds.has(m.userId),
  );
  const canInvite = can(user.role, "settings:manage");

  return (
    <div className="page-narrow anim-in">
      <Link href={`/productions/${slug}`} className="pp-back">
        <Icon name="ChevronLeft" size={14} />
        <span>Back to {production.title}</span>
      </Link>

      <div style={{ margin: "10px 0 22px" }}>
        <div className="h-eyebrow">Production</div>
        <h1 className="h-section">Cast &amp; crew</h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Assign organization members to this production and set each
          person&apos;s role.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <CastList
          roles={roles}
          orgMembers={orgMembers}
          canInvite={canInvite}
          scriptHref={`/productions/${slug}/script/ai`}
        />

        <ProductionMemberManager
          productionId={production.id}
          currentMembers={productionMembers}
          availableMembers={availableMembers}
        />
      </div>
    </div>
  );
}
