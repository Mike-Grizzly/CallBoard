"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

type SwitcherProduction = { id: string; title: string; slug: string };

/**
 * Breadcrumb production switcher (N7). Turns the static "current production"
 * crumb into a dropdown of every production the user can see (same gated list
 * the rail uses), so switching shows doesn't require bouncing out to the index.
 * Each entry links to that production's overview. With one production there's
 * nothing to switch to, so it renders the plain label.
 */
export function ProductionSwitcher({
  current,
  productions,
}: {
  current: { title: string; slug: string };
  productions: SwitcherProduction[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (productions.length <= 1) {
    return <span className="now">{current.title}</span>;
  }

  return (
    <div className="crumb-switch" ref={ref}>
      <button
        type="button"
        className="now crumb-switch-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Current production: ${current.title}. Switch production`}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{current.title}</span>
        <Icon
          name="ChevronDown"
          size={12}
          className="crumb-switch-chev"
          data-open={open ? "1" : "0"}
          aria-hidden
        />
      </button>
      {open && (
        <div className="crumb-switch-menu" role="menu" aria-label="Switch production">
          {productions.map((p) => {
            const isCurrent = p.slug === current.slug;
            return (
              <Link
                key={p.id}
                href={`/productions/${p.slug}`}
                role="menuitem"
                className="crumb-switch-item"
                data-current={isCurrent ? "1" : "0"}
                onClick={() => setOpen(false)}
              >
                <span>{p.title}</span>
                {isCurrent && <Icon name="Check" size={13} aria-hidden />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
