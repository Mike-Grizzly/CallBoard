import { useSyncExternalStore } from "react";

// Phones get the slide-in nav drawer and a view-only mode for the mouse-built
// blocking and script tools. 720px matches the mobile breakpoint in globals.css.
const PHONE_QUERY = "(max-width: 720px)";

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(PHONE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(PHONE_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * True when the viewport is at phone width (<=720px). Backed by
 * `useSyncExternalStore` so it is SSR-safe (returns false on the server)
 * and updates on viewport resize / orientation change.
 */
export function useIsPhone(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
