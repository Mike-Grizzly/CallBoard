import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  const user = await requireCurrentUser();

  // Workspace setup is an org-admin action. Cast, crew, and other invited
  // members can't onboard the org, so never strand them on this screen —
  // send them straight to their dashboard.
  if (!can(user.role, "settings:manage")) redirect("/dashboard");

  const [org] = await db
    .select({ name: organizations.name, onboardedAt: organizations.onboardedAt })
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  if (org?.onboardedAt) redirect("/dashboard");

  return (
    <div className="np-root">
      <SetupForm orgName={org?.name ?? "Your workspace"} />
    </div>
  );
}
