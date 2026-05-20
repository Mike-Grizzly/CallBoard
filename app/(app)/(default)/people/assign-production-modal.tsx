"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { ROLES, type Role } from "@/types/roles";
import { ROLE_META } from "@/features/members/constants";
import { assignProductionMember } from "@/features/members/actions";
import type { ProductionOption } from "./helpers";

export function AssignProductionModal({
  userIds,
  productions,
  onClose,
  onDone,
}: {
  userIds: string[];
  productions: ProductionOption[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [productionId, setProductionId] = useState(productions[0]?.id ?? "");
  const [role, setRole] = useState<Role>("cast");
  const [characterName, setCharacterName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const count = userIds.length;
  const noun = count === 1 ? "person" : "people";

  const submit = async () => {
    if (!productionId || pending) return;
    setPending(true);
    setError(null);

    const fd = new FormData();
    fd.set("production_id", productionId);
    fd.set("role", role);
    fd.set("user_ids", JSON.stringify(userIds));
    if (characterName.trim()) fd.set("character_name", characterName.trim());

    const res = await assignProductionMember(undefined, fd);
    setPending(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    const prod = productions.find((p) => p.id === productionId);
    onDone(`Assigned ${count} ${noun} to ${prod?.title ?? "production"}.`);
  };

  return (
    <div className="pp-modal-bg" onClick={onClose}>
      <div
        className="pp-modal"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pp-modal-h">
          <h2>
            Assign {count} {noun} to a production
          </h2>
          <div style={{ flex: 1 }} />
          <button className="pp-icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="X" size={14} />
          </button>
        </div>

        {productions.length === 0 ? (
          <div className="pp-form">
            <div className="pp-empty-sm">
              There are no productions yet. Create a production before
              assigning people.
            </div>
            <div className="pp-form-actions">
              <button className="btn ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="pp-form">
            <div className="pp-fg">
              <label>Production</label>
              <select
                className="pp-field"
                value={productionId}
                onChange={(e) => setProductionId(e.target.value)}
              >
                {productions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="pp-fg" style={{ marginTop: 12 }}>
              <label>Role within this production</label>
              <select
                className="pp-field"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_META[r].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="pp-fg" style={{ marginTop: 12 }}>
              <label>
                Character name{" "}
                <span className="pp-muted">(optional — for cast)</span>
              </label>
              <input
                className="pp-field"
                value={characterName}
                placeholder="e.g. Frederic"
                onChange={(e) => setCharacterName(e.target.value)}
              />
            </div>

            {error && (
              <div className="pp-form-error" role="alert">
                {error}
              </div>
            )}

            <div className="pp-form-actions">
              <button className="btn ghost" onClick={onClose}>
                Cancel
              </button>
              <div style={{ flex: 1 }} />
              <button
                className="btn primary"
                onClick={submit}
                disabled={pending || !productionId}
              >
                <Icon name="Check" size={14} />
                <span>{pending ? "Assigning…" : "Assign"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
