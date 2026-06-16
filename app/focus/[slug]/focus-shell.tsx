"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { applyThemePref, readThemePref, THEME_PREFS } from "@/lib/theme";

type Mode = "script" | "blocking";

type Props = {
  slug: string;
  showTitle: string;
  orgName: string;
  posterInitial: string;
  userInitials: string;
  mode: Mode;
  children: ReactNode;
};

/** Title with the last word italicised (matches the production topbar). */
function ShowTitle({ title }: { title: string }) {
  const t = title.trim();
  const i = t.lastIndexOf(" ");
  if (i === -1) return <>{t}</>;
  return (
    <>
      {t.slice(0, i)} <em>{t.slice(i + 1)}</em>
    </>
  );
}

/**
 * Full-screen Focus View shell — the design's top bar wrapping an embedded
 * tool. Phase 1: brand · show pill · Script/Blocking switch · theme · exit.
 * The rail / layers panel / margin view arrive in later phases. The live
 * Script & Blocking tools are reused unchanged inside `.fx-stage`.
 */
export function FocusShell({
  slug,
  showTitle,
  orgName,
  posterInitial,
  userInitials,
  mode,
  children,
}: Props) {
  const router = useRouter();
  const exitTo = `/productions/${slug}/${mode === "blocking" ? "blocking" : "script"}`;

  const exit = useCallback(() => {
    router.push(exitTo);
  }, [router, exitTo]);

  // Esc exits focus — but never while the user is typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit]);

  const cycleTheme = () => {
    const cur = readThemePref();
    const idx = THEME_PREFS.indexOf(cur);
    applyThemePref(THEME_PREFS[(idx + 1) % THEME_PREFS.length]);
  };

  const switchMode = (m: Mode) => {
    if (m !== mode) router.push(`/focus/${slug}?mode=${m}`);
  };

  return (
    <div className="fx-body" data-mode={mode}>
      <header className="fx-top">
        <div className="fx-brand">
          <span className="mark">
            <svg className="brand-badge is-light" viewBox="0 0 64 64" aria-hidden="true">
              <svg x="2.56" y="7.47" width="58.88" height="49.07" viewBox="0 0 240 200" overflow="visible">
                <defs>
                  <mask id="fx-rcut-l">
                    <rect width="240" height="200" fill="white" />
                    <g fill="black" stroke="black" strokeWidth="9" strokeLinejoin="round">
                      <polygon points="68,77 172,77 176,87 64,87" />
                      <polygon points="56,116 184,116 190,130 50,130" />
                      <polygon points="44,155 196,155 204,173 36,173" />
                    </g>
                  </mask>
                </defs>
                <path
                  d="M 30 184 L 30 74 Q 30 24 84 24 L 156 24 Q 210 24 210 74 L 210 184 Z"
                  fill="#15181F"
                  stroke="#15181F"
                  strokeWidth="12"
                  strokeLinejoin="round"
                  mask="url(#fx-rcut-l)"
                />
              </svg>
            </svg>
            <svg className="brand-badge is-dark" viewBox="0 0 64 64" aria-hidden="true">
              <svg x="2.56" y="7.47" width="58.88" height="49.07" viewBox="0 0 240 200" overflow="visible">
                <defs>
                  <mask id="fx-rcut-d">
                    <rect width="240" height="200" fill="white" />
                    <g fill="black" stroke="black" strokeWidth="9" strokeLinejoin="round">
                      <polygon points="68,77 172,77 176,87 64,87" />
                      <polygon points="56,116 184,116 190,130 50,130" />
                      <polygon points="44,155 196,155 204,173 36,173" />
                    </g>
                  </mask>
                </defs>
                <path
                  d="M 30 184 L 30 74 Q 30 24 84 24 L 156 24 Q 210 24 210 74 L 210 184 Z"
                  fill="#F5F2EA"
                  stroke="#F5F2EA"
                  strokeWidth="12"
                  strokeLinejoin="round"
                  mask="url(#fx-rcut-d)"
                />
              </svg>
            </svg>
          </span>
          <span className="focuslab">Focus</span>
        </div>

        <div className="fx-gig" title={`${showTitle} · ${orgName}`}>
          <span className="poster">{posterInitial}</span>
          <span className="meta">
            <span className="show">
              <ShowTitle title={showTitle} />
            </span>
            <span className="org">{orgName}</span>
          </span>
        </div>

        <span className="fx-spring" />

        <div className="fx-modeswitch" role="tablist" aria-label="Tool">
          <button
            type="button"
            data-mode="script"
            data-on={mode === "script" ? "1" : undefined}
            onClick={() => switchMode("script")}
          >
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 7v14" />
              <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
            </svg>
            Script
          </button>
          <button
            type="button"
            data-mode="blocking"
            data-on={mode === "blocking" ? "1" : undefined}
            onClick={() => switchMode("blocking")}
          >
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <circle cx="15" cy="14" r="2" />
            </svg>
            Blocking
          </button>
        </div>

        <span className="fx-spring" />

        <button type="button" className="fx-iconbtn" title="Theme" onClick={cycleTheme} aria-label="Cycle theme">
          <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </button>

        <span className="fx-divider" />

        <div className="avatar" title="You">{userInitials}</div>

        <button type="button" className="btn fx-exit" onClick={exit}>
          <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
          Exit focus <kbd>Esc</kbd>
        </button>
      </header>

      <div className="fx-stage">{children}</div>
    </div>
  );
}
