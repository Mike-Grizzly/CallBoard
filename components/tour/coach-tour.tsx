"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  const [visibleSteps, setVisibleSteps] = useState<TourStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(0);

  // Measure the card's real height so we can keep it fully on-screen (a tall
  // card near the bottom edge — e.g. the last step pointing at the settings
  // link in the bottom-left — would otherwise hang off the viewport). Re-runs
  // when the step or the anchor rect changes; the threshold check stops it
  // from looping on its own state update.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const h = el.getBoundingClientRect().height;
    setCardH((prev) => (Math.abs(prev - h) > 1 ? h : prev));
  }, [rect, index]);

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

  if (typeof document === "undefined" || !step || !rect) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const hole = {
    top: rect.top - SPOTLIGHT_PAD,
    left: rect.left - SPOTLIGHT_PAD,
    width: rect.width + SPOTLIGHT_PAD * 2,
    height: rect.height + SPOTLIGHT_PAD * 2,
  };

  // Decide tooltip side: honour the step's preference unless it would clip,
  // then fall back to whichever side has room. Uses the measured card height
  // so the "does it fit below/above" check is accurate.
  const margin = 12;
  const needed = cardH + margin + VIEWPORT_PAD;
  const spaceBelow = vh - (rect.top + rect.height);
  const spaceAbove = rect.top;
  let placement = step.placement ?? "bottom";
  if (placement === "bottom" && spaceBelow < needed && spaceAbove > spaceBelow)
    placement = "top";
  if (placement === "top" && spaceAbove < needed && spaceBelow > spaceAbove)
    placement = "bottom";

  let cardTop: number;
  let cardLeft: number;
  if (placement === "top") {
    cardTop = hole.top - margin - cardH;
    cardLeft = rect.left + rect.width / 2 - CARD_WIDTH / 2;
  } else if (placement === "left") {
    cardTop = rect.top;
    cardLeft = hole.left - CARD_WIDTH - margin;
  } else if (placement === "right") {
    cardTop = rect.top;
    cardLeft = hole.left + hole.width + margin;
  } else {
    cardTop = hole.top + hole.height + margin;
    cardLeft = rect.left + rect.width / 2 - CARD_WIDTH / 2;
  }

  // Clamp fully inside the viewport using the real card height, so the card is
  // never pushed partly off the bottom/right and stays clickable.
  cardLeft = Math.max(
    VIEWPORT_PAD,
    Math.min(cardLeft, vw - CARD_WIDTH - VIEWPORT_PAD),
  );
  cardTop = Math.max(
    VIEWPORT_PAD,
    Math.min(cardTop, Math.max(VIEWPORT_PAD, vh - cardH - VIEWPORT_PAD)),
  );

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
        ref={cardRef}
        className="tour-card card"
        style={{ top: cardTop, left: cardLeft, width: CARD_WIDTH }}
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
