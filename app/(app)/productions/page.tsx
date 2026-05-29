import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  getArchivedProductionsByOrganization,
  getProductionsByOrganization,
  getOrgUsersForWizard,
} from "@/features/productions/queries";
import { getUserProductionIds } from "@/features/members/queries";
import { ProductionList } from "./production-list";
import { ArchivedSection } from "./archived-section";
import { NewProductionTrigger } from "./new-production-trigger";

export default async function ProductionsPage() {
  const user = await requireCurrentUser();
  const canManage = can(user.role, "productions:manage");

  const [productionsList, assignedIds, archivedList, orgUsers] =
    await Promise.all([
      getProductionsByOrganization(user.organizationId),
      canManage ? Promise.resolve(null) : getUserProductionIds(user.id),
      canManage
        ? getArchivedProductionsByOrganization(user.organizationId)
        : Promise.resolve([]),
      canManage
        ? getOrgUsersForWizard(user.organizationId)
        : Promise.resolve([]),
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
          {canManage && <NewProductionTrigger orgUsers={orgUsers} />}
        </div>

        <ProductionList
          productions={productionsList}
          accessibleIds={assignedIds}
          canManage={canManage}
        />

        {canManage && <ArchivedSection productions={archivedList} />}
      </div>
    </div>
  );
}
