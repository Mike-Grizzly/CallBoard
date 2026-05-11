"use client";

import { useState, type ReactNode } from "react";

type TabId = "notes" | "sched" | "lines" | "injuries";

export function DetailTabs({
  tabs,
  panels,
}: {
  tabs: { id: TabId; label: string; count: number }[];
  panels: Record<TabId, ReactNode>;
}) {
  const [active, setActive] = useState<TabId>(tabs[0]?.id ?? "notes");

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          padding: "0 16px",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className="tab"
            data-active={active === t.id ? "1" : "0"}
            onClick={() => setActive(t.id)}
          >
            <span>{t.label}</span>
            {t.count > 0 && <span className="count">{t.count}</span>}
          </button>
        ))}
      </div>
      <div style={{ padding: 20 }}>{panels[active]}</div>
    </div>
  );
}
