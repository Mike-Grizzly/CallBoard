"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession, createPortalSession } from "@/features/billing/actions";
import type { BillingInterval } from "@/lib/stripe";

export function BillingButtons({
  hasMonthly,
  hasAnnual,
  showManage,
  subscribeLabel = "Subscribe",
}: {
  hasMonthly: boolean;
  hasAnnual: boolean;
  showManage: boolean;
  subscribeLabel?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const checkout = (interval: BillingInterval) =>
    startTransition(async () => {
      setError(null);
      const res = await createCheckoutSession(interval);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {showManage ? (
          <button className="btn" onClick={portal} disabled={pending}>
            {pending ? "Opening…" : "Manage billing"}
          </button>
        ) : (
          <>
            {hasMonthly && (
              <button className="btn primary" onClick={() => checkout("monthly")} disabled={pending}>
                {pending ? "…" : `${subscribeLabel} — monthly`}
              </button>
            )}
            {hasAnnual && (
              <button className="btn" onClick={() => checkout("annual")} disabled={pending}>
                {pending ? "…" : `${subscribeLabel} — annual`}
              </button>
            )}
          </>
        )}
      </div>
      {error && (
        <p style={{ color: "var(--accent-ink)", fontSize: 13, margin: 0 }}>{error}</p>
      )}
    </div>
  );
}
