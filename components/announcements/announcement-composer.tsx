"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Megaphone,
  Layers,
  ChevronDown,
  Check,
  X,
  Send,
  Users,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor-lazy";
import type { MentionMember } from "@/components/ui/mention-textarea";
import { createAnnouncement } from "@/features/announcements/actions";

export type ComposerProduction = {
  id: string;
  title: string;
  slug: string;
  status: string;
  color: string | null;
  members: number;
};

type Priority = "normal" | "important" | "urgent";

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "important", label: "Important" },
  { id: "urgent", label: "Urgent" },
];

export interface AnnouncementComposerProps {
  productions: ComposerProduction[];
  orgMemberCount: number;
  /** Whether the user may broadcast to the whole org (productions:manage). */
  canBroadcastOrg: boolean;
  /** Whether the user may pin (productions:manage). */
  canPin: boolean;
  authorName: string;
  authorRole: string;
  /** When set, the audience is fixed to this production (production page). */
  lockedProduction?: { id: string; title: string } | null;
  mentionMembers?: MentionMember[];
  triggerLabel?: string;
  onSent?: (recipientCount: number) => void;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function AnnouncementComposer({
  productions,
  orgMemberCount,
  canBroadcastOrg,
  canPin,
  authorName,
  authorRole,
  lockedProduction,
  mentionMembers,
  triggerLabel = "New announcement",
  onSent,
}: AnnouncementComposerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="ac-new"
        onClick={() => setOpen(true)}
      >
        <Megaphone size={16} aria-hidden /> {triggerLabel}
      </button>
      {open && (
        <ComposerModal
          productions={productions}
          orgMemberCount={orgMemberCount}
          canBroadcastOrg={canBroadcastOrg}
          canPin={canPin}
          authorName={authorName}
          authorRole={authorRole}
          lockedProduction={lockedProduction}
          mentionMembers={mentionMembers}
          onClose={() => setOpen(false)}
          onSent={onSent}
        />
      )}
    </>
  );
}

function ComposerModal({
  productions,
  orgMemberCount,
  canBroadcastOrg,
  canPin,
  authorName,
  authorRole,
  lockedProduction,
  mentionMembers,
  onClose,
  onSent,
}: Omit<AnnouncementComposerProps, "triggerLabel"> & {
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Audience: org-wide flag + selected production ids.
  const [orgWide, setOrgWide] = useState(
    () => !lockedProduction && canBroadcastOrg && productions.length === 0,
  );
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (lockedProduction) return new Set([lockedProduction.id]);
    if (canBroadcastOrg) return new Set();
    return new Set(productions[0] ? [productions[0].id] : []);
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [requireAck, setRequireAck] = useState(true);
  const [pin, setPin] = useState(false);

  const [audOpen, setAudOpen] = useState(false);
  const audRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!audOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (audRef.current && !audRef.current.contains(e.target as Node))
        setAudOpen(false);
    };
    const id = setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [audOpen]);

  const reach = useMemo(() => {
    if (orgWide) return { people: orgMemberCount, prods: productions.length };
    const ids = [...selected];
    const people = ids.reduce(
      (n, id) => n + (productions.find((p) => p.id === id)?.members ?? 0),
      0,
    );
    return { people, prods: ids.length };
  }, [orgWide, selected, productions, orgMemberCount]);

  const hasAudience = orgWide || selected.size > 0;
  const canSend = hasAudience && title.trim().length > 0;

  const scope: "org" | "multi" | "prod" = orgWide
    ? "org"
    : selected.size > 1
      ? "multi"
      : "prod";
  const scopeLabel = orgWide
    ? "All productions"
    : selected.size === 0
      ? "No audience"
      : selected.size === 1
        ? (productions.find((p) => selected.has(p.id))?.title ?? "Production")
        : `${selected.size} productions`;

  function toggleProd(id: string) {
    setOrgWide(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pickOrg() {
    setOrgWide((v) => !v);
    setSelected(new Set());
  }

  function submit() {
    if (!canSend || isPending) return;
    setError(null);
    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("body", body);
    fd.set("priority", priority);
    fd.set("require_ack", requireAck ? "1" : "");
    fd.set("pin", pin && canPin ? "1" : "");
    if (orgWide) {
      fd.set("org_wide", "1");
    } else {
      fd.set("org_wide", "");
      fd.set("production_ids", JSON.stringify([...selected]));
    }
    startTransition(async () => {
      const res = await createAnnouncement(fd);
      if (res.error) {
        setError(res.error);
      } else {
        onSent?.(reach.people);
        onClose();
        router.refresh();
      }
    });
  }

  const bodyText = stripHtml(body);

  // Portal to <body> so the fixed backdrop escapes the page's transformed
  // ancestors (e.g. `.anim-in`, which keeps a transform via `animation-fill:
  // both` and would otherwise trap the overlay inside the content column —
  // clipping the blur and letting the trial banner sit on top).
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="ac-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="ac-modal"
        role="dialog"
        aria-modal="true"
        aria-label="New announcement"
      >
        {/* ── left: form ── */}
        <div className="ac-form">
          <div className="ac-form-head">
            <div>
              <div className="eyebrow">Broadcast</div>
              <h2>New announcement</h2>
            </div>
            <button className="ac-x" onClick={onClose} aria-label="Close">
              <X size={15} />
            </button>
          </div>

          <div className="ac-form-body">
            {/* audience */}
            <div className="ac-field">
              <label className="ac-label">
                <Megaphone size={13} /> Audience
              </label>
              {lockedProduction ? (
                <div className="ac-aud-btn" data-locked="1">
                  <span className="ac-aud-ico">
                    <Megaphone size={16} />
                  </span>
                  <span className="ac-aud-summary">
                    <span className="ac-aud-chip">{lockedProduction.title}</span>
                  </span>
                </div>
              ) : (
                <div className="ac-aud" ref={audRef}>
                  <button
                    type="button"
                    className="ac-aud-btn"
                    data-open={audOpen ? "1" : "0"}
                    onClick={() => setAudOpen((o) => !o)}
                  >
                    <span className="ac-aud-ico">
                      {orgWide ? <Layers size={16} /> : <Megaphone size={16} />}
                    </span>
                    <span className="ac-aud-summary">
                      {!hasAudience && (
                        <span className="ac-aud-placeholder">
                          Choose who receives this…
                        </span>
                      )}
                      {orgWide && (
                        <span className="ac-aud-chip org">
                          <Layers size={12} /> Everyone in the company
                        </span>
                      )}
                      {!orgWide &&
                        [...selected].map((id) => {
                          const p = productions.find((x) => x.id === id);
                          if (!p) return null;
                          return (
                            <span key={id} className="ac-aud-chip">
                              <span
                                className="pd"
                                style={{ background: p.color ?? "var(--ink-4)" }}
                              />
                              {p.title}
                            </span>
                          );
                        })}
                    </span>
                    <ChevronDown size={16} className="ac-aud-caret" />
                  </button>

                  {audOpen && (
                    <div className="ac-aud-pop">
                      {canBroadcastOrg && (
                        <button
                          type="button"
                          className="ac-aud-org"
                          data-on={orgWide ? "1" : "0"}
                          onClick={pickOrg}
                        >
                          <span className="ao-ico">
                            <Layers size={17} />
                          </span>
                          <span className="ao-txt">
                            <b>Everyone in the company</b>
                            <span>
                              All {productions.length} active shows ·{" "}
                              {orgMemberCount} people org-wide
                            </span>
                          </span>
                          <span className="ac-check">
                            <Check size={13} />
                          </span>
                        </button>
                      )}

                      <div className="ac-aud-divide">
                        {canBroadcastOrg
                          ? "Or choose productions"
                          : "Choose productions"}
                      </div>
                      <div className="ac-aud-list">
                        {productions.length === 0 && (
                          <div className="ac-aud-empty">
                            No active productions to post to.
                          </div>
                        )}
                        {productions.map((p) => {
                          const on = !orgWide && selected.has(p.id);
                          return (
                            <button
                              type="button"
                              key={p.id}
                              className="ac-aud-row"
                              data-on={on ? "1" : "0"}
                              onClick={() => toggleProd(p.id)}
                            >
                              <span className="ac-check">
                                <Check size={13} />
                              </span>
                              <span
                                className="pd"
                                style={{
                                  background: p.color ?? "var(--ink-4)",
                                }}
                              />
                              <span className="ar-txt">
                                <b>{p.title}</b>
                                <span>{p.status}</span>
                              </span>
                              <span className="ar-n">{p.members}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="ac-aud-foot">
                        <span className="sum">
                          {hasAudience ? (
                            <>
                              <b>{reach.people}</b>{" "}
                              {reach.people === 1 ? "person" : "people"} ·{" "}
                              {reach.prods} {reach.prods === 1 ? "show" : "shows"}
                            </>
                          ) : (
                            "No recipients yet"
                          )}
                        </span>
                        {hasAudience && (
                          <button
                            type="button"
                            onClick={() => {
                              setOrgWide(false);
                              setSelected(new Set());
                            }}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* title */}
            <div className="ac-field">
              <label className="ac-label">Title</label>
              <input
                className="ac-input"
                maxLength={120}
                placeholder="e.g. Sitzprobe moved to Saturday 1 PM"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* message */}
            <div className="ac-field">
              <label className="ac-label">
                Message <span className="opt">optional</span>
              </label>
              <RichTextEditor
                content={body}
                onChange={setBody}
                placeholder="Add the details — what's changing, when, and what people need to do."
                members={mentionMembers}
              />
            </div>

            {/* priority */}
            <div className="ac-field">
              <label className="ac-label">Priority</label>
              <div className="ac-seg">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    data-pri={p.id}
                    data-on={priority === p.id ? "1" : "0"}
                    onClick={() => setPriority(p.id)}
                  >
                    <span className="pd" /> {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* require ack */}
            <div className="ac-toggle">
              <div className="tt">
                <b>Require acknowledgement</b>
                <span>
                  Recipients tap “Acknowledge” — you&apos;ll see who&apos;s read
                  it.
                </span>
              </div>
              <button
                type="button"
                className="ac-switch"
                data-on={requireAck ? "1" : "0"}
                onClick={() => setRequireAck((v) => !v)}
                aria-label="Require acknowledgement"
              />
            </div>

            {/* pin */}
            {canPin && (
              <div className="ac-toggle">
                <div className="tt">
                  <b>Pin to dashboards</b>
                  <span>
                    Keep it at the top of the Announcements list until you unpin.
                  </span>
                </div>
                <button
                  type="button"
                  className="ac-switch"
                  data-on={pin ? "1" : "0"}
                  onClick={() => setPin((v) => !v)}
                  aria-label="Pin to dashboards"
                />
              </div>
            )}
          </div>

          <div className="ac-form-foot">
            <span className="ac-foot-recip">
              <Users size={14} /> Sending to <b>{reach.people}</b>{" "}
              {reach.people === 1 ? "person" : "people"}
            </span>
            {error && (
              <span style={{ fontSize: 12.5, color: "var(--accent)" }}>
                {error}
              </span>
            )}
            <div style={{ flex: 1 }} />
            <button className="ac-btn" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button
              className="ac-btn primary"
              onClick={submit}
              disabled={!canSend || isPending}
            >
              <Send size={14} /> {isPending ? "Sending…" : "Send announcement"}
            </button>
          </div>
        </div>

        {/* ── right: live preview ── */}
        <div className="ac-preview">
          <div className="ac-preview-head">
            <div className="eyebrow">
              <Sparkles size={12} /> Live preview
            </div>
            <p>How it lands in everyone&apos;s Announcements list.</p>
          </div>
          <div className="ac-preview-body">
            <div className="ac-preview-label">On the dashboard</div>
            <div className="ac-pcard">
              <div className="ac-pcard-top">
                <span className="ac-scope" data-s={scope}>
                  {scope === "org" ? <Layers size={11} /> : <Megaphone size={11} />}{" "}
                  {scopeLabel}
                </span>
                {priority !== "normal" && (
                  <span className="ac-pri-tag" data-pri={priority}>
                    {priority === "urgent" ? (
                      <AlertTriangle size={10} />
                    ) : (
                      <Info size={10} />
                    )}{" "}
                    {priority}
                  </span>
                )}
                <span className="ac-item-when" style={{ marginLeft: "auto" }}>
                  now
                </span>
              </div>
              <h4>{title.trim() || "Your announcement title"}</h4>
              <p>
                {bodyText ||
                  "The message body shows up here, exactly as recipients will read it on their dashboard and phone."}
              </p>
              <div className="ac-pcard-from">
                <b>{authorName}</b> · {authorRole}
              </div>
              {requireAck ? (
                <div className="ac-pcard-ackbtn">
                  <div className="b1">
                    <Check size={13} /> Acknowledge
                  </div>
                  <div className="b2">Later</div>
                </div>
              ) : (
                <div className="ac-pcard-ackbar">
                  <span
                    className="ac-pcard-from"
                    style={{ color: "var(--ink-4)" }}
                  >
                    Posts to {reach.people} dashboards
                  </span>
                </div>
              )}
            </div>

            <div className="ac-reach">
              <div>
                <div className="rn">{reach.people}</div>
                <div className="rl">
                  {reach.people === 1 ? "person reached" : "people reached"}
                </div>
              </div>
              <div>
                <div className="rn">
                  {orgWide ? productions.length : reach.prods}
                </div>
                <div className="rl">
                  {(orgWide ? productions.length : reach.prods) === 1
                    ? "production"
                    : "productions"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
