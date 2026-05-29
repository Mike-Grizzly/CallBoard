import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionsByOrganization } from "@/features/productions/queries";
import { getUserProductionIds } from "@/features/members/queries";
import { ProductionList } from "./production-list";

export default async function ProductionsPage() {
  const user = await requireCurrentUser();
  const canManage = can(user.role, "productions:manage");

  const [productionsList, assignedIds] = await Promise.all([
    getProductionsByOrganization(user.organizationId),
    canManage ? Promise.resolve(null) : getUserProductionIds(user.id),
  ]);

  return (
    <div className="page">
      <div className="page-narrow anim-in">
        <div className="row-between" style={{ marginBottom: 20, alignItems: "flex-start" }}>
          <div>
            <div className="h-eyebrow">Workspace</div>
            <h1 className="h-section">Productions</h1>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Every show your organization is producing.
            </p>
          </div>
          {canManage && (
            <Link href="/productions/new" className="btn primary">
              <Icon name="Plus" size={14} />
              <span>New production</span>
            </Link>
          )}
        </div>

        <ProductionList
          productions={productionsList}
          accessibleIds={assignedIds}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
