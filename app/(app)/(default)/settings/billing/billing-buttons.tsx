"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession, createPortalSession } from "@/features/billing/actions";
import type { BillingInterval, PaidPlanId } from "@/lib/stripe";

export type PlanOption = {
  id: PaidPlanId;
  label: string;
  priceLabel: string;
  hasMonthly: boolean;
  hasAnnual: boolean;
};

export function BillingButtons({
  plans,
  showManage,
}: {
  plans: PlanOption[];
  showManage: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const checkout = (plan: PaidPlanId, interval: BillingInterval) =>
    startTransition(async () => {
      setError(null);
      const res = await createCheckoutSession(plan, interval);
      if (res.url) window.location.href = res.url;
      else setError(res.error ?? "Something went wrong.");
    });

  const portal = () =>
    startTransition(async () => {
      setError(null);
      const res = await createPortalSession();
      if (res.url) window.location.href = res.url;
      else setError(res.error ?? "Something went wrong.");
    });

  if (showManage) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        <div>
          <button className="btn" onClick={portal} disabled={pending}>
            {pending ? "Opening…" : "Manage billing"}
          </button>
        </div>
        {error && <p style={{ color: "var(--accent-ink)", fontSize: 13, margin: 0 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
      {plans.map((plan) => (
        <div
          key={plan.id}
          style={{ display: "flex", flexDirection: "column", gap: 6 }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {plan.label}{" "}
            <span className="muted" style={{ fontWeight: 400 }}>{plan.priceLabel}</span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {plan.hasAnnual && (
              <button
                className="btn primary"
                onClick={() => checkout(plan.id, "annual")}
                disabled={pending}
              >
                {pending ? "…" : "Subscribe — yearly"}
              </button>
            )}
            {plan.hasMonthly && (
              <button
                className="btn"
                onClick={() => checkout(plan.id, "monthly")}
                disabled={pending}
              >
                {pending ? "…" : "Subscribe — monthly"}
              </button>
            )}
          </div>
        </div>
      ))}
      {error && <p style={{ color: "var(--accent-ink)", fontSize: 13, margin: 0 }}>{error}</p>}
    </div>
  );
}
