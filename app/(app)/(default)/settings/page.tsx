import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getUserMemberships } from "@/features/workspace/queries";
import { WorkspaceSwitcher } from "./workspace-switcher";

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "Admin",
    producer: "Producer",
    director: "Director",
    choreographer: "Choreographer",
    stage_manager: "Stage Manager",
    cast: "Cast",
    crew: "Crew",
  };
  return labels[role] ?? role;
}

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const canManage = can(user.role, "settings:manage");
  const memberships = await getUserMemberships(user.id);

  return (
    <div
      className="page-narrow anim-in"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div className="card card-pad">
        <div className="h-eyebrow" style={{ marginBottom: 4 }}>
          Workspace
        </div>
        <h1 className="h-section">{user.organizationName}</h1>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Signed in as{" "}
          <b>
            {user.firstName || user.lastName
              ? `${user.firstName} ${user.lastName}`.trim()
              : user.email}
          </b>{" "}
          · {roleLabel(user.role)}
        </div>

        <WorkspaceSwitcher
          current={user.organizationId}
          memberships={memberships}
        />
      </div>

      <ul className="more-list" role="list">
        <li>
          <Link href="/settings/account" className="more-item">
            <span className="more-item-ico">
              <Icon name="UserCircle" aria-hidden />
            </span>
            <span className="more-item-label">Your profile &amp; password</span>
            <Icon name="ChevronRight" className="more-item-chev" aria-hidden />
          </Link>
        </li>
        {canManage && (
          <li>
            <Link href="/settings/workspace" className="more-item">
              <span className="more-item-ico">
                <Icon name="Building2" aria-hidden />
              </span>
              <span className="more-item-label">Workspace settings</span>
              <Icon name="ChevronRight" className="more-item-chev" aria-hidden />
            </Link>
          </li>
        )}
        {canManage && (
          <li>
            <Link href="/settings/members" className="more-item">
              <span className="more-item-ico">
                <Icon name="Users" aria-hidden />
              </span>
              <span className="more-item-label">Team members</span>
              <Icon name="ChevronRight" className="more-item-chev" aria-hidden />
            </Link>
          </li>
        )}
        <li>
          <a
            href="mailto:feedback@proscene.app?subject=Proscene%20feedback"
            className="more-item"
          >
            <span className="more-item-ico">
              <Icon name="Mail" aria-hidden />
            </span>
            <span className="more-item-label">Send feedback</span>
            <Icon name="ChevronRight" className="more-item-chev" aria-hidden />
          </a>
        </li>
      </ul>
    </div>
  );
}
