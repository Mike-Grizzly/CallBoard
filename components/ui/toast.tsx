"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * Global toast — extracted from the cast & crew board's hand-rolled version
 * (same `.ax-toast` styling and timings) so every surface shares one API
 * instead of `window.alert` or silent success.
 *
 *   const toast = useToast();
 *   toast.show("Report moved to trash");
 *   toast.error("Could not delete the document");
 *
 * One toast at a time (the latest wins), auto-dismissed: 1.8s for success,
 * 3.2s for errors — matching the board's original behavior.
 */

type ToastApi = {
  show: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Standard mount flag so the portal only renders client-side (avoids an
  // SSR/hydration mismatch) — same pattern as the app's other portals.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const flash = useCallback((msg: string, error: boolean) => {
    setToast({ msg, error });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), error ? 3200 : 1800);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show: (message) => flash(message, false),
      error: (message) => flash(message, true),
    }),
    [flash],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        toast &&
        createPortal(
          <div className="ax-toast" data-error={toast.error ? "1" : "0"} role="status">
            {toast.msg}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider> (mounted in the app layout).");
  }
  return ctx;
}
