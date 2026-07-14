"use client";

import { useEffect, useState, useTransition } from "react";
import { Megaphone, Check, X } from "lucide-react";
import { Drawer } from "@/components/ui/drawer/drawer";
import {
  getAnnouncementDetail,
  acknowledgeAnnouncement,
} from "@/features/announcements/actions";
import type {
  AnnouncementDetail,
  AnnouncementRosterEntry,
} from "@/features/announcements/queries";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relAck(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Clickable announcement title that opens a detail drawer (right-side on
 * desktop, bottom sheet on mobile) with the full announcement and an
 * acknowledgement roster — who has and hasn't acknowledged.
 */
export function AnnouncementTitleTrigger({
  announcementId,
  title,
}: {
  announcementId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="ann-title ann-title-btn"
        onClick={() => setOpen(true)}
      >
        {title}
      </button>
      {open && (
        <AnnouncementDrawer
          announcementId={announcementId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function AnnouncementDrawer({
  announcementId,
  onClose,
}: {
  announcementId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<AnnouncementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    getAnnouncementDetail(announcementId).then((res) => {
      if (!active) return;
      if (res.error || !res.data) setError(res.error ?? "Not found.");
      else setData(res.data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [announcementId]);

  function toggleAck() {
    if (!data) return;
    const next = !data.mineAcked;
    const nowIso = new Date().toISOString();
    setData((d) =>
      d
        ? {
            ...d,
            mineAcked: next,
            ackedCount: Math.max(0, d.ackedCount + (next ? 1 : -1)),
            roster: d.roster.map((r) =>
              r.isMe
                ? { ...r, acked: next, ackedAtIso: next ? nowIso : null }
                : r,
            ),
          }
        : d,
    );
    startTransition(async () => {
      await acknowledgeAnnouncement(announcementId);
    });
  }

  return (
    <Drawer open onClose={onClose} width="460px" ariaLabel="Announcement detail">
      <div className="ann-drawer">
        <div className="ann-drawer-h">
          {data && (
            <span className="pill" data-c={data.scopeTone}>
              {data.scopeTone === "amber" && <Megaphone size={10} />}
              {data.scopeLabel}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button
            className="pp-icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {loading ? (
          <div className="ann-drawer-empty">Loading…</div>
        ) : error ? (
          <div className="ann-drawer-empty">{error}</div>
        ) : data ? (
          <>
            <div className="ann-drawer-hero">
              <h2>{data.title}</h2>
              <div className="ann-drawer-sub">
                {data.authorName} · {fmtDate(data.createdAtIso)}
              </div>
            </div>

            {data.bodyHtml && (
              <div
                className="ann-drawer-body prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: data.bodyHtml }}
              />
            )}

            <div className="ann-drawer-ackbar">
              <button
                type="button"
                className={"dd-ack-btn" + (data.mineAcked ? " is-acked" : "")}
                onClick={toggleAck}
              >
                <Check size={13} aria-hidden />
                {data.mineAcked ? "Acknowledged" : "Acknowledge"}
              </button>
              <span className="ann-drawer-ackcount mono">
                {data.ackedCount}/{data.total} acknowledged
              </span>
            </div>

            <div className="ann-drawer-section">
              <h3>Acknowledgements</h3>
              {data.roster.length === 0 ? (
                <div className="ann-drawer-empty-sm">No audience yet.</div>
              ) : (
                <ul className="ann-roster">
                  {data.roster.map((r) => (
                    <RosterRow key={r.userId} entry={r} />
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Drawer>
  );
}

function RosterRow({ entry }: { entry: AnnouncementRosterEntry }) {
  return (
    <li className="ann-roster-row" data-acked={entry.acked ? "1" : "0"}>
      <span className="ann-roster-av">{entry.initials}</span>
      <span className="ann-roster-name">
        {entry.name}
        {entry.isMe && <span className="ann-roster-you">You</span>}
      </span>
      {entry.acked ? (
        <span className="ann-roster-ack">
          <Check size={13} aria-hidden /> {relAck(entry.ackedAtIso)}
        </span>
      ) : (
        <span className="ann-roster-pending">Not yet</span>
      )}
    </li>
  );
}
