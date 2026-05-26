import Link from "next/link";
import { LogOut } from "lucide-react";
import { Icon, type IconName } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can, type Capability } from "@/lib/permissions";
import { logout } from "@/app/actions/auth";

interface MoreItem {
  label: string;
  href: string;
  icon: IconName;
  capability?: Capability;
  trail?: string;
}

// Destinations not already on the bottom tab bar (Today / Calendar /
// Reports / Notes). Capability-gated to match the desktop rail.
const ITEMS: MoreItem[] = [
  { label: "Productions", href: "/productions", icon: "Theater", capability: "productions:view" },
  { label: "Documents", href: "/documents", icon: "FolderOpen", capability: "documents:view" },
  { label: "Announcements", href: "/announcements", icon: "Megaphone", capability: "announcements:view" },
  { label: "Activity", href: "/activity", icon: "Activity", capability: "activity:view" },
  { label: "People", href: "/people", icon: "Users", capability: "settings:manage" },
  { label: "Settings", href: "/settings", icon: "Settings", capability: "settings:manage" },
];

function initialsFor(firstName: string, lastName: string, email: string) {
  const a = (firstName || "").trim()[0];
  const b = (lastName || "").trim()[0];
  if (a || b) return `${a ?? ""}${b ?? ""}`.toUpperCase();
  return (email || "?").slice(0, 2).toUpperCase();
}

export default async function MorePage() {
  const user = await requireCurrentUser();
  const items = ITEMS.filter((item) => !item.capability || can(user.role, item.capability));
  const displayName =
    user.firstName || user.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.email;

  return (
    <div className="more-page">
      <h1 className="more-h">More</h1>

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
              {item.trail && <span className="more-item-trail">{item.trail}</span>}
              <Icon name="ChevronRight" className="more-item-chev" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <form action={logout} className="more-logout">
        <button type="submit" className="btn ghost">
          <LogOut className="ico" aria-hidden />
          <span>Sign out</span>
        </button>
      </form>
    </div>
  );
}
