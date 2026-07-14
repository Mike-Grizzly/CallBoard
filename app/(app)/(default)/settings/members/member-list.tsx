"use client";

import { startTransition, useActionState, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ROLES } from "@/types/roles";
import {
  updateMemberRole,
  removeMember,
  type MemberActionResult,
} from "@/features/members/actions";
import type { OrgMember } from "@/features/members/queries";

const ROLE_META: Record<string, { label: string; c: string }> = {
  admin: { label: "Admin", c: "accent" },
  producer: { label: "Producer", c: "clay" },
  director: { label: "Director", c: "plum" },
  choreographer: { label: "Choreographer", c: "dusk" },
  stage_manager: { label: "Stage Manager", c: "sage" },
  cast: { label: "Cast", c: "amber" },
  crew: { label: "Crew", c: "sand" },
};

function roleLabel(role: string): string {
  return ROLE_META[role]?.label ?? role;
}
function roleColor(role: string): string {
  return ROLE_META[role]?.c ?? "";
}

type Person = {
  firstName: string | null;
  lastName: string | null;
  email: string;
};

function displayName(m: Person): string {
  return `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.email;
}
function initials(m: Person): string {
  const pair = `${m.firstName?.[0] ?? ""}${m.lastName?.[0] ?? ""}`;
  return (pair || m.email[0] || "?").toUpperCase();
}

function MemberRow({
  member,
  isCurrentUser,
}: {
  member: OrgMember;
  isCurrentUser: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState<
    MemberActionResult | undefined,
    FormData
  >(updateMemberRole, undefined);
  const [removeState, removeAction, removePending] = useActionState<
    MemberActionResult | undefined,
    FormData
  >(removeMember, undefined);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const error = roleState?.error ?? removeState?.error;

  // Org removal is destructive enough to name the person first (R5); the
  // confirmed dispatch runs the same gated server action the form used.
  const confirmedRemove = () => {
    setConfirmingRemove(false);
    const fd = new FormData();
    fd.set("membership_id", member.id);
    startTransition(() => removeAction(fd));
  };

  return (
    <tr>
      <td>
        <div className="pp-cell-member">
          <div className="pp-av" data-c={roleColor(member.role)}>
            {initials(member)}
          </div>
          <div>
            <div className="pp-name">
              {displayName(member)}
              {isCurrentUser && <span className="pp-you">You</span>}
              {member.status === "invited" && (
                <span
                  className="pp-you"
                  style={{
                    background: "var(--c-amber-soft)",
                    color: "oklch(0.5 0.12 70)",
                  }}
                  title="Invited — hasn't signed in yet, so they can't reset a password until they accept the invite."
                >
                  Pending invite
                </span>
              )}
            </div>
            <div className="pp-email">{member.email}</div>
            {member.requestedRole &&
              member.requestedRole !== member.role && (
                <div className="pp-requested">
                  Requested {roleLabel(member.requestedRole)}
                </div>
              )}
            {error && (
              <div
                className="pp-requested"
                style={{ color: "var(--c-clay)" }}
              >
                {error}
              </div>
            )}
          </div>
        </div>
      </td>
      <td>
        {isCurrentUser ? (
          <span className="pill" data-c={roleColor(member.role)}>
            {roleLabel(member.role)}
          </span>
        ) : (
          <form action={roleAction}>
            <input type="hidden" name="membership_id" value={member.id} />
            <select
              name="role"
              defaultValue={member.role}
              className="field"
              style={{ width: 170 }}
              disabled={rolePending}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </form>
        )}
      </td>
      <td style={{ textAlign: "right" }}>
        {!isCurrentUser && (
          <>
            <button
              type="button"
              className="btn ghost sm danger"
              disabled={removePending}
              onClick={() => setConfirmingRemove(true)}
            >
              {removePending ? "Removing..." : "Remove"}
            </button>
            <ConfirmDialog
              open={confirmingRemove}
              title="Remove from organization?"
              message={`${displayName(member)} will lose access to this workspace and all of its productions. Their account is not deleted.`}
              confirmLabel="Remove"
              danger
              busy={removePending}
              onConfirm={confirmedRemove}
              onCancel={() => setConfirmingRemove(false)}
            />
          </>
        )}
      </td>
    </tr>
  );
}

export function MemberList({
  members,
  currentUserId,
}: {
  members: OrgMember[];
  currentUserId: string;
}) {
  if (members.length === 0) {
    return (
      <div className="pp-empty">
        <div className="pp-empty-ico">
          <Icon name="Users" size={26} />
        </div>
        <b>No team members yet</b>
        <span>Team members will appear here as they sign up.</span>
      </div>
    );
  }

  return (
    <div className="pp-table-wrap">
      <table className="pp-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Role</th>
            <th style={{ width: 96 }} />
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isCurrentUser={member.userId === currentUserId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
