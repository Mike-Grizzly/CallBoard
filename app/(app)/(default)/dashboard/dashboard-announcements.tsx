"use client";

import { useState } from "react";
import { Pin } from "lucide-react";
import Link from "next/link";

export type SerializedAnnouncement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  /** org-wide, several productions, or a single production. */
  scope: "org" | "multi" | "prod";
  /** Display label for the scope chip ("All productions" / a show title / "N productions"). */
  scopeLabel: string;
  priority: "normal" | "important" | "urgent";
  authorName: string;
  relativeTime: string;
  railColor: "amber" | "dusk" | "sage";
};

type Filter = "all" | "org" | "prod";

export function DashboardAnnouncements({
  items,
}: {
  items: SerializedAnnouncement[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "org"
      ? items.filter((a) => a.scope === "org")
      : filter === "prod"
        ? items.filter((a) => a.scope !== "org")
        : items;

  return (
    <section className="home-section">
      <header className="home-section-head">
        <div>
          <div className="h-eyebrow">Announcements</div>
          <h2 className="h-section">Broadcast to the company</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="seg">
            <button
              data-on={String(filter === "all")}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              data-on={String(filter === "org")}
              onClick={() => setFilter("org")}
            >
              Workspace
            </button>
            <button
              data-on={String(filter === "prod")}
              onClick={() => setFilter("prod")}
            >
              Productions
            </button>
          </div>
          <Link
            href="/announcements"
            className="btn ghost"
            style={{ height: 28, padding: "0 10px", fontSize: 12 }}
          >
            View all
          </Link>
        </div>
      </header>

      <div className="ann-list">
        {filtered.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--ink-3)", padding: "12px 0" }}>
            No announcements to show.
          </p>
        ) : (
          filtered.map((a) => (
            <article key={a.id} className="ann-card">
              <div className="ann-rail" data-c={a.railColor} />
              <div className="ann-main">
                <header className="ann-header">
                  <div>
                    <div className="ann-from">{a.authorName}</div>
                    <div className="ann-meta">
                      <span
                        className="pill"
                        data-c={a.scope === "org" ? "accent" : "sage"}
                      >
                        {a.scope === "org" ? "All productions" : a.scopeLabel}
                      </span>
                      <span className="muted">·</span>
                      <span className="muted">{a.relativeTime}</span>
                      {a.pinned && (
                        <>
                          <span className="muted">·</span>
                          <span
                            className="muted ann-pinned"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <Pin size={11} aria-hidden /> Pinned
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </header>
                <h3 className="ann-title">{a.title}</h3>
                {a.body && <p className="ann-body">{a.body}</p>}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
