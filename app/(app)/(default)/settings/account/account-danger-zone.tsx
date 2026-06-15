"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { signOutEverywhere, deleteOwnAccount } from "@/features/account/actions";

export function AccountDangerZone({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const matches = confirm.trim().toLowerCase() === email.toLowerCase();

  const onDelete = () => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("confirm", confirm);
      // On success the action redirects to /login; only a failure returns here.
      const result = await deleteOwnAccount(undefined, formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card card-pad">
        <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>
          Sign out everywhere
        </h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 6, marginBottom: 12 }}>
          Ends your session on every device, including this one. Use this if you
          signed in on a shared or lost device.
        </p>
        <form action={signOutEverywhere}>
          <button type="submit" className="btn">
            <LogOut size={14} aria-hidden /> Sign out everywhere
          </button>
        </form>
      </div>

      <div
        className="card card-pad"
        style={{ borderColor: "color-mix(in oklch, var(--c-clay) 45%, var(--border))" }}
      >
        <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600, color: "var(--c-clay)" }}>
          Delete your account
        </h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 6, marginBottom: 12 }}>
          Permanently removes your account and your content from every workspace
          you belong to. This can&apos;t be undone. If you&apos;re the only admin
          of a workspace with other members, hand off admin or delete that
          workspace first.
        </p>

        {!open ? (
          <button
            type="button"
            className="btn"
            style={{ color: "var(--c-clay)", borderColor: "var(--c-clay)" }}
            onClick={() => {
              setOpen(true);
              setError(null);
            }}
          >
            <Icon name="Trash2" size={14} aria-hidden /> Delete account
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {error && <div className="auth-error">{error}</div>}
            <label className="label" htmlFor="confirm-email">
              Type <strong>{email}</strong> to confirm
            </label>
            <input
              id="confirm-email"
              type="email"
              className="field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={email}
              autoComplete="off"
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn primary"
                style={{ background: "var(--c-clay)", borderColor: "var(--c-clay)" }}
                disabled={!matches || pending}
                onClick={onDelete}
              >
                {pending ? "Deleting..." : "Permanently delete my account"}
              </button>
              <button
                type="button"
                className="btn"
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  setConfirm("");
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
