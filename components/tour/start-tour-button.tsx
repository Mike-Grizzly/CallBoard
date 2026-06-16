"use client";

import { HelpCircle } from "lucide-react";

/**
 * On-demand "Take a tour" launcher. Dispatches a window event the
 * TourController (mounted in the app layout) listens for; the controller
 * resolves which tour matches the current screen and starts it fresh —
 * regardless of whether it's been seen. Lets users replay a screen's
 * walkthrough anytime, not just on first visit.
 *
 * Renders nothing on screens without a tour would be ideal, but the button is
 * only placed where a tour exists (the production hub + its tools), so it
 * always has something to start.
 */
export function StartTourButton({
  className = "btn ghost",
  label = "Take a tour",
  iconOnly = false,
}: {
  className?: string;
  label?: string;
  iconOnly?: boolean;
}) {
  return (
    <button
      type="button"
      className={className}
      title={label}
      aria-label={label}
      onClick={() =>
        window.dispatchEvent(new CustomEvent("proscene:start-tour"))
      }
    >
      <HelpCircle className="ico" aria-hidden />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}
