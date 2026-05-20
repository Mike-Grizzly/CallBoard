import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
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

      <ProductionMemberManager
        productionId={production.id}
        currentMembers={productionMembers}
        availableMembers={availableMembers}
      />
    </div>
  );
}
