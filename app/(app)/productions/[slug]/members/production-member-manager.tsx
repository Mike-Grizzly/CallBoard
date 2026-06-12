"use client";

import { useActionState, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { ROLES } from "@/types/roles";
import {
  assignProductionMember,
  removeProductionMember,
  updateCharacterName,
  type MemberActionResult,
} from "@/features/members/actions";
import type { ProductionMember, OrgMember } from "@/features/members/queries";

const PRODUCTION_ROLES = ROLES.filter((r) => r !== "admin");

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

function BulkAssignForm({
  productionId,
  availableMembers,
}: {
  productionId: string;
  availableMembers: OrgMember[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [role, setRole] = useState("cast");
  const [state, formAction, pending] = useActionState<
    MemberActionResult | undefined,
    FormData
  >(assignProductionMember, undefined);

  if (availableMembers.length === 0) {
    return (
      <p className="muted" style={{ fontSize: 13 }}>
        All organization members are already assigned to this production.
      </p>
    );
  }

  function toggleMember(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) =>
      prev.size === availableMembers.length
        ? new Set()
        : new Set(availableMembers.map((m) => m.userId)),
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="row-between">
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={selected.size === availableMembers.length}
            onChange={toggleAll}
          />
          <span>Select all · {availableMembers.length}</span>
        </label>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span
            style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-3)" }}
          >
            Assign as
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="field"
            style={{ width: 160 }}
          >
            {PRODUCTION_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pp-pick">
        {availableMembers.map((m) => (
          <label key={m.userId} className="pp-pick-row">
            <input
              type="checkbox"
              checked={selected.has(m.userId)}
              onChange={() => toggleMember(m.userId)}
            />
            <div className="pp-av" data-c={roleColor(m.role)}>
              {initials(m)}
            </div>
            <div>
              <div className="pp-name">{displayName(m)}</div>
              <div className="pp-email">{m.email}</div>
            </div>
          </label>
        ))}
      </div>

      <form
        action={(formData) => {
          const userIds = Array.from(selected);
          if (userIds.length === 0) return;
          formData.set("production_id", productionId);
          formData.set("role", role);
          formData.set("user_ids", JSON.stringify(userIds));
          formAction(formData);
        }}
      >
        <button
          type="submit"
          className="btn primary"
          disabled={pending || selected.size === 0}
        >
          <Icon name="UserPlus" size={14} />
          <span>
            {pending
              ? "Assigning..."
              : `Assign ${selected.size} member${selected.size !== 1 ? "s" : ""}`}
          </span>
        </button>
      </form>

      {state?.error && (
        <p className="pp-requested" style={{ color: "var(--c-clay)" }}>
          {state.error}
        </p>
      )}
    </div>
  );
}

function CharacterNameEditor({
  membershipId,
  current,
}: {
  membershipId: string;
  current: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current ?? "");
  const [, formAction, pending] = useActionState<
    MemberActionResult | undefined,
    FormData
  >(updateCharacterName, undefined);

  if (!editing) {
    return (
      <button
        type="button"
        className="pp-char-btn"
        onClick={() => setEditing(true)}
      >
        {current ? (
          <span>{current}</span>
        ) : (
          <span className="muted">+ Add character</span>
        )}
      </button>
    );
  }

  return (
    <form
      action={(fd) => {
        fd.set("membership_id", membershipId);
        fd.set("character_name", value);
        formAction(fd);
        setEditing(false);
      }}
      style={{ display: "flex", alignItems: "center", gap: 4 }}
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
        placeholder="Character"
        className="field"
        style={{ width: 132, padding: "4px 8px", fontSize: 12.5 }}
      />
      <button
        type="submit"
        className="pp-icon-btn"
        disabled={pending}
        aria-label="Save character name"
      >
        <Icon name="Check" size={13} />
      </button>
      <button
        type="button"
        className="pp-icon-btn"
        onClick={() => setEditing(false)}
        aria-label="Cancel"
      >
        <Icon name="X" size={13} />
      </button>
    </form>
  );
}

function CurrentMemberRow({
  member,
  showCharacter,
}: {
  member: ProductionMember;
  showCharacter: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    MemberActionResult | undefined,
    FormData
  >(removeProductionMember, undefined);

  return (
    <tr>
      <td>
        <div className="pp-cell-member">
          <div className="pp-av" data-c={roleColor(member.role)}>
            {initials(member)}
          </div>
          <div>
            <div className="pp-name">{displayName(member)}</div>
            <div className="pp-email">{member.email}</div>
            {state?.error && (
              <div
                className="pp-requested"
                style={{ color: "var(--c-clay)" }}
              >
                {state.error}
              </div>
            )}
          </div>
        </div>
      </td>
      <td>
        <span className="pill" data-c={roleColor(member.role)}>
          {roleLabel(member.role)}
        </span>
      </td>
      {showCharacter && (
        <td>
          {member.role === "cast" ? (
            <CharacterNameEditor
              membershipId={member.id}
              current={member.characterName ?? null}
            />
          ) : (
            <span className="muted" style={{ fontSize: 12.5 }}>
              —
            </span>
          )}
        </td>
      )}
      <td style={{ textAlign: "right" }}>
        <form action={formAction}>
          <input type="hidden" name="membership_id" value={member.id} />
          <button
            type="submit"
            className="btn ghost sm danger"
            disabled={pending}
          >
            {pending ? "Removing..." : "Remove"}
          </button>
        </form>
      </td>
    </tr>
  );
}

function ProductionMembersTable({
  members,
}: {
  members: ProductionMember[];
}) {
  if (members.length === 0) {
    return (
      <div className="pp-empty">
        <div className="pp-empty-ico">
          <Icon name="Users" size={26} />
        </div>
        <b>No one assigned yet</b>
        <span>
          Add organization members above to build this production&apos;s team.
        </span>
      </div>
    );
  }

  const showCharacter = members.some((m) => m.role === "cast");

  return (
    <div className="pp-table-wrap">
      <table className="pp-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Role</th>
            {showCharacter && <th>Character</th>}
            <th style={{ width: 96 }} />
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <CurrentMemberRow
              key={member.id}
              member={member}
              showCharacter={showCharacter}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProductionMemberManager({
  productionId,
  currentMembers,
  availableMembers,
}: {
  productionId: string;
  currentMembers: ProductionMember[];
  availableMembers: OrgMember[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <section>
        <div className="h-eyebrow" style={{ marginBottom: 10 }}>
          Add to this production
        </div>
        <div className="card card-pad">
          <BulkAssignForm
            productionId={productionId}
            availableMembers={availableMembers}
          />
        </div>
      </section>

      <section>
        <div className="h-eyebrow" style={{ marginBottom: 10 }}>
          Current team · {currentMembers.length}
        </div>
        <ProductionMembersTable members={currentMembers} />
      </section>
    </div>
  );
}
