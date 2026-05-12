"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import {
  getNotifications,
  markNotificationsRead,
} from "@/features/notifications/actions";
import type { Notification } from "@/db/schema";

interface Props {
  initialUnread: number;
}

export function NotificationBell({ initialUnread }: Props) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        open &&
        !panelRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    startTransition(async () => {
      const rows = await getNotifications();
      setNotifications(rows);
      setLoaded(true);
      if (unread > 0) {
        await markNotificationsRead();
        setUnread(0);
      }
    });
  }

  function formatTime(date: Date): string {
    const now = Date.now();
    const diff = now - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={btnRef}
        type="button"
        className="btn ghost btn-icon"
        title="Notifications"
        aria-label="Notifications"
        onClick={toggle}
        style={{ position: "relative" }}
      >
        <Bell className="ico" aria-hidden />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--c-clay)",
              border: "2px solid var(--bg-elev)",
            }}
          />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="anim-in"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 340,
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,.15)",
            zIndex: 300,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Notifications
          </div>

          {/* Body */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {!loaded || isPending ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--ink-4)",
                }}
              >
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--ink-4)",
                }}
              >
                You&apos;re all caught up!
              </div>
            ) : (
              notifications.map((n) => (
                <NotifRow
                  key={n.id}
                  notification={n}
                  formatTime={formatTime}
                  onNavigate={() => setOpen(false)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({
  notification: n,
  formatTime,
  onNavigate,
}: {
  notification: Notification;
  formatTime: (d: Date) => string;
  onNavigate: () => void;
}) {
  const isUnread = !n.readAt;

  const inner = (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        background: isUnread
          ? "color-mix(in oklch, var(--accent) 6%, transparent)"
          : "transparent",
      }}
    >
      {isUnread && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--accent)",
            flexShrink: 0,
            marginTop: 5,
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{n.title}</div>
        {n.body && (
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-3)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {n.body}
          </div>
        )}
        <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 3 }}>
          {formatTime(n.createdAt)}
        </div>
      </div>
    </div>
  );

  if (n.link) {
    return (
      <Link
        href={n.link}
        onClick={onNavigate}
        style={{ display: "block", textDecoration: "none", color: "inherit" }}
      >
        {inner}
      </Link>
    );
  }

  return <div>{inner}</div>;
}
