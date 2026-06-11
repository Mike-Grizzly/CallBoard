import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getVisibleProductions } from "@/features/productions/queries";
import { resolveProductionColor } from "@/features/productions/constants";
import {
  getUserMemberships,
  getWorkspaceAlertCounts,
} from "@/features/workspace/queries";
import { getSignedLogoUrl } from "@/lib/workspace-logo";
import { can } from "@/lib/permissions";
import { Icon } from "@/components/ui/icon";
import { NAV_ITEMS } from "./nav-items";
import { RailLink } from "./rail-link";
import { LogoutButton } from "./logout-button";
import { WorkspaceRailBadge } from "./workspace-rail-badge";
import { ThemeControl } from "./theme-control";
import { getThemePref } from "@/lib/theme-server";

function initialsFor(firstName: string, lastName: string, email: string) {
  const a = (firstName || "").trim()[0];
  const b = (lastName || "").trim()[0];
  if (a || b) return `${a ?? ""}${b ?? ""}`.toUpperCase();
  return (email || "?").slice(0, 2).toUpperCase();
}

export async function Rail() {
  const user = await getCurrentUser();
  const role = user?.role ?? "cast";
  const themePref = await getThemePref();

  const [productions, memberships, logoUrl, alertCounts] = user
    ? await Promise.all([
        getVisibleProductions(user),
        getUserMemberships(user.id),
        getSignedLogoUrl(user.organizationLogoUrl),
        getWorkspaceAlertCounts(user.id),
      ])
    : [[], [], null, {}];

  // Workspace items follow NAV_ITEMS order, gated by capability.
  // We exclude "Productions" since the productions section below covers it.
  const workspaceItems = NAV_ITEMS.filter(
    (item) =>
      item.href !== "/productions" &&
      (!item.capability || can(role, item.capability)),
  );

  return (
    <aside className="rail" id="app-rail">
      <Link href="/dashboard" className="rail-brand" aria-label="Proscene home">
        <div className="rail-mark">
          <img src="/brand-mark.svg" alt="" width={18} height={18} />
        </div>
        <div className="rail-name">
          Pro<em>scene</em>
        </div>
      </Link>

      {user && (
        <WorkspaceRailBadge
          currentOrgId={user.organizationId}
          currentOrgName={user.organizationName}
          currentOrgLogoUrl={logoUrl}
          memberships={memberships}
          alertCounts={alertCounts}
        />
      )}

      <div className="rail-section">
        <div className="rail-section-h">
          <span>Workspace</span>
        </div>
        {workspaceItems.map((item) => (
          <RailLink key={item.href} href={item.href} icon={item.icon}>
            <span>{item.label}</span>
          </RailLink>
        ))}
      </div>

      {can(role, "productions:view") && (
        <div className="rail-section">
          <div className="rail-section-h">
            <span>Productions</span>
            {can(role, "productions:manage") && (
              <Link
                href="/productions/new"
                title="New production"
                aria-label="New production"
              >
                <svg
                  className="ico"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </Link>
            )}
          </div>
          {productions.length === 0 ? (
            <div
              className="rail-section-h"
              style={{
                padding: "0 8px 8px",
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--ink-4)" }}>
                No productions yet
              </span>
            </div>
          ) : (
            productions.map((p) => (
              <RailLink
                key={p.id}
                href={`/productions/${p.slug}`}
                className="prod-item"
              >
                <span
                  className="prod-dot"
                  style={{ background: resolveProductionColor(p) }}
                  aria-hidden
                />
                <span className="truncate">{p.title}</span>
              </RailLink>
            ))
          )}
        </div>
      )}

      <div className="rail-foot">
        {user ? (
          <>
            <div className="avatar" aria-hidden>
              {initialsFor(user.firstName, user.lastName, user.email)}
            </div>
            <div className="rail-foot-meta">
              <b className="truncate">
                {user.firstName || user.lastName
                  ? `${user.firstName} ${user.lastName}`.trim()
                  : user.email}
              </b>
              <span className="truncate" style={{ textTransform: "capitalize" }}>
                {user.role}
              </span>
            </div>
            <ThemeControl variant="icon" initialPref={themePref} />
            <Link href="/settings" title="Settings" aria-label="Settings">
              <Icon name="Settings" className="ico" aria-hidden />
            </Link>
            <LogoutButton />
          </>
        ) : (
          <Link href="/login" className="btn ghost">
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
