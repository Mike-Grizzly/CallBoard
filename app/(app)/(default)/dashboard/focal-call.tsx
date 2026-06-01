"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Clipboard, CalendarDays, Check } from "lucide-react";
import { confirmCall } from "@/features/calls/actions";

export type FocalAvatar = { initials: string; color: string };

export type FocalCallProps = {
  callId: string;
  title: string;
  whenLabel: string;
  /** ISO start time, for the live countdown. Null when the call has no time. */
  startIso: string | null;
  isLive: boolean;
  where: string[];
  productionTitle: string;
  productionColorVar: string;
  callsHref: string;
  scriptHref: string;
  called: number;
  confirmed: number;
  confirmedAvatars: FocalAvatar[];
  isMember: boolean;
  myConfirmed: boolean;
};

function useCountdown(startIso: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startIso) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startIso]);
  if (!startIso) return null;
  const diff = new Date(startIso).getTime() - now;
  if (diff <= 0) return { h: 0, m: 0, s: 0 };
  return {
    h: Math.floor(diff / 3.6e6),
    m: Math.floor((diff % 3.6e6) / 6e4),
    s: Math.floor((diff % 6e4) / 1000),
  };
}

export function FocalCall(props: FocalCallProps) {
  const {
    callId,
    title,
    whenLabel,
    startIso,
    isLive,
    where,
    productionTitle,
    productionColorVar,
    callsHref,
    scriptHref,
    called,
    confirmed,
    confirmedAvatars,
    isMember,
    myConfirmed,
  } = props;

  const cd = useCountdown(startIso);
  const [pending, startTransition] = useTransition();

  // Optimistic confirm state
  const [mine, setMine] = useState(myConfirmed);
  const [confirmedCount, setConfirmedCount] = useState(confirmed);

  function toggleConfirm() {
    const next = !mine;
    setMine(next);
    setConfirmedCount((c) => Math.max(0, c + (next ? 1 : -1)));
    startTransition(async () => {
      await confirmCall(callId);
    });
  }

  const pct = called > 0 ? Math.round((confirmedCount / called) * 100) : 0;
  const avatars = confirmedAvatars.slice(0, 5);
  const extra = Math.max(0, confirmedCount - avatars.length);

  return (
    <article className="dd-focal">
      <div className="dd-focal-top">
        <span className="dd-live">
          <span className="dd-live-dot" /> {isLive ? "Live now" : "Next call"}
        </span>
        <span className="dd-focal-prod">
          <span
            className="dd-prod-dot"
            style={{ background: productionColorVar }}
          />
          {productionTitle}
        </span>
      </div>

      <div className="dd-focal-body">
        <div className="dd-focal-when">{whenLabel}</div>
        <h2 className="dd-focal-title">{title}</h2>
        {where.length > 0 && (
          <div className="dd-focal-where">
            {where.map((w, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {i > 0 && <span className="pip" />}
                <span>{w}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="dd-focal-mid">
        <div className="dd-count">
          <span className="dd-count-lbl">{isLive ? "In progress" : "Starts in"}</span>
          <span className="dd-count-val mono">
            {isLive || !cd ? (
              isLive ? "now" : "—"
            ) : (
              <>
                {cd.h}
                <span className="u">h</span>
                {String(cd.m).padStart(2, "0")}
                <span className="u">m</span>
                {String(cd.s).padStart(2, "0")}
                <span className="u" style={{ marginRight: 0 }}>
                  s
                </span>
              </>
            )}
          </span>
        </div>
        <div className="dd-focal-divider" />
        <div className="dd-called">
          <div className="dd-called-row">
            <div className="dd-stack">
              {avatars.map((a, i) => (
                <div
                  key={i}
                  className="avatar"
                  style={{ background: a.color }}
                  aria-hidden
                >
                  {a.initials}
                </div>
              ))}
              {extra > 0 && <div className="avatar more">+{extra}</div>}
              {confirmedCount === 0 && (
                <span className="dd-called-txt muted">No confirmations yet</span>
              )}
            </div>
            {confirmedCount > 0 && (
              <span className="dd-called-txt">
                <b>
                  {confirmedCount} of {called}
                </b>{" "}
                confirmed
              </span>
            )}
          </div>
          <div className="dd-called-bar">
            <div className="dd-called-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="dd-focal-cta">
        {isMember && (
          <button
            type="button"
            className={"dd-btn " + (mine ? "dd-btn-ghost" : "dd-btn-primary")}
            onClick={toggleConfirm}
            disabled={pending}
            data-confirmed={mine ? "1" : "0"}
          >
            <Check size={15} aria-hidden />
            {mine ? "You're confirmed" : "Confirm you'll be there"}
          </button>
        )}
        <Link className="dd-btn dd-btn-ghost" href={callsHref}>
          <Clipboard size={15} aria-hidden /> Open schedule
        </Link>
        <Link className="dd-btn dd-btn-ghost" href={scriptHref}>
          <CalendarDays size={15} aria-hidden /> Your script
        </Link>
      </div>
    </article>
  );
}
