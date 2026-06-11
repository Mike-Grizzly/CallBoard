import { Icon } from "@/components/ui/icon";
import type { Production } from "@/db/schema";
import { RestoreDeletedProductionButton } from "./archive-buttons";

const RECOVERY_DAYS = 30;

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DeletedSection({
  productions,
}: {
  productions: Production[];
}) {
  if (productions.length === 0) return null;

  return (
    <details className="archived-section" style={{ marginTop: 16 }}>
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
        <Icon name="Trash2" size={14} aria-hidden />
        <span>Recently deleted ({productions.length})</span>
      </summary>
      <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>
        Deleted productions are recoverable for {RECOVERY_DAYS} days, then
        permanently removed.
      </p>
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
        {productions.map((p) => {
          const deletedAt = p.deletedAt ? new Date(p.deletedAt) : null;
          const recoverableUntil = deletedAt
            ? new Date(deletedAt.getTime() + RECOVERY_DAYS * 24 * 60 * 60 * 1000)
            : null;
          return (
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
                  {deletedAt ? `Deleted ${formatDate(deletedAt)}` : "Deleted"}
                  {recoverableUntil
                    ? ` · recoverable until ${formatDate(recoverableUntil)}`
                    : ""}
                </div>
              </div>
              <RestoreDeletedProductionButton productionId={p.id} />
            </li>
          );
        })}
      </ul>
    </details>
  );
}
