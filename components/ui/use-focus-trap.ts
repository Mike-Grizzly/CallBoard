"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(",");

/**
 * Focus management for overlays (S4). When `active` becomes true it records the
 * element that had focus (the trigger), moves focus into the overlay if nothing
 * inside is focused yet, and traps Tab / Shift+Tab so keyboard focus cycles
 * within the overlay instead of escaping to the page behind it. On deactivate /
 * unmount it returns focus to the trigger.
 *
 * Attach the returned ref to the overlay's container element. Overlays that set
 * their own initial focus (e.g. ConfirmDialog's autoFocus'd confirm button)
 * keep it — the hook only seeds focus when the container has none.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  active: boolean,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;
    const node: T | null = ref.current;
    if (!node) return;
    const container: T = node;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Seed focus only if the overlay didn't already set its own (autoFocus).
    if (!container.contains(document.activeElement)) {
      focusable()[0]?.focus();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const el = document.activeElement;
      if (e.shiftKey) {
        if (el === first || !container.contains(el)) {
          e.preventDefault();
          last.focus();
        }
      } else if (el === last || !container.contains(el)) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", onKey);
    return () => {
      container.removeEventListener("keydown", onKey);
      // Return focus to the trigger, if it's still in the document.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return ref;
}
