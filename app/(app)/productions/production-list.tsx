import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Production } from "@/db/schema";
import { resolveProductionColor } from "@/features/productions/constants";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProductionFoot({ production }: { production: Production }) {
  return (
    <div className="prod-card-foot" style={{ gridTemplateColumns: "1fr 1fr" }}>
      <div>
        <div className="prod-card-foot-label">Opens</div>
        <div className="prod-card-foot-val">{formatDate(production.openingDate)}</div>
      </div>
      <div>
        <div className="prod-card-foot-label">Closes</div>
        <div className="prod-card-foot-val">{formatDate(production.closingDate)}</div>
      </div>
    </div>
  );
}

export function ProductionList({
  productions,
  accessibleIds,
  canManage,
}: {
  productions: Production[];
  accessibleIds: Set<string> | null;
  canManage: boolean;
}) {
  if (productions.length === 0) {
    return (
      <div
        className="card card-pad"
        style={{ textAlign: "center", padding: "48px 24px" }}
      >
        <Icon
          name="Theater"
          style={{
            width: 32,
            height: 32,
            margin: "0 auto 10px",
            color: "var(--ink-4)",
          }}
        />
        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-2)" }}>
          No productions yet
        </p>
        <p className="muted" style={{ fontSize: 13, marginTop: 4, maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
          {canManage
            ? "Each show your company is producing lives in its own hub. Create your first one to get going."
            : "You haven't been assigned to any productions yet."}
        </p>
        {canManage && (
          <Link
            href="/productions/new"
            className="btn primary"
            style={{ marginTop: 18 }}
          >
            <Icon name="Plus" size={14} />
            <span>New production</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="prod-cards">
      {productions.map((production) => {
        const hasAccess =
          accessibleIds === null || accessibleIds.has(production.id);
        const dotColor = resolveProductionColor(production);
        const statusLabel =
          STATUS_LABELS[production.status] ?? production.status;

        if (!hasAccess) {
          return (
            <div key={production.id} className="prod-card" data-locked="1">
              <div className="prod-card-head">
                <span className="prod-card-status">
                  <span className="prod-card-dot" style={{ background: dotColor }} />
                  {statusLabel}
                </span>
                <span
                  className="row"
                  style={{ gap: 4, fontSize: 11.5, color: "var(--ink-4)" }}
                >
                  <Icon name="Lock" size={11} />
                  Not assigned
                </span>
              </div>
              <h2 className="prod-card-title">{production.title}</h2>
              <ProductionFoot production={production} />
            </div>
          );
        }

        return (
          <Link
            key={production.id}
            href={`/productions/${production.slug}`}
            className="prod-card"
            data-status={production.status}
          >
            <span className="prod-card-cta">
              Open hub <Icon name="ChevronRight" size={14} />
            </span>
            <div className="prod-card-head">
              <span className="prod-card-status">
                <span className="prod-card-dot" style={{ background: dotColor }} />
                {statusLabel}
              </span>
            </div>
            <h2 className="prod-card-title">{production.title}</h2>
            <ProductionFoot production={production} />
          </Link>
        );
      })}
    </div>
  );
}
