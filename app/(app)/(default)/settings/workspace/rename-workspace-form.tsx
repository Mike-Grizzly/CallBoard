"use client";

import { useActionState } from "react";
import {
  renameWorkspace,
  type WorkspaceActionResult,
} from "@/features/workspace/actions";

export function RenameWorkspaceForm({ currentName }: { currentName: string }) {
  const [state, formAction, pending] = useActionState<
    WorkspaceActionResult | undefined,
    FormData
  >(renameWorkspace, undefined);

  return (
    <form action={formAction} className="card card-pad">
      {state?.error && <div className="auth-error">{state.error}</div>}
      {state?.success && (
        <div
          style={{
            color: "var(--c-sage)",
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          Workspace renamed.
        </div>
      )}

      <div className="auth-field">
        <label htmlFor="name" className="label">
          Workspace name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={currentName}
          autoComplete="organization"
          className="field"
          maxLength={60}
        />
        <p className="auth-hint">
          This is what every member sees as the name of your workspace.
        </p>
      </div>

      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
