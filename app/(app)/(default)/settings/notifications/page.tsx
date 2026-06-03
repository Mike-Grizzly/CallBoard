import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { getNotificationPreferences } from "@/features/notifications/preferences";
import { NotificationPreferencesForm } from "./notification-preferences-form";

export default async function NotificationSettingsPage() {
  const user = await requireCurrentUser();
  const prefs = await getNotificationPreferences(user.id);

  return (
    <div
      className="page-narrow anim-in"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <Link
        href="/settings"
        className="more-item"
        style={{ alignSelf: "flex-start", gap: 6, padding: "6px 0" }}
      >
        <Icon name="ChevronLeft" className="ico" aria-hidden />
        <span style={{ fontSize: 13 }}>Settings</span>
      </Link>

      <div>
        <div className="h-eyebrow">Account</div>
        <h1 className="h-section" style={{ marginTop: 2 }}>
          Notifications
        </h1>
      </div>

      <NotificationPreferencesForm initial={prefs} />
    </div>
  );
}
