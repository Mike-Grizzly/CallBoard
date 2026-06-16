"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { resolveTour } from "@/features/tours/steps";
import { markTourSeen } from "@/features/tours/actions";
import { CoachTour } from "./coach-tour";

/**
 * Decides which coachmark tour (if any) to run for the current screen.
 *
 * - Auto-starts a tour the first time a user reaches a screen whose tour key
 *   isn't in their `tours_seen`.
 * - Force-replays when the URL carries `?tour=1` (the "Replay" links in
 *   Settings point here), regardless of seen state; the param is stripped
 *   afterwards so a reload doesn't restart it.
 * - On finish/skip it records the key as seen (server) and locally, so it
 *   won't auto-start again this session or next.
 *
 * Mounted once in the (app) layout; it's a no-op on screens without a tour.
 */
export function TourController({ seen }: { seen: string[] }) {
  const pathname = usePathname();
  const [seenLocal, setSeenLocal] = useState<string[]>(seen);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const def = resolveTour(pathname);

  useEffect(() => {
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
    if (!seenLocal.includes(def.key)) {
      setActiveKey(def.key);
    }
    // seenLocal intentionally omitted: marking-seen shouldn't re-run the
    // start check (it would just confirm "already seen"); pathname drives it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, def?.key]);

  if (!def || activeKey !== def.key) return null;

  function handleClose() {
    if (def) {
      setSeenLocal((prev) =>
        prev.includes(def.key) ? prev : [...prev, def.key],
      );
      void markTourSeen(def.key).catch(() => {});
    }
    setActiveKey(null);
  }

  return <CoachTour steps={def.steps} onClose={handleClose} />;
}
