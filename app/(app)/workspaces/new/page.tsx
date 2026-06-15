import { requireCurrentUser } from "@/lib/auth";
import CreateWorkspaceWizard from "./create-workspace-wizard";

/**
 * Guided "set up a new workspace" flow. Any signed-in user may create a
 * workspace (multi-org membership isn't role-gated), so there's no `can()`
 * check here — this is also the path a previously view-only user takes to
 * stand up their own company and become its first admin.
 *
 * Rendered full-screen via `.np-overlay` so the setup gets the same focused,
 * single-rail chrome as the New Production wizard, whether reached by link or
 * a direct refresh.
 */
export default async function NewWorkspacePage() {
  await requireCurrentUser();

  return (
    <div className="np-overlay">
      <CreateWorkspaceWizard />
    </div>
  );
}
