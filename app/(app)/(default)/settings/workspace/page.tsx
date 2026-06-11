import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSignedLogoUrl } from "@/lib/workspace-logo";
import { Icon } from "@/components/ui/icon";
import { getOrganizationMembers } from "@/features/members/queries";
import { getWorkspaceOverview } from "@/features/workspace/queries";
import { RenameWorkspaceForm } from "./rename-workspace-form";
import { WorkspaceLogoUploader } from "./logo-uploader";
import {
  TransferOwnershipForm,
  type TransferCandidate,
} from "./transfer-ownership-form";
import { DeleteWorkspaceForm } from "./delete-workspace-form";

export default async function WorkspaceSettingsPage() {
  const user = await requireCurrentUser();

  if (!can(user.role, "settings:manage")) {
    redirect("/dashboard");
  }

  const overview = await getWorkspaceOverview(user.organizationId);
  if (!overview) redirect("/dashboard");

  const [members, logoRow] = await Promise.all([
    getOrganizationMembers(user.organizationId),
    db
      .select({ logoUrl: organizations.logoUrl })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1),
  ]);

  const logoUrl = await getSignedLogoUrl(logoRow[0]?.logoUrl ?? null);

  const candidates: TransferCandidate[] = members
    .filter((m) => m.userId !== user.id)
    .map((m) => ({
      userId: m.userId,
      displayName:
        `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.email,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <div
      className="page-narrow anim-in"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <Link
        href="/settings"
        className="muted"
        style={{ fontSize: 13, textDecoration: "none" }}
      >
        <Icon name="ChevronLeft" size={14} aria-hidden /> Settings
      </Link>

      <div>
        <div className="h-eyebrow">Workspace</div>
        <h1 className="h-section">{overview.name}</h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          {overview.memberCount} member{overview.memberCount === 1 ? "" : "s"}
          {" · "}
          {overview.adminCount} admin{overview.adminCount === 1 ? "" : "s"}
        </p>
      </div>

      <RenameWorkspaceForm currentName={overview.name} />

      <WorkspaceLogoUploader currentLogoUrl={logoUrl} />

      <div className="card card-pad">
        <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>
          Admins &amp; access
        </h3>
        <p
          className="muted"
          style={{ fontSize: 13, marginTop: 6, marginBottom: 12 }}
        >
          Promote a team member to admin, change their role, or remove their
          access from the members page.
        </p>
        <Link href="/settings/members" className="btn">
          <Icon name="Users" size={14} aria-hidden /> Manage members
        </Link>
      </div>

      <TransferOwnershipForm candidates={candidates} />

      <DeleteWorkspaceForm workspaceName={overview.name} />
    </div>
  );
}
