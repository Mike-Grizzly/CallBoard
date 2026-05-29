"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import {
  createWorkspace,
  switchOrganization,
} from "@/features/workspace/actions";
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
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

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

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) {
      setError("Enter a workspace name.");
      return;
    }
    startTransition(async () => {
      const result = await createWorkspace(name);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCreating(false);
      setNewName("");
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
        {creating ? (
          <form
            onSubmit={onCreate}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <input
              ref={inputRef}
              type="text"
              className="field"
              placeholder="New workspace name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={pending}
              maxLength={60}
              style={{ maxWidth: 320 }}
              aria-label="New workspace name"
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                className="btn primary"
                disabled={pending || !newName.trim()}
              >
                {pending ? "Creating..." : "Create workspace"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                  setError(null);
                }}
                disabled={pending}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() => setCreating(true)}
            disabled={pending}
          >
            <Icon name="Plus" size={14} aria-hidden /> Create workspace
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: "var(--c-clay)", fontSize: 13, marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  );
}
