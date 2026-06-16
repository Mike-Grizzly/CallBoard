"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { resetAllTours } from "@/features/tours/actions";

/**
 * Settings control for re-running the in-app coachmark walkthroughs.
 *
 * "Replay all" clears every seen-flag (so each screen's tour surfaces again as
 * the user revisits it) and drops them on the dashboard with its tour forced on
 * via `?tour=1`. The two direct links force a single screen's tour without
 * touching the others' seen state.
 */
export function TourReplay() {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function replayAll() {
    setWorking(true);
    try {
      await resetAllTours();
    } catch {
      // Non-fatal — the forced ?tour=1 below still replays the dashboard tour.
    }
    router.push("/dashboard?tour=1");
  }

  return (
    <div className="card card-pad">
      <div className="h-eyebrow">Getting started</div>
      <h2 className="h-section" style={{ marginTop: 2, marginBottom: 4 }}>
        Walkthroughs
      </h2>
      <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
        Replay the guided tours that point out what each screen does. Handy when
        a new teammate joins, or if you just want a refresher.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          className="btn primary"
          onClick={replayAll}
          disabled={working}
        >
          <Icon name="Sparkles" className="ico" aria-hidden />
          <span>{working ? "Starting…" : "Replay all walkthroughs"}</span>
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => router.push("/dashboard?tour=1")}
          disabled={working}
        >
          Dashboard tour
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => router.push("/productions?tour=1")}
          disabled={working}
        >
          Productions tour
        </button>
      </div>
    </div>
  );
}
