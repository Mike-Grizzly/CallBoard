import { Icon } from "@/components/ui/icon";
import type { Production } from "@/db/schema";
import { RestoreProductionButton } from "./archive-buttons";

function formatArchivedAt(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ArchivedSection({
  productions,
}: {
  productions: Production[];
}) {
  if (productions.length === 0) return null;

  return (
    <details className="archived-section" style={{ marginTop: 32 }}>
      <summary
        className="row"
        style={{
          cursor: "pointer",
          fontSize: 13,
          color: "var(--ink-3)",
          gap: 8,
          padding: "6px 0",
          userSelect: "none",
        }}
      >
        <Icon name="Archive" size={14} aria-hidden />
        <span>
          Archived productions ({productions.length})
        </span>
      </summary>
      <ul
        style={{
          listStyle: "none",
          margin: "12px 0 0",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {productions.map((p) => (
          <li
            key={p.id}
            className="card card-pad"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{p.title}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                Archived {formatArchivedAt(p.archivedAt)}
              </div>
            </div>
            <RestoreProductionButton productionId={p.id} />
          </li>
        ))}
      </ul>
    </details>
  );
}
