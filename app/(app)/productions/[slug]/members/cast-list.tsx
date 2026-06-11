"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import {
  assignRoleToMember,
  unassignRole,
  inviteAndAssignRole,
} from "@/features/members/actions";
import type { OrgMember } from "@/features/members/queries";
import type { ProductionRoleRow } from "@/features/productions/queries";

type Person = {
  firstName: string | null;
  lastName: string | null;
  email: string;
};

function displayName(p: Person): string {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.email;
}
function initials(p: Person): string {
  const pair = `${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`;
  return (pair || p.email[0] || "?").toUpperCase();
}

function InviteForm({
  onInvite,
  pending,
}: {
  onInvite: (firstName: string, lastName: string, email: string) => void;
  pending: boolean;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        alignItems: "center",
        marginTop: 8,
      }}
    >
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First name"
        className="field"
        style={{ width: 110, padding: "4px 8px", fontSize: 12.5 }}
      />
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Last name"
        className="field"
        style={{ width: 110, padding: "4px 8px", fontSize: 12.5 }}
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@theatre.org"
        type="email"
        className="field"
        style={{ width: 180, padding: "4px 8px", fontSize: 12.5 }}
      />
      <button
        type="button"
        className="btn primary sm"
        disabled={pending || !email.trim()}
        onClick={() => onInvite(firstName, lastName, email)}
      >
        <Icon name="UserPlus" size={13} aria-hidden />
        {pending ? "Inviting..." : "Invite & cast"}
      </button>
    </div>
  );
}

function CastRow({
  role,
  orgMembers,
  canInvite,
}: {
  role: ProductionRoleRow;
  orgMembers: OrgMember[];
  canInvite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [picking, setPicking] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const assigned = role.assignedUserId
    ? {
        firstName: role.assignedFirstName,
        lastName: role.assignedLastName,
        email: role.assignedEmail ?? "",
      }
    : null;

  const run = (fn: () => Promise<{ error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) {
        setError(res.error);
        return;
      }
      setPicking(false);
      setInviting(false);
      setSelectedUserId("");
      router.refresh();
    });
  };

  return (
    <div className="card card-pad" style={{ padding: "12px 14px" }}>
      <div className="row-between" style={{ gap: 12, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{role.name}</div>
          <span
            className="pill"
            style={{ fontSize: 11, marginTop: 4, display: "inline-block" }}
          >
            {role.type}
          </span>
        </div>

        {assigned ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="pp-av" data-c="amber">
              {initials(assigned)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="pp-name">{displayName(assigned)}</div>
              <div className="pp-email">{assigned.email}</div>
            </div>
            <button
              type="button"
              className="btn ghost sm"
              disabled={pending}
              onClick={() => {
                setPicking((p) => !p);
                setError(null);
              }}
            >
              Change
            </button>
            <button
              type="button"
              className="btn ghost sm danger"
              disabled={pending}
              onClick={() => run(() => unassignRole(role.id))}
            >
              {pending ? "..." : "Unassign"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn sm"
            disabled={pending}
            onClick={() => {
              setPicking((p) => !p);
              setError(null);
            }}
          >
            <Icon name="UserPlus" size={13} aria-hidden /> Assign
          </button>
        )}
      </div>

      {picking && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="field"
              style={{ minWidth: 200, flex: "1 1 200px" }}
            >
              <option value="">Choose a member…</option>
              {orgMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {displayName(m)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn primary sm"
              disabled={pending || !selectedUserId}
              onClick={() =>
                run(() => assignRoleToMember(role.id, selectedUserId))
              }
            >
              {pending ? "Assigning..." : "Cast"}
            </button>
          </div>

          {canInvite && (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="pp-char-btn"
                onClick={() => setInviting((v) => !v)}
              >
                <span className="muted">
                  {inviting ? "− Cancel invite" : "+ Invite someone new"}
                </span>
              </button>
              {inviting && (
                <InviteForm
                  pending={pending}
                  onInvite={(firstName, lastName, email) =>
                    run(() =>
                      inviteAndAssignRole({
                        roleId: role.id,
                        firstName,
                        lastName,
                        email,
                      }),
                    )
                  }
                />
              )}
            </div>
          )}

          {error && (
            <p className="pp-requested" style={{ color: "var(--c-clay)", marginTop: 8 }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The production's parsed/wizard character list with cast-assignment controls.
 * Sits above the team manager on the Cast & Crew page. Casting a person here
 * also grants them production access (see `assignRoleToMember`).
 */
export function CastList({
  roles,
  orgMembers,
  canInvite,
  scriptHref,
}: {
  roles: ProductionRoleRow[];
  orgMembers: OrgMember[];
  canInvite: boolean;
  scriptHref: string;
}) {
  const castCount = roles.filter((r) => r.assignedUserId).length;

  return (
    <section>
      <div className="h-eyebrow" style={{ marginBottom: 10 }}>
        Cast list · {castCount}/{roles.length} cast
      </div>

      {roles.length === 0 ? (
        <div className="card card-pad">
          <p className="muted" style={{ fontSize: 13 }}>
            No characters yet. Add them in the new-production wizard, or run{" "}
            <a href={scriptHref} style={{ color: "var(--accent)" }}>
              AI script analysis
            </a>{" "}
            to pull the cast list straight from the script.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {roles.map((role) => (
            <CastRow
              key={role.id}
              role={role}
              orgMembers={orgMembers}
              canInvite={canInvite}
            />
          ))}
        </div>
      )}
    </section>
  );
}
