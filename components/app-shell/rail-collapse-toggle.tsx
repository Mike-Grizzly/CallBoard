"use client";

import { useSyncExternalStore } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

// The collapsed flag lives on `body[data-rail-collapsed]` — set pre-paint by the
// inline script in the root layout (so there's no flash) and persisted to
// localStorage. We read it through useSyncExternalStore so the button stays in
// sync without a setState-in-effect, and hydration matches the server snapshot.
const RAIL_EVENT = "rail-collapse-change";

function subscribe(cb: () => void) {
  window.addEventListener(RAIL_EVENT, cb);
  return () => window.removeEventListener(RAIL_EVENT, cb);
}
function getSnapshot() {
  return document.body.dataset.railCollapsed === "1";
}
function getServerSnapshot() {
  return false;
}

/**
 * Collapses the desktop rail to a slim icon strip so any page gets more room.
 * For true full-screen work, Focus mode is the path — this just trims chrome.
 */
export function RailCollapseToggle() {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function toggle() {
    const next = !collapsed;
    if (next) document.body.dataset.railCollapsed = "1";
    else delete document.body.dataset.railCollapsed;
    try {
      localStorage.setItem("rail-collapsed", next ? "1" : "0");
    } catch {
      /* private mode / storage disabled — non-fatal */
    }
    window.dispatchEvent(new Event(RAIL_EVENT));
  }

  return (
    <button
      type="button"
      className="rail-collapse"
      onClick={toggle}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-pressed={collapsed}
    >
      {collapsed ? (
        <PanelLeftOpen size={16} aria-hidden />
      ) : (
        <PanelLeftClose size={16} aria-hidden />
      )}
      <span className="rail-collapse-label">Collapse sidebar</span>
    </button>
  );
}
