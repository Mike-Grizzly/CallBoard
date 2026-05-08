import Link from "next/link";
import { Settings as SettingsIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getUserProductions } from "@/features/productions/queries";
import { can } from "@/lib/permissions";
import { NAV_ITEMS } from "./nav-items";
import { RailLink } from "./rail-link";
import { LogoutButton } from "./logout-button";

/**
 * Color the per-production dot in the rail. Stable per-id so reorders
 * don't shuffle the palette.
 */
const PROD_DOT_PALETTE = [
  "var(--c-clay)",
  "var(--c-sage)",
  "var(--c-dusk)",
  "var(--c-amber)",
  "var(--c-plum)",
  "var(--c-sand)",
];
function dotForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PROD_DOT_PALETTE[h % PROD_DOT_PALETTE.length];
}

function initialsFor(firstName: string, lastName: string, email: string) {
  const a = (firstName || "").trim()[0];
  const b = (lastName || "").trim()[0];
  if (a || b) return `${a ?? ""}${b ?? ""}`.toUpperCase();
  return (email || "?").slice(0, 2).toUpperCase();
}

export async function Rail() {
  const user = await getCurrentUser();
  const role = user?.role ?? "cast";

  const productions = user ? await getUserProductions(user.id) : [];

  // Workspace items follow NAV_ITEMS order, gated by capability.
  // We exclude "Productions" since the productions section below covers it.
  const workspaceItems = NAV_ITEMS.filter(
    (item) =>
      item.href !== "/productions" &&
      (!item.capability || can(role, item.capability)),
  );

  return (
    <aside className="rail">
      <Link href="/dashboard" className="rail-brand" aria-label="CallBoard home">
        <div className="rail-mark">C</div>
        <div className="rail-name">
          Call<em>Board</em>
        </div>
      </Link>

      <div className="rail-section">
        <div className="rail-section-h">
          <span>Workspace</span>
        </div>
        {workspaceItems.map((item) => {
          const Icon = item.icon;
          return (
            <RailLink key={item.href} href={item.href}>
              <Icon className="ico" aria-hidden />
              <span>{item.label}</span>
            </RailLink>
          );
        })}
      </div>

      {can(role, "productions:view") && (
        <div className="rail-section">
          <div className="rail-section-h">
            <span>Productions</span>
            {can(role, "productions:manage") && (
              <Link
                href="/productions"
                title="All productions"
                aria-label="All productions"
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
                  style={{ background: dotForId(p.id) }}
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
            {can(role, "settings:manage") && (
              <Link href="/settings" title="Settings" aria-label="Settings">
                <SettingsIcon className="ico" aria-hidden />
              </Link>
            )}
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
