"use client";

import { useState } from "react";
import {
  Megaphone,
  Layers,
  Lock,
  AlertTriangle,
  Info,
  Check,
} from "lucide-react";
import { AnnouncementTitleTrigger } from "@/components/announcements/announcement-detail-drawer";
import { AnnouncementAckButton } from "@/app/(app)/(default)/dashboard/announcement-ack-button";
import { AnnouncementPinButton } from "@/app/(app)/(default)/announcements/announcement-pin-button";
import { AnnouncementDeleteButton } from "@/app/(app)/(default)/announcements/announcement-delete-button";
import {
  AnnouncementComposer,
  type ComposerProduction,
} from "./announcement-composer";
import type { MentionMember } from "@/components/ui/mention-textarea";

export type CenterItem = {
  id: string;
  title: string;
  bodyHtml: string;
  scope: "org" | "multi" | "prod";
  scopeLabel: string;
  priority: "normal" | "important" | "urgent";
  requireAck: boolean;
  pinned: boolean;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  relativeTime: string;
  acked: number;
  total: number;
  mine: boolean;
  canPin: boolean;
  canDelete: boolean;
};

type Filter = "all" | "org" | "ack";

export interface AnnouncementsCenterProps {
  eyebrow: string;
  heading: string;
  lede: string;
  items: CenterItem[];
  canCreate: boolean;
  showOrgFilter: boolean;
  permissionBanner?: {
    text: string;
    roleChip?: string;
    name?: string;
  } | null;
  composer: {
    productions: ComposerProduction[];
    orgMemberCount: number;
    canBroadcastOrg: boolean;
    canPin: boolean;
    authorName: string;
    authorRole: string;
    lockedProduction?: { id: string; title: string } | null;
    mentionMembers?: MentionMember[];
  };
}

export function AnnouncementsCenter({
  eyebrow,
  heading,
  lede,
  items,
  canCreate,
  showOrgFilter,
  permissionBanner,
  composer,
}: AnnouncementsCenterProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [toast, setToast] = useState<string | null>(null);

  const counts = {
    all: items.length,
    org: items.filter((a) => a.scope === "org").length,
    ack: items.filter((a) => a.requireAck).length,
  };
  const shown = items.filter((a) =>
    filter === "all" ? true : filter === "org" ? a.scope === "org" : a.requireAck,
  );

  function handleSent(recipientCount: number) {
    setToast(
      `Sent to ${recipientCount} ${recipientCount === 1 ? "person" : "people"}`,
    );
    setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className="ac-center anim-in">
      <div className="ac-head">
        <div>
          <div className="ac-eyebrow">
            <span className="dot" /> {eyebrow}
          </div>
          <h1 className="ac-h1">{heading}</h1>
          <p className="ac-lede">{lede}</p>
        </div>
        {canCreate && (
          <AnnouncementComposer {...composer} onSent={handleSent} />
        )}
      </div>

      {permissionBanner && (
        <div className="ac-perm">
          <span className="ac-perm-ico">
            <Lock size={15} />
          </span>
          <span>{permissionBanner.text}</span>
          {permissionBanner.roleChip && (
            <span className="ac-perm-role">
              <span className="pchip">{permissionBanner.roleChip}</span>
              {permissionBanner.name ? ` · ${permissionBanner.name}` : ""}
            </span>
          )}
        </div>
      )}

      <div className="ac-filters">
        <button
          className="ac-filter"
          data-on={filter === "all" ? "1" : "0"}
          onClick={() => setFilter("all")}
        >
          All <span className="n">{counts.all}</span>
        </button>
        {showOrgFilter && (
          <button
            className="ac-filter"
            data-on={filter === "org" ? "1" : "0"}
            onClick={() => setFilter("org")}
          >
            Company-wide <span className="n">{counts.org}</span>
          </button>
        )}
        <button
          className="ac-filter"
          data-on={filter === "ack" ? "1" : "0"}
          onClick={() => setFilter("ack")}
        >
          Needs ack <span className="n">{counts.ack}</span>
        </button>
        <span className="ac-count-note">
          Showing {shown.length} of {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="ac-empty">
          <Megaphone size={30} aria-hidden />
          <p className="ac-empty-h">No announcements yet</p>
          <p className="ac-empty-sub">
            {canCreate
              ? "Send your first broadcast — it lands on dashboards and phones instantly."
              : "No announcements have been posted yet."}
          </p>
        </div>
      ) : (
        <div className="ac-list">
          {shown.map((a) => (
            <article key={a.id} className="ac-item" data-pri={a.priority}>
              <div className="ac-item-top">
                <span className="ac-scope" data-s={a.scope}>
                  {a.scope === "org" ? (
                    <Layers size={11} />
                  ) : (
                    <Megaphone size={11} />
                  )}{" "}
                  {a.scopeLabel}
                </span>
                {a.priority !== "normal" && (
                  <span className="ac-pri-tag" data-pri={a.priority}>
                    {a.priority === "urgent" ? (
                      <AlertTriangle size={10} />
                    ) : (
                      <Info size={10} />
                    )}{" "}
                    {a.priority}
                  </span>
                )}
                {a.pinned && (
                  <span className="ac-pin-tag">
                    <Check size={10} /> Pinned
                  </span>
                )}
                <span className="ac-item-when mono">{a.relativeTime}</span>
                {(a.canPin || a.canDelete) && (
                  <span className="ac-item-actions">
                    {a.canPin && (
                      <AnnouncementPinButton
                        announcementId={a.id}
                        pinned={a.pinned}
                      />
                    )}
                    {a.canDelete && (
                      <AnnouncementDeleteButton announcementId={a.id} />
                    )}
                  </span>
                )}
              </div>

              <AnnouncementTitleTrigger announcementId={a.id} title={a.title} />

              {a.bodyHtml && (
                <div
                  className="ac-item-body"
                  dangerouslySetInnerHTML={{ __html: a.bodyHtml }}
                />
              )}

              <div className="ac-item-foot">
                <span className="ac-from">
                  <span
                    className="avatar"
                    style={{ background: `var(--c-${a.authorColor})` }}
                  >
                    {a.authorInitials}
                  </span>
                  <span>
                    <b>{a.authorName}</b>
                  </span>
                </span>
                {a.requireAck && (
                  <span className="ac-ack-slot">
                    <AnnouncementAckButton
                      announcementId={a.id}
                      acked={a.mine}
                      count={a.acked}
                      total={a.total}
                    />
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {toast && (
        <div className="ac-toast">
          <span className="tk">
            <Check size={13} />
          </span>{" "}
          {toast}
        </div>
      )}
    </div>
  );
}
