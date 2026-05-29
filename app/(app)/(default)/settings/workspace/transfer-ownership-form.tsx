"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { transferWorkspaceOwnership } from "@/features/workspace/actions";
import { ROLES, type Role } from "@/types/roles";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  producer: "Producer",
  director: "Director",
  choreographer: "Choreographer",
  stage_manager: "Stage Manager",
  cast: "Cast",
  crew: "Crew",
};

const SELF_ROLE_OPTIONS = ROLES.filter((r) => r !== "admin");

export type TransferCandidate = {
  userId: string;
  displayName: string;
};

export function TransferOwnershipForm({
  candidates,
}: {
  candidates: TransferCandidate[];
}) {
  const [targetId, setTargetId] = useState("");
  const [selfRole, setSelfRole] = useState<Role>("producer");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (candidates.length === 0) {
    return (
      <div className="card card-pad">
        <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>
          Transfer ownership
        </h3>
        <p
          className="muted"
          style={{ fontSize: 13, marginTop: 6, marginBottom: 0 }}
        >
          You&apos;re the only member of this workspace. Invite someone before
          handing ownership over.
        </p>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!targetId) {
      setError("Pick a member to transfer to.");
      return;
    }
    const target = candidates.find((c) => c.userId === targetId);
    if (
      !window.confirm(
        `Make ${
          target?.displayName ?? "this member"
        } the new admin and step down to ${ROLE_LABELS[selfRole]}? You can be re-promoted later.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await transferWorkspaceOwnership(targetId, selfRole);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setTargetId("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="card card-pad">
      <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>
        Transfer ownership
      </h3>
      <p
        className="muted"
        style={{ fontSize: 13, marginTop: 6, marginBottom: 12 }}
      >
        Promote another member to admin and step down to the role of your
        choice. Atomic — the workspace always has at least one admin.
      </p>

      {error && <div className="auth-error">{error}</div>}
      {success && (
        <div style={{ color: "var(--c-sage)", fontSize: 13, marginBottom: 10 }}>
          Ownership transferred.
        </div>
      )}

      <div className="auth-field">
        <label htmlFor="transfer_target" className="label">
          New admin
        </label>
        <select
          id="transfer_target"
          className="field"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          disabled={pending}
        >
          <option value="">Choose a member…</option>
          {candidates.map((c) => (
            <option key={c.userId} value={c.userId}>
              {c.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="auth-field">
        <label htmlFor="transfer_self_role" className="label">
          Your new role
        </label>
        <select
          id="transfer_self_role"
          className="field"
          value={selfRole}
          onChange={(e) => setSelfRole(e.target.value as Role)}
          disabled={pending}
        >
          {SELF_ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="btn"
        disabled={pending || !targetId}
      >
        {pending ? "Transferring..." : "Transfer ownership"}
      </button>
    </form>
  );
}
