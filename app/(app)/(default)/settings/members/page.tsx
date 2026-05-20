import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrganizationMembers } from "@/features/members/queries";
import { MemberList } from "./member-list";

export default async function MembersPage() {
  const user = await requireCurrentUser();

  if (!can(user.role, "settings:manage")) {
    redirect("/dashboard");
  }

  const members = await getOrganizationMembers(user.organizationId);

  return (
    <div className="page-narrow anim-in">
      <div style={{ marginBottom: 20 }}>
        <div className="h-eyebrow">Workspace</div>
        <h1 className="h-section">Team members</h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Manage who has access and what role they have in your organization.
        </p>
      </div>

      <MemberList members={members} currentUserId={user.id} />
    </div>
  );
}
