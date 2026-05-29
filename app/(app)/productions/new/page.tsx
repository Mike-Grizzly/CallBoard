import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrgUsersForWizard } from "@/features/productions/queries";
import NewProductionWizard from "./new-production-wizard";

export default async function NewProductionPage() {
  const user = await requireCurrentUser();

  if (!can(user.role, "productions:manage")) {
    redirect("/productions");
  }

  const orgUsers = await getOrgUsersForWizard(user.organizationId);

  // Render full-screen (covering the app frame's own rail) so the setup flow
  // gets focused, single-rail chrome whether it's reached by link or refresh.
  return (
    <div className="np-overlay">
      <NewProductionWizard mode="page" orgUsers={orgUsers} />
    </div>
  );
}
