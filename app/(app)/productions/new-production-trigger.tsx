"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { quickCreateProduction } from "@/features/productions/actions";
import type { WizardOrgUser } from "@/features/productions/wizard-constants";

// The wizard is heavy; keep it out of the productions-list bundle and only
// load it when someone opens the full setup overlay.
const NewProductionWizard = dynamic(() => import("./new/new-production-wizard"), {
  ssr: false,
});

type Open = "none" | "menu" | "wizard" | "quick";

export function NewProductionTrigger({ orgUsers }: { orgUsers: WizardOrgUser[] }) {
  const [open, setOpen] = useState<Open>("none");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Close the dropdown menu on outside click.
  useEffect(() => {
    if (open !== "menu") return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen("none");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <button
          className="btn primary"
          onClick={() => setOpen((o) => (o === "menu" ? "none" : "menu"))}
          aria-haspopup="menu"
          aria-expanded={open === "menu"}
        >
          <Icon name="Plus" size={14} />
          <span>New production</span>
        </button>

        {open === "menu" && (
          <div className="np-menu" role="menu">
            <button
              className="np-menu-item"
              role="menuitem"
              onClick={() => setOpen("wizard")}
            >
              <span className="np-menu-ico" data-c="accent">
                <Icon name="Star" size={15} />
              </span>
              <span className="np-menu-text">
                <b>Full setup</b>
                <span>Guided wizard — dates, departments, cast &amp; team</span>
              </span>
            </button>
            <button
              className="np-menu-item"
              role="menuitem"
              onClick={() => setOpen("quick")}
            >
              <span className="np-menu-ico">
                <Icon name="Plus" size={15} />
              </span>
              <span className="np-menu-text">
                <b>Quick add</b>
                <span>Just a name to start — fill in details later</span>
              </span>
            </button>
          </div>
        )}
      </div>

      {open === "wizard" && (
        <div className="np-overlay">
          <NewProductionWizard
            mode="overlay"
            orgUsers={orgUsers}
            onClose={() => setOpen("none")}
          />
        </div>
      )}

      {open === "quick" && <QuickAddModal onClose={() => setOpen("none")} />}
    </>
  );
}

function QuickAddModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [opening, setOpening] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  const submit = async () => {
    if (!title.trim()) {
      setError("Enter a show name.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await quickCreateProduction({ title, opening });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/productions/${result.slug}`);
    router.refresh();
  };

  return (
    <div className="np-modal-scrim" onMouseDown={() => !pending && onClose()}>
      <div
        className="np-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Quick add production"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="np-modal-head">
          <h3>Quick add a production</h3>
          <button className="btn ghost icon-only sm" onClick={onClose} title="Close">
            <Icon name="X" size={14} />
          </button>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: "0 0 18px" }}>
          Spin up a draft with just a name. You can run the full setup from the production&apos;s page whenever
          you&apos;re ready.
        </p>

        {error && (
          <div className="np-modal-err">
            <Icon name="AlertTriangle" size={16} />
            <div>{error}</div>
          </div>
        )}

        <div className="field-group" style={{ marginBottom: 14 }}>
          <label className="label">
            Show name<span className="req">*</span>
          </label>
          <input
            className="field lg"
            value={title}
            placeholder="e.g. The Pirates of Penzance"
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
        </div>
        <div className="field-group">
          <label className="label">Opening day (optional)</label>
          <input
            className="field"
            type="date"
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
          />
        </div>

        <div className="np-modal-foot">
          <button className="btn" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button className="btn primary" onClick={() => void submit()} disabled={pending}>
            {pending ? "Creating…" : "Create production"}
          </button>
        </div>
      </div>
    </div>
  );
}
