import Link from "next/link";
import { LogOut } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { ThemeControl } from "@/components/app-shell/theme-control";
import { getThemePref } from "@/lib/theme-server";
import { navItemsFor } from "@/components/app-shell/nav-items";
import { NotificationBell } from "@/components/app-shell/notification-bell";
import { getUnreadNotificationCount } from "@/features/notifications/actions";

function initialsFor(firstName: string, lastName: string, email: string) {
  const a = (firstName || "").trim()[0];
  const b = (lastName || "").trim()[0];
  if (a || b) return `${a ?? ""}${b ?? ""}`.toUpperCase();
  return (email || "?").slice(0, 2).toUpperCase();
}

export default async function MorePage() {
  const user = await requireCurrentUser();
  const themePref = await getThemePref();
  const unreadCount = await getUnreadNotificationCount();
  // Destinations not already on the bottom tab bar, from the shared nav source
  // (N4) — gating stays in lockstep with the desktop rail.
  const items = navItemsFor("more", user.role);
  const displayName =
    user.firstName || user.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.email;

  return (
    <div className="more-page">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 className="more-h" style={{ margin: 0 }}>
          More
        </h1>
        <NotificationBell initialUnread={unreadCount} />
      </div>

      <div className="more-user-card">
        <div className="avatar" aria-hidden>
          {initialsFor(user.firstName, user.lastName, user.email)}
        </div>
        <div className="more-user-meta">
          <b>{displayName}</b>
          <span style={{ textTransform: "capitalize" }}>{user.role}</span>
        </div>
      </div>

      <ul className="more-list" role="list">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="more-item">
              <span className="more-item-ico">
                <Icon name={item.icon} aria-hidden />
              </span>
              <span className="more-item-label">{item.label}</span>
              <Icon name="ChevronRight" className="more-item-chev" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <div className="more-appearance">
        <div className="h-eyebrow" style={{ marginBottom: 8 }}>
          Appearance
        </div>
        <ThemeControl variant="segmented" initialPref={themePref} />
      </div>

      <form action={logout} className="more-logout">
        <button type="submit" className="btn ghost">
          <LogOut className="ico" aria-hidden />
          <span>Sign out</span>
        </button>
      </form>
    </div>
  );
}
