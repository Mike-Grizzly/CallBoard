import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getUserMemberships } from "@/features/workspace/queries";
import { getSignedLogoUrl } from "@/lib/workspace-logo";
import { WorkspaceSwitcher } from "./workspace-switcher";
import {
  ThemeControl,
  ThemeStatusNote,
} from "@/components/app-shell/theme-control";
import { getThemePref } from "@/lib/theme-server";

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
  const [memberships, logoUrl, themePref] = await Promise.all([
    getUserMemberships(user.id),
    getSignedLogoUrl(user.organizationLogoUrl),
    getThemePref(),
  ]);

  return (
    <div
      className="page-narrow anim-in"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div className="card card-pad">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: "var(--bg-muted)",
              border: "1px solid var(--border)",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                width={48}
                height={48}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Icon
                name="Building2"
                size={22}
                aria-hidden
                style={{ color: "var(--ink-4)" }}
              />
            )}
          </div>
          <div>
            <div className="h-eyebrow">Workspace</div>
            <h1 className="h-section" style={{ marginTop: 2 }}>
              {user.organizationName}
            </h1>
          </div>
        </div>
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

      <div className="card card-pad">
        <div className="h-eyebrow">Appearance</div>
        <h2 className="h-section" style={{ marginTop: 2, marginBottom: 12 }}>
          Theme
        </h2>
        <ThemeControl variant="segmented" initialPref={themePref} />
        <ThemeStatusNote initialPref={themePref} />
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
        <li>
          <Link href="/settings/notifications" className="more-item">
            <span className="more-item-ico">
              <Icon name="Bell" aria-hidden />
            </span>
            <span className="more-item-label">Notifications</span>
            <Icon name="ChevronRight" className="more-item-chev" aria-hidden />
          </Link>
        </li>
        <li>
          <Link href="/settings/eos-helper" className="more-item">
            <span className="more-item-ico">
              <Icon name="Lightbulb" aria-hidden />
            </span>
            <span className="more-item-label">Lighting console (Eos helper)</span>
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
        {canManage && (
          <li>
            <Link href="/settings/billing" className="more-item">
              <span className="more-item-ico">
                <Icon name="CreditCard" aria-hidden />
              </span>
              <span className="more-item-label">Plan &amp; billing</span>
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
