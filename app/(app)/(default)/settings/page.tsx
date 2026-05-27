import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const canManage = can(user.role, "settings:manage");

  return (
    <div className="page-narrow anim-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card card-pad">
        <div className="h-eyebrow" style={{ marginBottom: 4 }}>
          Settings
        </div>
        <h2 className="h-section">Your account</h2>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          {(user.firstName || user.lastName
            ? `${user.firstName} ${user.lastName}`.trim()
            : user.email)}{" "}
          · <span style={{ textTransform: "capitalize" }}>{user.role}</span>
        </div>
      </div>

      <ul className="more-list" role="list">
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
        {canManage && (
          <li>
            <Link href="/settings/members" className="more-item">
              <span className="more-item-ico">
                <Icon name="Users" aria-hidden />
              </span>
              <span className="more-item-label">Organization members</span>
              <Icon name="ChevronRight" className="more-item-chev" aria-hidden />
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
