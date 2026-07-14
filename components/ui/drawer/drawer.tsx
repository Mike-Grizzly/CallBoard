"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/components/ui/use-focus-trap";
import { DRAWER_DURATION_MS } from "./drawer.constants";
import "./drawer.css";

type DrawerProps = {
  /** Whether the drawer is open. Keep <Drawer> mounted (don't wrap it in
   *  `{open && ...}`) so the exit animation can play when this flips to false. */
  open: boolean;
  /** Called when the user dismisses via backdrop, Escape, or a close control. */
  onClose: () => void;
  children: ReactNode;
  /** Edge the panel slides from on desktop. Default "right". */
  side?: "right" | "left";
  /** Desktop panel width (any CSS length). Overrides the `--drawer-width` default. */
  width?: string;
  /** Collapse to a bottom sheet at ≤720px. Default true. */
  mobileSheet?: boolean;
  /** Accessible name, when there's no visible heading to point at. */
  ariaLabel?: string;
  /** id of the element that labels the dialog (preferred when a heading exists). */
  ariaLabelledby?: string;
  /** Extra class on the panel for content-level styling. */
  className?: string;
  /** Whether backdrop click / Escape dismisses. Default true. */
  dismissible?: boolean;
};

/**
 * Shared slide-in drawer (S1). Owns all cross-cutting drawer behaviour —
 * portal, backdrop, Escape, body-scroll lock, focus trap + focus return (S4),
 * and the enter/exit animation — so individual drawers only supply content.
 *
 * All motion is centralised: the duration comes from `DRAWER_DURATION_MS`
 * (injected as `--drawer-dur`) and every other timing/curve token lives in
 * `drawer.css`. Retuning any of those updates every drawer at once.
 */
export function Drawer({
  open,
  onClose,
  children,
  side = "right",
  width,
  mobileSheet = true,
  ariaLabel,
  ariaLabelledby,
  className,
  dismissible = true,
}: DrawerProps) {
  // `render` keeps the node in the DOM through the exit animation; `visible`
  // drives the open/closed transition state one frame after mount.
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(open && visible);

  useEffect(() => {
    if (open) {
      // Mount first (closed state), then flip to open on the next frame so the
      // enter transition actually plays — the standard animated-portal pattern.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRender(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    // Play the exit transition now, then unmount once it has finished.
    setVisible(false);
    const timer = setTimeout(() => setRender(false), DRAWER_DURATION_MS);
    return () => clearTimeout(timer);
  }, [open]);

  // Escape to close + lock body scroll while the drawer occupies the screen.
  useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [render, dismissible, onClose]);

  if (!render) return null;

  const rootStyle = {
    "--drawer-dur": `${DRAWER_DURATION_MS}ms`,
    ...(width ? { "--drawer-width": width } : {}),
  } as CSSProperties;

  return createPortal(
    <div
      className="drawer-root"
      data-state={visible ? "open" : "closed"}
      style={rootStyle}
    >
      <div
        className="drawer-scrim"
        onClick={dismissible ? onClose : undefined}
      />
      <div
        ref={panelRef}
        className={className ? `drawer-panel ${className}` : "drawer-panel"}
        data-side={side}
        data-sheet={mobileSheet ? "1" : "0"}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
