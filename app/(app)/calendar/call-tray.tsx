"use client";

import { useEffect, useState } from "react";
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

  return (
    <div className="call-tray-scrim" onMouseDown={onClose}>
      <aside
        className="call-tray"
        role="dialog"
        aria-label="Schedule a call"
        onMouseDown={(e) => e.stopPropagation()}
      >
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
