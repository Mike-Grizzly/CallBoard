"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { resolveTour, INTRO_KEY, ALL_TOUR_KEYS } from "@/features/tours/steps";
import { markTourSeen, dismissAllTours } from "@/features/tours/actions";
import { CoachTour } from "./coach-tour";
import { WelcomeModal } from "./welcome-modal";

/**
 * Decides which onboarding UI (if any) to run for the current screen.
 *
 * - First dashboard visit (intro key unseen): shows the "Want a tour?" welcome
 *   modal. "Show me around" starts the dashboard tour; "I'll explore" marks
 *   everything seen so nothing auto-pops.
 * - After that, a screen's tour auto-starts the first time it's reached and its
 *   key isn't in `tours_seen`.
 * - `?tour=1` force-replays the current screen's tour (the Settings "Replay"
 *   links), bypassing the welcome modal; the param is stripped afterwards.
 * - On finish/skip the key is recorded as seen (server + local).
 *
 * Mounted once in the (app) layout; a no-op on screens without a tour.
 */
export function TourController({ seen }: { seen: string[] }) {
  const pathname = usePathname();
  const [seenLocal, setSeenLocal] = useState<string[]>(seen);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const def = resolveTour(pathname);

  useEffect(() => {
    setShowWelcome(false);
    if (!def) {
      setActiveKey(null);
      return;
    }
    const forced =
      new URLSearchParams(window.location.search).get("tour") === "1";
    if (forced) {
      // Drop the param without a navigation so a refresh won't replay.
      window.history.replaceState(null, "", pathname);
      setActiveKey(def.key);
      return;
    }
    // First-ever visit: greet on the dashboard and let the user choose before
    // any tour auto-runs.
    if (pathname === "/dashboard" && !seenLocal.includes(INTRO_KEY)) {
      setShowWelcome(true);
      return;
    }
    if (!seenLocal.includes(def.key)) {
      setActiveKey(def.key);
    }
    // seenLocal intentionally omitted: marking-seen shouldn't re-run the start
    // check (it would just confirm "already seen"); pathname drives it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, def?.key]);

  function handleClose() {
    if (def) {
      setSeenLocal((prev) =>
        prev.includes(def.key) ? prev : [...prev, def.key],
      );
      void markTourSeen(def.key).catch(() => {});
    }
    setActiveKey(null);
  }

  function acceptTour() {
    setSeenLocal((prev) =>
      prev.includes(INTRO_KEY) ? prev : [...prev, INTRO_KEY],
    );
    void markTourSeen(INTRO_KEY).catch(() => {});
    setShowWelcome(false);
    if (def) setActiveKey(def.key);
  }

  function declineTour() {
    // Everything seen — no tour auto-pops anywhere (still replayable later).
    setSeenLocal((prev) => [...new Set([...prev, INTRO_KEY, ...ALL_TOUR_KEYS])]);
    void dismissAllTours().catch(() => {});
    setShowWelcome(false);
  }

  if (showWelcome) {
    return <WelcomeModal onAccept={acceptTour} onDecline={declineTour} />;
  }

  if (!def || activeKey !== def.key) return null;

  return <CoachTour steps={def.steps} onClose={handleClose} />;
}
