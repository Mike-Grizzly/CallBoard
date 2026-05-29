"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  getCallTrayData,
  type CallTrayMember,
} from "@/features/calls/actions";
import { CallForm } from "@/app/(app)/productions/[slug]/calls/new/call-form";

/**
 * Slide-in rehearsal-call builder. Opens as a right-side drawer on desktop and
 * a bottom sheet on phones (matching the event drawer / day sheet), overlaid on
 * the calendar. Lazily loads the production's cast for the form, then reports
 * success back so the calendar can refresh in place.
 */
export function CallTray({
  slug,
  productionTitle,
  date,
  onClose,
  onCreated,
}: {
  slug: string;
  productionTitle?: string;
  /** YYYY-MM-DD to prefill the date field. */
  date?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [data, setData] = useState<{
    productionId: string;
    cast: CallTrayMember[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCallTrayData(slug).then((res) => {
      if (!active) return;
      if (res.error || !res.productionId) {
        setError(res.error ?? "Could not load this production.");
        return;
      }
      setData({ productionId: res.productionId, cast: res.cast ?? [] });
    });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Drag-down-to-dismiss on the mobile grab bar.
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);

  const onGripDown = (y: number) => {
    dragStart.current = y;
    if (panelRef.current) {
      // The entrance animation uses fill:both, which keeps overriding the
      // inline transform — clear it so the panel can follow the thumb.
      panelRef.current.style.animation = "none";
      panelRef.current.style.transition = "none";
    }
  };
  const onGripMove = (y: number) => {
    if (dragStart.current == null || !panelRef.current) return;
    const dy = Math.max(0, y - dragStart.current);
    panelRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onGripEnd = (y: number) => {
    const panel = panelRef.current;
    if (dragStart.current == null || !panel) return;
    const dy = Math.max(0, y - dragStart.current);
    dragStart.current = null;
    panel.style.transition = "transform 0.2s ease";
    if (dy > 90) {
      // Dragged down far enough — animate out, then close.
      panel.style.transform = "translateY(100%)";
      window.setTimeout(onClose, 180);
    } else if (dy < 6) {
      // A tap on the bar closes too.
      panel.style.transform = "translateY(0)";
      onClose();
    } else {
      // Small drag — snap back.
      panel.style.transform = "translateY(0)";
    }
  };

  return (
    <div className="call-tray-scrim" onMouseDown={onClose}>
      <aside
        ref={panelRef}
        className="call-tray"
        role="dialog"
        aria-label="Schedule a call"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="call-tray-grip-wrap"
          role="button"
          aria-label="Close"
          onTouchStart={(e) => onGripDown(e.touches[0].clientY)}
          onTouchMove={(e) => onGripMove(e.touches[0].clientY)}
          onTouchEnd={(e) => onGripEnd(e.changedTouches[0]?.clientY ?? 0)}
        >
          <span className="call-tray-grip" />
        </div>
        <header className="call-tray-head">
          <div>
            {productionTitle && (
              <div className="call-tray-eyebrow">{productionTitle}</div>
            )}
            <h2>Schedule a call</h2>
          </div>
          <button
            className="btn ghost icon-only sm"
            onClick={onClose}
            title="Close (Esc)"
          >
            <Icon name="X" width={15} height={15} />
          </button>
        </header>

        <div className="call-tray-body">
          {error ? (
            <div className="cform-err">
              <Icon name="AlertTriangle" width={16} height={16} />
              <span>{error}</span>
            </div>
          ) : data === null ? (
            <div className="call-tray-loading">Loading…</div>
          ) : (
            <CallForm
              mode="tray"
              productionId={data.productionId}
              slug={slug}
              castMembers={data.cast}
              prefillDate={date}
              onClose={onClose}
              onCreated={onCreated}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
