"use client";

import type { DirectoryPerson } from "@/features/members/queries";
import { ROLE_META } from "@/features/members/constants";
import { displayName, initials, relativeTime } from "./helpers";

function StatusTag({ status }: { status: string }) {
  if (status === "invited")
    return <span className="pp-tag pp-tag-amber">Invite pending</span>;
  if (status === "inactive")
    return <span className="pp-tag pp-tag-mute">Inactive</span>;
  return null;
}

function Assignments({ person }: { person: DirectoryPerson }) {
  if (person.assignments.length === 0)
    return <span className="pp-muted">Unassigned</span>;
  return (
    <div className="pp-assigns">
      {person.assignments.slice(0, 2).map((a) => (
        <span key={a.membershipId} className="pp-assign">
          <span className="pp-assign-dot" data-c={a.colorToken} />
          <span className="pp-assign-prod">{a.productionTitle}</span>
          <span className="pp-assign-role">
            · {a.characterName || ROLE_META[a.role].label}
          </span>
        </span>
      ))}
      {person.assignments.length > 2 && (
        <span className="pp-more">+{person.assignments.length - 2} more</span>
      )}
    </div>
  );
}

export function PeopleTable({
  rows,
  selected,
  currentUserId,
  onToggle,
  onSelectAll,
  onOpen,
}: {
  rows: DirectoryPerson[];
  selected: Set<string>;
  currentUserId: string;
  onToggle: (userId: string) => void;
  onSelectAll: () => void;
  onOpen: (userId: string) => void;
}) {
  const allOn = rows.length > 0 && selected.size === rows.length;
  const someOn = selected.size > 0 && selected.size < rows.length;

  return (
    <div className="pp-table-wrap">
      <table className="pp-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input
                type="checkbox"
                checked={allOn}
                ref={(el) => {
                  if (el) el.indeterminate = someOn;
                }}
                onChange={onSelectAll}
                aria-label="Select all"
              />
            </th>
            <th>Member</th>
            <th>Role</th>
            <th>Productions</th>
            <th>Permission</th>
            <th>Last active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const meta = ROLE_META[p.role];
            return (
              <tr
                key={p.userId}
                data-selected={selected.has(p.userId) ? "1" : "0"}
                onClick={() => onOpen(p.userId)}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(p.userId)}
                    onChange={() => onToggle(p.userId)}
                    aria-label={`Select ${displayName(p)}`}
                  />
                </td>
                <td>
                  <div className="pp-cell-member">
                    <div className="pp-av" data-c={meta.c}>
                      {initials(p)}
                    </div>
                    <div>
                      <div className="pp-name">
                        {displayName(p)}
                        {p.userId === currentUserId && (
                          <span className="pp-you">You</span>
                        )}
                        <StatusTag status={p.status} />
                      </div>
                      <div className="pp-email">{p.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="pp-pill" data-c={meta.c}>
                    {meta.label}
                  </span>
                </td>
                <td>
                  <Assignments person={p} />
                </td>
                <td>
                  <span className="pp-perm" data-perm={meta.tier.toLowerCase()}>
                    {meta.tier}
                  </span>
                </td>
                <td>
                  <span className="pp-muted">
                    {p.status === "invited"
                      ? "Never"
                      : relativeTime(p.lastActiveAt)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PeopleCards({
  rows,
  onOpen,
}: {
  rows: DirectoryPerson[];
  onOpen: (userId: string) => void;
}) {
  return (
    <div className="pp-grid">
      {rows.map((p) => {
        const meta = ROLE_META[p.role];
        return (
          <button
            key={p.userId}
            className="pp-card"
            onClick={() => onOpen(p.userId)}
          >
            <div className="pp-av lg" data-c={meta.c}>
              {initials(p)}
            </div>
            <div className="pp-card-name">{displayName(p)}</div>
            <div className="pp-card-role">
              <span className="pp-pill" data-c={meta.c}>
                {meta.label}
              </span>
            </div>
            <div className="pp-card-prods">
              {p.assignments.length === 0
                ? "No assignments"
                : `${p.assignments.length} production${
                    p.assignments.length === 1 ? "" : "s"
                  }`}
            </div>
            {p.status === "invited" && (
              <div className="pp-card-status amber">Invite pending</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
