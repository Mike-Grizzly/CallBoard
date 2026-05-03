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
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Team Members</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Manage who has access and what role they have in your organization.
        </p>
      </div>

      <MemberList members={members} currentUserId={user.id} />
    </div>
  );
}
