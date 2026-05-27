"use client";

import { useState, useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { sendReport } from "@/features/reports/send-report";

type Member = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

const AVATAR_PALETTE = ["clay", "sage", "dusk", "amber", "plum", "sand"] as const;

function avatarColor(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function initials(m: Member): string {
  if (m.firstName && m.lastName) {
    return `${m.firstName[0]}${m.lastName[0]}`.toUpperCase();
  }
  if (m.firstName) return m.firstName[0].toUpperCase();
  return m.email[0].toUpperCase();
}

function displayName(m: Member): string {
  return m.firstName || m.lastName
    ? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()
    : m.email;
}

export function EmailReportButton({
  reportId,
  slug,
  members,
  autoOpen = false,
}: {
  reportId: string;
  slug: string;
  members: Member[];
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(members.map((m) => m.userId)),
  );
  const [recentStatus, setRecentStatus] = useState<"idle" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  // Strip the ?email=1 flag once the modal has opened so a page refresh
  // doesn't keep re-popping it.
  useEffect(() => {
    if (autoOpen) {
      router.replace(pathname);
    }
    // Run once per mount — the autoOpen value is captured at first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const allSelected = selected.size === members.length && members.length > 0;

  function toggleAll() {
    setSelected(
      allSelected ? new Set() : new Set(members.map((m) => m.userId)),
    );
  }

  function toggleMember(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function handleSend() {
    const emails = members
      .filter((m) => selected.has(m.userId))
      .map((m) => m.email);

    startTransition(async () => {
      const result = await sendReport(reportId, slug, emails);
      if (result.success) {
        setRecentStatus("sent");
        setOpen(false);
        setTimeout(() => setRecentStatus("idle"), 3000);
      } else {
        setRecentStatus("error");
        setErrorMsg(result.error ?? "Failed to send.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className="btn"
        onClick={() => {
          setRecentStatus("idle");
          setOpen(true);
        }}
      >
        {recentStatus === "sent" ? (
          <>
            <Icon name="Check" size={14} aria-hidden />
            <span>Sent</span>
          </>
        ) : (
          <>
            <Icon name="Mail" size={14} aria-hidden />
            <span>Email report</span>
          </>
        )}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20, 12, 10, 0.55)",
            backdropFilter: "blur(2px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card anim-in"
            style={{
              width: "min(520px, 100%)",
              maxHeight: "min(80vh, 720px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              className="row-between"
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div className="row" style={{ gap: 10 }}>
                <div
                  className="notif-ico"
                  data-c="accent"
                  style={{ width: 28, height: 28 }}
                >
                  <Icon name="Mail" size={14} aria-hidden />
                </div>
                <div>
                  <div className="h-eyebrow" style={{ marginBottom: 2 }}>
                    Distribute report
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Send to</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn ghost btn-icon"
                aria-label="Close"
              >
                <Icon name="X" size={14} aria-hidden />
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
              <label
                className="row"
                style={{
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 6,
                  cursor: members.length === 0 ? "default" : "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={members.length === 0}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>
                  Entire production
                </span>
                <span
                  className="mono muted"
                  style={{ marginLeft: "auto", fontSize: 12 }}
                >
                  {members.length}
                </span>
              </label>

              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  margin: "6px 4px",
                }}
              />

              {members.length === 0 ? (
                <div className="muted" style={{ padding: "12px 10px", fontSize: 13 }}>
                  No members assigned to this production.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {members.map((m) => {
                    const checked = selected.has(m.userId);
                    return (
                      <label
                        key={m.userId}
                        className="row"
                        style={{
                          gap: 10,
                          padding: "8px 10px",
                          borderRadius: 6,
                          cursor: "pointer",
                          background: checked ? "var(--bg-sunken)" : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMember(m.userId)}
                          style={{ width: 16, height: 16 }}
                        />
                        <div
                          className="notif-ico"
                          data-c={avatarColor(m.email)}
                          style={{ width: 28, height: 28, fontSize: 11, fontWeight: 600 }}
                        >
                          {initials(m)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {displayName(m)}
                          </div>
                          <div
                            className="muted"
                            style={{
                              fontSize: 12,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {m.email}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {recentStatus === "error" && (
              <div
                className="row"
                style={{
                  gap: 8,
                  padding: "10px 16px",
                  background: "var(--c-amber-soft)",
                  fontSize: 12.5,
                }}
              >
                <Icon name="AlertTriangle" size={14} aria-hidden />
                <span>{errorMsg}</span>
              </div>
            )}

            <div
              className="row"
              style={{
                justifyContent: "flex-end",
                gap: 8,
                padding: "12px 18px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn"
              >
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={selected.size === 0 || isPending}
                className="btn primary"
              >
                <Icon name="Send" size={14} aria-hidden />
                <span>
                  {isPending
                    ? "Sending…"
                    : `Send to ${selected.size} ${selected.size === 1 ? "person" : "people"}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
