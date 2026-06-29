"use client";

import { useState, useTransition } from "react";
import {
  createDesignerCheckoutSession,
  createDesignerPortalSession,
} from "@/features/designer/actions";
import {
  DESIGNER_PRICES,
  DESIGNER_PLAN_LABELS,
  DESIGNER_PLANS,
  type DesignerPlanId,
  type DesignerTool,
} from "@/features/designer/constants";
import type { BillingInterval } from "@/lib/stripe";

export type DesignerPlanOption = {
  id: DesignerPlanId;
  hasMonthly: boolean;
  hasAnnual: boolean;
};

const ORDER: DesignerPlanId[] = ["single_tool", "studio", "studio_pro"];

const BLURB: Record<DesignerPlanId, string> = {
  single_tool: "Script or Blocking — pick the one you work in.",
  studio: "Script and Blocking together, side by side.",
  studio_pro: "Both tools, every show open at once.",
};

const FEATURES: Record<DesignerPlanId, string[]> = {
  single_tool: ["One tool of your choice", "Your script + AI parse", "One private ground plan"],
  studio: ["Script + Blocking", "Your script + AI parse", "Both views, pinned together"],
  studio_pro: ["Script + Blocking", "Every show open at once", "No swap-and-replace"],
};

function priceFor(plan: DesignerPlanId, interval: BillingInterval) {
  const p = DESIGNER_PRICES[plan];
  return interval === "annual" ? p.annual : p.monthly;
}

const Tick = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, color: "var(--accent-ink)", marginTop: 2 }}
    aria-hidden
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export function DesignerBillingButtons({
  plans,
  hasSeat,
  currentPlan,
}: {
  plans: DesignerPlanOption[];
  hasSeat: boolean;
  currentPlan: DesignerPlanId | null;
}) {
  const [interval, setIntervalState] = useState<BillingInterval>("monthly");
  const [tool, setTool] = useState<DesignerTool>("script");
  const [error, setError] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<DesignerPlanId | null>(null);
  const [pending, startTransition] = useTransition();

  const checkout = (plan: DesignerPlanId) =>
    startTransition(async () => {
      setError(null);
      setPendingPlan(plan);
      const res = await createDesignerCheckoutSession(
        plan,
        interval,
        plan === DESIGNER_PLANS.SINGLE_TOOL ? tool : null,
      );
      if (res.url) window.location.href = res.url;
      else {
        setError(res.error ?? "Something went wrong.");
        setPendingPlan(null);
      }
    });

  const portal = () =>
    startTransition(async () => {
      setError(null);
      const res = await createDesignerPortalSession();
      if (res.url) window.location.href = res.url;
      else setError(res.error ?? "Something went wrong.");
    });

  if (hasSeat) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
          You&apos;re on{" "}
          <b>{currentPlan ? DESIGNER_PLAN_LABELS[currentPlan] : "a Studio plan"}</b>.
        </p>
        <div>
          <button className="btn" onClick={portal} disabled={pending}>
            {pending ? "Opening…" : "Manage billing"}
          </button>
        </div>
        {error && <p style={{ color: "var(--accent-ink)", fontSize: 13, margin: 0 }}>{error}</p>}
      </div>
    );
  }

  const available = ORDER.filter((id) => plans.some((p) => p.id === id));

  return (
    <div style={{ marginTop: 16 }}>
      <div
        role="group"
        aria-label="Billing period"
        style={{
          display: "inline-flex",
          gap: 4,
          padding: 4,
          borderRadius: 999,
          background: "var(--bg-muted)",
          border: "1px solid var(--border)",
          marginBottom: 18,
        }}
      >
        {(["monthly", "annual"] as BillingInterval[]).map((iv) => (
          <button
            key={iv}
            type="button"
            onClick={() => setIntervalState(iv)}
            style={{
              border: "none",
              cursor: "pointer",
              borderRadius: 999,
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "capitalize",
              background: interval === iv ? "var(--bg-elev)" : "transparent",
              color: interval === iv ? "var(--ink)" : "var(--ink-3)",
              boxShadow: interval === iv ? "var(--shadow-1)" : "none",
            }}
          >
            {iv === "annual" ? "Annual" : "Monthly"}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        {available.map((id) => {
          const popular = id === "studio";
          return (
            <div
              key={id}
              className="card card-pad"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                borderColor: popular ? "var(--accent)" : undefined,
                borderWidth: popular ? 2 : undefined,
              }}
            >
              {popular && (
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    left: 16,
                    background: "var(--accent)",
                    color: "var(--accent-on, #fff)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  Best value
                </span>
              )}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {DESIGNER_PLAN_LABELS[id]}
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2, lineHeight: 1.4 }}>
                  {BLURB[id]}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 28, fontWeight: 700 }}>
                  ${priceFor(id, interval)}
                </span>
                <span className="muted" style={{ fontSize: 13 }}>
                  {" "}
                  {interval === "annual" ? "/yr" : "/mo"}
                </span>
              </div>

              {id === "single_tool" && (
                <div role="group" aria-label="Which tool" style={{ display: "flex", gap: 6 }}>
                  {(["script", "blocking"] as DesignerTool[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTool(t)}
                      className={tool === t ? "btn primary" : "btn"}
                      style={{ fontSize: 12, padding: "5px 12px", textTransform: "capitalize" }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              <ul
                style={{
                  listStyle: "none",
                  margin: "2px 0 0",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                }}
              >
                {FEATURES[id].map((f) => (
                  <li key={f} style={{ display: "flex", gap: 8, fontSize: 12.5, lineHeight: 1.4 }}>
                    <Tick />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className={popular ? "btn primary" : "btn"}
                onClick={() => checkout(id)}
                disabled={pending}
                style={{ marginTop: "auto" }}
              >
                {pending && pendingPlan === id ? "…" : `Get ${DESIGNER_PLAN_LABELS[id]}`}
              </button>
            </div>
          );
        })}
      </div>
      {error && <p style={{ color: "var(--accent-ink)", fontSize: 13, marginTop: 12 }}>{error}</p>}
    </div>
  );
}
