"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { TourStep } from "@/features/tours/steps";

type Rect = { top: number; left: number; width: number; height: number };

const CARD_WIDTH = 320;
const VIEWPORT_PAD = 12;
const SPOTLIGHT_PAD = 8;

function readRect(anchor: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  // A zero-size box (display:none / not laid out) is treated as absent.
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/**
 * Spotlight coachmark tour. Walks the user through `steps` one at a time,
 * dimming the screen and highlighting the anchored element with a tooltip.
 *
 * Steps whose anchor can't be found are dropped at start; if none remain the
 * tour closes immediately as a no-op. `onClose(completed)` fires on finish
 * (completed=true), Skip/Escape, or that empty no-op (completed=false) — the
 * controller persists "seen" in every case so a tour with no visible anchors
 * for this user doesn't keep re-trying.
 */
export function CoachTour({
  steps,
  onClose,
}: {
  steps: TourStep[];
  onClose: (completed: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<TourStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => setMounted(true), []);

  // Resolve which steps actually have anchors on this screen for this user.
  useEffect(() => {
    const present = steps.filter((s) => readRect(s.anchor) !== null);
    if (present.length === 0) {
      onClose(false);
      return;
    }
    setVisibleSteps(present);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = visibleSteps?.[index];

  const measure = useCallback(() => {
    if (!step) return;
    setRect(readRect(step.anchor));
  }, [step]);

  // Bring the target into view, then measure. Re-measure on scroll/resize so
  // the spotlight tracks the element if the page moves underneath it.
  useLayoutEffect(() => {
    if (!step) return;
    const el = document.querySelector<HTMLElement>(
      `[data-tour="${step.anchor}"]`,
    );
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    measure();
    const t = window.setTimeout(measure, 350);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [step, measure]);

  const total = visibleSteps?.length ?? 0;
  const isLast = index >= total - 1;

  const next = useCallback(() => {
    if (isLast) onClose(true);
    else setIndex((i) => i + 1);
  }, [isLast, onClose]);

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Keyboard nav. Escape dismisses; arrows / Enter move.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose(false);
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, onClose]);

  if (!mounted || !step || !rect) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const hole = {
    top: rect.top - SPOTLIGHT_PAD,
    left: rect.left - SPOTLIGHT_PAD,
    width: rect.width + SPOTLIGHT_PAD * 2,
    height: rect.height + SPOTLIGHT_PAD * 2,
  };

  // Decide tooltip side: honour the step's preference unless it would clip,
  // then fall back to whichever side has room (below → above → right → left).
  const spaceBelow = vh - (rect.top + rect.height);
  const spaceAbove = rect.top;
  let placement = step.placement ?? "bottom";
  if (placement === "bottom" && spaceBelow < 180 && spaceAbove > spaceBelow)
    placement = "top";
  if (placement === "top" && spaceAbove < 180 && spaceBelow > spaceAbove)
    placement = "bottom";

  let cardTop: number;
  let cardLeft: number;
  if (placement === "top") {
    cardTop = hole.top - 12;
    cardLeft = rect.left + rect.width / 2 - CARD_WIDTH / 2;
  } else if (placement === "left") {
    cardTop = rect.top;
    cardLeft = hole.left - CARD_WIDTH - 12;
  } else if (placement === "right") {
    cardTop = rect.top;
    cardLeft = hole.left + hole.width + 12;
  } else {
    cardTop = hole.top + hole.height + 12;
    cardLeft = rect.left + rect.width / 2 - CARD_WIDTH / 2;
  }

  // Clamp inside the viewport. For top placement the card grows upward, so
  // translateY(-100%) is applied via the style below.
  cardLeft = Math.max(
    VIEWPORT_PAD,
    Math.min(cardLeft, vw - CARD_WIDTH - VIEWPORT_PAD),
  );
  cardTop = Math.max(VIEWPORT_PAD, Math.min(cardTop, vh - VIEWPORT_PAD));

  return createPortal(
    <div className="tour-root" role="dialog" aria-modal="true" aria-label={step.title}>
      {/* Click blocker — transparent, captures interaction everywhere so the
          page underneath can't be operated mid-tour. The dim + ring below it
          still show through (it's transparent). */}
      <div
        className="tour-blocker"
        onClick={(e) => {
          // A click on the dim area advances, matching common tour UX.
          if (e.target === e.currentTarget) next();
        }}
      />

      {/* Spotlight: a box over the anchor whose huge box-shadow dims the rest. */}
      <div
        className="tour-spot"
        style={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
        }}
      />

      {/* Tooltip card */}
      <div
        className="tour-card card"
        style={{
          top: cardTop,
          left: cardLeft,
          width: CARD_WIDTH,
          transform: placement === "top" ? "translateY(-100%)" : undefined,
        }}
      >
        <div className="tour-step-count">
          Step {index + 1} of {total}
        </div>
        <h3 className="tour-card-title">{step.title}</h3>
        <p className="tour-card-body">{step.body}</p>
        <div className="tour-card-foot">
          <button
            type="button"
            className="tour-skip"
            onClick={() => onClose(false)}
          >
            Skip tour
          </button>
          <div className="tour-card-nav">
            {index > 0 && (
              <button type="button" className="btn ghost" onClick={back}>
                Back
              </button>
            )}
            <button type="button" className="btn primary" onClick={next}>
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
