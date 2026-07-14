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
import type { IconName } from "@/components/ui/icon";

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

type HubLink = {
  href: string;
  icon: IconName;
  label: string;
  hint: string;
  external?: boolean;
};

function HubRow({ href, icon, label, hint, external }: HubLink) {
  const inner = (
    <>
      <span className="more-item-ico">
        <Icon name={icon} aria-hidden />
      </span>
      <span className="more-item-main">
        <span className="more-item-label">{label}</span>
        <span className="more-item-sub">{hint}</span>
      </span>
      <span aria-hidden />
      <Icon name="ChevronRight" className="more-item-chev" aria-hidden />
    </>
  );
  return (
    <li>
      {external ? (
        <a href={href} className="more-item">
          {inner}
        </a>
      ) : (
        <Link href={href} className="more-item">
          {inner}
        </Link>
      )}
    </li>
  );
}

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const canManage = can(user.role, "settings:manage");
  const [memberships, logoUrl, themePref] = await Promise.all([
    getUserMemberships(user.id),
    getSignedLogoUrl(user.organizationLogoUrl),
    getThemePref(),
  ]);

  const displayName =
    user.firstName || user.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.email;

  return (
    <div
      className="page-narrow anim-in"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      {/* Identity — who you're signed in as, in which workspace. The org
          switcher lives here only on phones (the desktop rail badge already
          switches workspaces — N5). */}
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
          Signed in as <b>{displayName}</b> · {roleLabel(user.role)}
        </div>

        <div className="settings-ws-switch">
          <WorkspaceSwitcher
            current={user.organizationId}
            memberships={memberships}
          />
        </div>
      </div>

      {/* Account — personal to the signed-in user. */}
      <section className="card card-pad">
        <div className="h-eyebrow">Account</div>
        <p className="settings-sec-desc">
          Your profile and personal preferences.
        </p>
        <ul className="more-list" role="list">
          <HubRow
            href="/settings/account"
            icon="UserCircle"
            label="Profile & password"
            hint="Your name, email, and password"
          />
        </ul>

        <div className="settings-appearance">
          <div className="label" style={{ marginBottom: 8 }}>
            Appearance
          </div>
          <ThemeControl variant="segmented" initialPref={themePref} />
          <ThemeStatusNote initialPref={themePref} />
        </div>
      </section>

      {/* Notifications — what reaches you and how. */}
      <section className="card card-pad">
        <div className="h-eyebrow">Notifications</div>
        <p className="settings-sec-desc">
          Choose which updates reach you by email and push.
        </p>
        <ul className="more-list" role="list">
          <HubRow
            href="/settings/notifications"
            icon="Bell"
            label="Notification preferences"
            hint="Email and push for announcements, reports, and mentions"
          />
        </ul>
      </section>

      {/* Workspace — managing the org itself. Managers only. */}
      {canManage && (
        <section className="card card-pad">
          <div className="h-eyebrow">Workspace</div>
          <p className="settings-sec-desc">
            Manage {user.organizationName} and who belongs to it.
          </p>
          <ul className="more-list" role="list">
            <HubRow
              href="/settings/workspace"
              icon="Building2"
              label="Workspace settings"
              hint="Name, logo, and ownership"
            />
            <HubRow
              href="/settings/members"
              icon="Users"
              label="Team members"
              hint="Invite people and manage their access"
            />
            <HubRow
              href="/settings/billing"
              icon="CreditCard"
              label="Plan & billing"
              hint="Subscription, invoices, and trial"
            />
          </ul>
          <p className="settings-crosslink">
            Setting up a specific show? Departments, roles, and scenes live on
            each production&rsquo;s <Link href="/productions">Settings</Link>{" "}
            tab.
          </p>
        </section>
      )}

      {/* General — help & feedback. */}
      <section className="card card-pad">
        <div className="h-eyebrow">Help</div>
        <ul className="more-list" role="list">
          <HubRow
            href="mailto:feedback@proscene.app?subject=Proscene%20feedback"
            icon="Mail"
            label="Send feedback"
            hint="Tell us what's working and what isn't"
            external
          />
        </ul>
      </section>
    </div>
  );
}
