"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import {
  DEPARTMENT_CATALOG,
  customDeptKey,
} from "@/features/productions/departments";
import { saveProductionDepartments } from "@/features/productions/department-actions";

type Item = { key: string; label: string; custom: boolean };

export function DepartmentSettings({
  productionId,
  initial,
}: {
  productionId: string;
  initial: Item[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initial);
  const [customLabel, setCustomLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(null);

  const usedKeys = useMemo(() => new Set(items.map((i) => i.key)), [items]);
  const available = DEPARTMENT_CATALOG.filter((d) => !usedKeys.has(d.key));

  const dirty = useMemo(
    () => JSON.stringify(items) !== JSON.stringify(initial),
    [items, initial],
  );

  function addCatalog(key: string, label: string) {
    setItems((prev) => [...prev, { key, label, custom: false }]);
  }
  function addCustom() {
    const label = customLabel.trim();
    if (!label) return;
    const key = customDeptKey(label);
    if (usedKeys.has(key)) {
      setToast({ msg: "That department already exists.", error: true });
      return;
    }
    setItems((prev) => [...prev, { key, label, custom: true }]);
    setCustomLabel("");
  }
  function remove(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }
  function rename(key: string, label: string) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, label } : i)));
  }
  function move(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      const res = await saveProductionDepartments(
        productionId,
        items.map((i) => ({ key: i.key, label: i.label })),
      );
      if (res.error) {
        setToast({ msg: res.error, error: true });
        return;
      }
      setToast({ msg: "Departments saved.", error: false });
      router.refresh();
    });
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div className="h-eyebrow" style={{ marginBottom: 4 }}>
          Departments
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          Choose the departments this production uses. They drive the rehearsal
          report sections and the Cast &amp; Crew team buckets. Drag-free
          reordering with the arrows; rename anything; add your own.
        </p>
      </div>

      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>
            No departments yet — add some below.
          </p>
        ) : (
          items.map((item, i) => (
            <div
              key={item.key}
              className="row"
              style={{ gap: 8, alignItems: "center" }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <button
                  type="button"
                  className="pp-icon-btn"
                  aria-label="Move up"
                  disabled={i === 0 || pending}
                  onClick={() => move(i, -1)}
                  style={{ height: 18 }}
                >
                  <Icon name="ChevronLeft" size={13} style={{ transform: "rotate(90deg)" }} />
                </button>
                <button
                  type="button"
                  className="pp-icon-btn"
                  aria-label="Move down"
                  disabled={i === items.length - 1 || pending}
                  onClick={() => move(i, 1)}
                  style={{ height: 18 }}
                >
                  <Icon name="ChevronLeft" size={13} style={{ transform: "rotate(-90deg)" }} />
                </button>
              </div>
              <input
                className="field"
                value={item.label}
                onChange={(e) => rename(item.key, e.target.value)}
                style={{ flex: 1 }}
              />
              {item.custom && (
                <span className="pill" data-c="dusk" style={{ fontSize: 11 }}>
                  Custom
                </span>
              )}
              <button
                type="button"
                className="btn ghost sm danger"
                disabled={pending}
                onClick={() => remove(item.key)}
              >
                <Icon name="X" size={13} />
                <span>Remove</span>
              </button>
            </div>
          ))
        )}
      </div>

      {available.length > 0 && (
        <div>
          <div className="h-eyebrow" style={{ marginBottom: 8 }}>
            Add a standard department
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {available.map((d) => (
              <button
                key={d.key}
                type="button"
                className="btn sm"
                disabled={pending}
                onClick={() => addCatalog(d.key, d.label)}
              >
                <Icon name="Plus" size={12} />
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="h-eyebrow" style={{ marginBottom: 8 }}>
          Add a custom department
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input
            className="field"
            placeholder="e.g. Pyrotechnics, Aerial, Fight"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            style={{ flex: "1 1 240px" }}
          />
          <button
            type="button"
            className="btn sm"
            disabled={pending || !customLabel.trim()}
            onClick={addCustom}
          >
            <Icon name="Plus" size={13} />
            <span>Add</span>
          </button>
        </div>
      </div>

      <div className="row" style={{ gap: 10, alignItems: "center", marginTop: 4 }}>
        <button
          type="button"
          className="btn primary"
          disabled={pending || !dirty}
          onClick={save}
        >
          <Icon name="Check" size={14} />
          <span>{pending ? "Saving…" : "Save departments"}</span>
        </button>
        {dirty && !pending && (
          <span className="muted" style={{ fontSize: 12.5 }}>
            Unsaved changes
          </span>
        )}
        {toast && (
          <span
            style={{
              fontSize: 12.5,
              color: toast.error ? "var(--c-clay)" : "var(--c-sage)",
            }}
          >
            {toast.msg}
          </span>
        )}
      </div>
    </section>
  );
}
