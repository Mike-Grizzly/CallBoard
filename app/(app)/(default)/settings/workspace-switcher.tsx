"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { switchOrganization } from "@/features/workspace/actions";
import type { UserMembership } from "@/features/workspace/queries";

export function WorkspaceSwitcher({
  current,
  memberships,
}: {
  current: string;
  memberships: UserMembership[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (next === current) return;
    setError(null);
    startTransition(async () => {
      const result = await switchOrganization(next);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const hasMultiple = memberships.length > 1;

  return (
    <div style={{ marginTop: 14 }}>
      {hasMultiple && (
        <>
          <label
            htmlFor="workspace_switcher"
            className="label"
            style={{ marginBottom: 6, display: "block" }}
          >
            Switch workspace
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="Building2" size={14} aria-hidden />
            <select
              id="workspace_switcher"
              className="field"
              value={current}
              onChange={onChange}
              disabled={pending}
              style={{ flex: 1, maxWidth: 320 }}
            >
              {memberships.map((m) => (
                <option key={m.organizationId} value={m.organizationId}>
                  {m.organizationName}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div style={{ marginTop: hasMultiple ? 10 : 0 }}>
        <Link href="/workspaces/new" className="btn">
          <Icon name="Plus" size={14} aria-hidden /> Create workspace
        </Link>
      </div>

      {error && (
        <div style={{ color: "var(--c-clay)", fontSize: 13, marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  );
}
