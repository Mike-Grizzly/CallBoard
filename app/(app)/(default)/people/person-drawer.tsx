"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { ROLES, type Role } from "@/types/roles";
import {
  ROLE_META,
  STATUS_META,
  PRONOUN_OPTIONS,
  type MemberStatus,
} from "@/features/members/constants";
import {
  updatePersonProfile,
  updateMemberRole,
  setMemberStatus,
  resendInvite,
  removeMember,
  removeProductionMember,
  deletePerson,
} from "@/features/members/actions";
import type { DirectoryPerson } from "@/features/members/queries";
import { displayName, initials, relativeTime, memberSince } from "./helpers";

export function PersonDrawer({
  person,
  isCurrentUser,
  onClose,
  onAssign,
  onChanged,
}: {
  person: DirectoryPerson;
  isCurrentUser: boolean;
  onClose: () => void;
  onAssign: (userId: string) => void;
  onChanged: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(person.firstName);
  const [lastName, setLastName] = useState(person.lastName);
  const [phone, setPhone] = useState(person.phone ?? "");
  const [pronouns, setPronouns] = useState(person.pronouns ?? "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const meta = ROLE_META[person.role];

  const run = async (
    fn: () => Promise<{ error?: string }>,
    successMessage: string,
  ) => {
    if (pending) return;
    setPending(true);
    setError(null);
    const res = await fn();
    setPending(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    onChanged(successMessage);
  };

  const saveProfile = () => {
    const fd = new FormData();
    fd.set("user_id", person.userId);
    fd.set("first_name", firstName);
    fd.set("last_name", lastName);
    fd.set("phone", phone);
    fd.set("pronouns", pronouns);
    run(() => updatePersonProfile(undefined, fd), "Profile updated.").then(
      () => setEditing(false),
    );
  };

  const changeRole = (role: Role) => {
    const fd = new FormData();
    fd.set("membership_id", person.membershipId);
    fd.set("role", role);
    run(() => updateMemberRole(undefined, fd), "Role updated.");
  };

  const changeStatus = (status: MemberStatus) =>
    run(
      () => setMemberStatus(person.userId, status),
      status === "inactive" ? "Member deactivated." : "Member reactivated.",
    );

  const removeAssignment = (membershipId: string, title: string) => {
    const fd = new FormData();
    fd.set("membership_id", membershipId);
    run(
      () => removeProductionMember(undefined, fd),
      `Removed from ${title}.`,
    );
  };

  const removeFromOrg = () => {
    const fd = new FormData();
    fd.set("membership_id", person.membershipId);
    run(() => removeMember(undefined, fd), "Removed from organization.").then(
      () => onClose(),
    );
  };

  const deleteAccount = () => {
    const ok = window.confirm(
      `Permanently delete ${displayName(person)}?\n\n` +
        "This removes their account, organization & production memberships, " +
        "and any reports, documents, announcements, or notes they created. " +
        "This cannot be undone.",
    );
    if (!ok) return;
    run(() => deletePerson(person.userId), "Account deleted.").then(() =>
      onClose(),
    );
  };

  return (
    <div className="pp-drawer-wrap" onClick={onClose}>
      <div className="pp-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="pp-drawer-h">
          <button className="pp-icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="X" size={14} />
          </button>
          <div style={{ flex: 1 }} />
          <a className="btn sm" href={`mailto:${person.email}`}>
            <Icon name="Mail" size={12} />
            <span>Message</span>
          </a>
          <button
            className="btn sm"
            onClick={() => {
              setError(null);
              setEditing((v) => !v);
            }}
          >
            <Icon name="PenLine" size={12} />
            <span>{editing ? "Cancel" : "Edit"}</span>
          </button>
        </div>

        {editing ? (
          <div className="pp-drawer-edit">
            <div className="pp-form-grid">
              <div className="pp-fg">
                <label>First name</label>
                <input
                  className="pp-field"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="pp-fg">
                <label>Last name</label>
                <input
                  className="pp-field"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="pp-fg">
                <label>Phone</label>
                <input
                  className="pp-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="pp-fg">
                <label>Pronouns</label>
                <select
                  className="pp-field"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                >
                  {PRONOUN_OPTIONS.map((p) => (
                    <option key={p || "none"} value={p}>
                      {p || "—"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="pp-form-actions">
              <button className="btn ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <div style={{ flex: 1 }} />
              <button
                className="btn primary"
                onClick={saveProfile}
                disabled={pending}
              >
                <Icon name="Check" size={14} />
                <span>{pending ? "Saving…" : "Save"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pp-drawer-hero">
            <div className="pp-av xl" data-c={meta.c}>
              {initials(person)}
            </div>
            <div>
              <h2>
                {displayName(person)}
                {person.pronouns && (
                  <span className="pp-drawer-pronouns">{person.pronouns}</span>
                )}
              </h2>
              <div className="pp-drawer-role">
                <span className="pp-pill" data-c={meta.c}>
                  {meta.label}
                </span>
              </div>
              <div className="pp-drawer-contact">
                <a href={`mailto:${person.email}`}>{person.email}</a>
                {person.phone && (
                  <>
                    <span className="pp-pip" />
                    <span>{person.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pp-drawer-meta">
          <div>
            <span>Status</span>
            <b className="pp-status" data-status={person.status}>
              <span className="dot" />
              {STATUS_META[person.status as MemberStatus]?.label ??
                person.status}
            </b>
          </div>
          <div>
            <span>Permission</span>
            <b>{meta.tier}</b>
          </div>
          <div>
            <span>Member since</span>
            <b>{memberSince(person.createdAt)}</b>
          </div>
          <div>
            <span>Last active</span>
            <b>
              {person.status === "invited"
                ? "Never"
                : relativeTime(person.lastActiveAt)}
            </b>
          </div>
        </div>

        {error && (
          <div className="pp-form-error" role="alert" style={{ margin: 16 }}>
            {error}
          </div>
        )}

        <div className="pp-drawer-section">
          <h3>Organization role</h3>
          <select
            className="pp-field"
            value={person.role}
            disabled={pending || isCurrentUser}
            onChange={(e) => changeRole(e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
              </option>
            ))}
          </select>
          {isCurrentUser && (
            <div className="pp-empty-sm">You cannot change your own role.</div>
          )}

          {!isCurrentUser && (
            <div className="pp-drawer-actions">
              {person.status === "invited" && (
                <button
                  className="btn sm"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => resendInvite(person.userId),
                      "Invite email resent.",
                    )
                  }
                >
                  <Icon name="Mail" size={12} />
                  <span>Resend invite</span>
                </button>
              )}
              {person.status === "inactive" ? (
                <button
                  className="btn sm"
                  disabled={pending}
                  onClick={() => changeStatus("active")}
                >
                  <span>Reactivate</span>
                </button>
              ) : (
                <button
                  className="btn sm"
                  disabled={pending}
                  onClick={() => changeStatus("inactive")}
                >
                  <span>Deactivate</span>
                </button>
              )}
              <button
                className="btn ghost sm danger"
                disabled={pending}
                onClick={removeFromOrg}
              >
                <span>Remove from org</span>
              </button>
              <button
                className="btn ghost sm danger"
                disabled={pending}
                onClick={deleteAccount}
              >
                <Icon name="Trash2" size={12} />
                <span>Delete account</span>
              </button>
            </div>
          )}
        </div>

        <div className="pp-drawer-section">
          <div className="pp-drawer-section-h">
            <h3>Production assignments</h3>
            <button
              className="btn sm"
              onClick={() => onAssign(person.userId)}
            >
              <Icon name="Plus" size={11} />
              <span>Assign</span>
            </button>
          </div>
          {person.assignments.length === 0 ? (
            <div className="pp-empty-sm">
              Not currently assigned to any production.
            </div>
          ) : (
            <div className="pp-drawer-assigns">
              {person.assignments.map((a) => (
                <div key={a.membershipId} className="pp-drawer-assign">
                  <span
                    className="pp-assign-dot lg"
                    data-c={a.colorToken}
                  />
                  <div style={{ flex: 1 }}>
                    <b>{a.productionTitle}</b>
                    <span>
                      {a.characterName
                        ? `${ROLE_META[a.role].label} · ${a.characterName}`
                        : ROLE_META[a.role].label}
                    </span>
                  </div>
                  <button
                    className="pp-icon-btn delete"
                    disabled={pending}
                    aria-label={`Remove from ${a.productionTitle}`}
                    onClick={() =>
                      removeAssignment(a.membershipId, a.productionTitle)
                    }
                  >
                    <Icon name="Trash2" size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
