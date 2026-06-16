import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  getArchivedProductionsByOrganization,
  getDeletedProductionsByOrganization,
  getProductionsByOrganization,
  getOrgUsersForWizard,
} from "@/features/productions/queries";
import { getUserProductionIds } from "@/features/members/queries";
import { ProductionList } from "./production-list";
import { ArchivedSection } from "./archived-section";
import { DeletedSection } from "./deleted-section";
import { NewProductionTrigger } from "./new-production-trigger";

export default async function ProductionsPage() {
  const user = await requireCurrentUser();
  const canManage = can(user.role, "productions:manage");
  // Delete (trash) is more destructive than archive — admins only.
  const canDelete = can(user.role, "settings:manage");

  const [productionsList, assignedIds, archivedList, deletedList, orgUsers] =
    await Promise.all([
      getProductionsByOrganization(user.organizationId),
      canManage ? Promise.resolve(null) : getUserProductionIds(user.id),
      canManage
        ? getArchivedProductionsByOrganization(user.organizationId)
        : Promise.resolve([]),
      canDelete
        ? getDeletedProductionsByOrganization(user.organizationId)
        : Promise.resolve([]),
      canManage
        ? getOrgUsersForWizard(user.organizationId)
        : Promise.resolve([]),
    ]);

  return (
    <div className="page">
      <div className="page-narrow anim-in">
        <div className="row-between" style={{ marginBottom: 20, alignItems: "flex-start" }}>
          <div data-tour="prod-heading">
            <div className="h-eyebrow">Workspace</div>
            <h1 className="h-section">Productions</h1>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Every show your organization is producing.
            </p>
          </div>
          {canManage && (
            <div data-tour="prod-new">
              <NewProductionTrigger orgUsers={orgUsers} />
            </div>
          )}
        </div>

        <div data-tour="prod-list">
          <ProductionList
            productions={productionsList}
            accessibleIds={assignedIds}
            canManage={canManage}
            canDelete={canDelete}
          />
        </div>

        {canManage && <ArchivedSection productions={archivedList} />}
        {canDelete && <DeletedSection productions={deletedList} />}
      </div>
    </div>
  );
}
