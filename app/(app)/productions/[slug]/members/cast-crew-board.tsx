"use client";

import {
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { ROLE_META } from "@/features/members/constants";
import { ROLES, type Role } from "@/types/roles";
import {
  assignRoleToMember,
  unassignRole,
  inviteAndAssignRole,
  assignProductionMember,
  removeProductionMember,
} from "@/features/members/actions";
import type { DirectoryPerson, ProductionMember } from "@/features/members/queries";
import type { ProductionRoleRow } from "@/features/productions/queries";
import { PersonDrawer } from "@/app/(app)/(default)/people/person-drawer";

// Team buckets are the production role enum minus admin (org-only) and cast
// (which lives in the character slots above). Each bucket holds many — the
// schema allows multiple people per role.
const TEAM_ROLES: Role[] = ROLES.filter(
  (r) => r !== "admin" && r !== "cast",
);

const TEAM_ROLE_SUB: Record<string, string> = {
  producer: "Produces the show",
  director: "Leads the show",
  choreographer: "Movement",
  stage_manager: "Runs rehearsals",
  crew: "Backstage",
};

type RosterFilter = "all" | "unassigned" | "cast" | "creative" | "crew";

function displayName(p: { firstName: string | null; lastName: string | null; email: string }) {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.email;
}
function initials(p: { firstName: string | null; lastName: string | null; email: string }) {
  const pair = `${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`;
  return (pair || p.email[0] || "?").toUpperCase();
}

// Maps a person's org role to the roster's coarse cast/creative/crew chips.
function personKind(role: Role): "cast" | "creative" | "crew" {
  if (role === "cast") return "cast";
  if (role === "crew") return "crew";
  return "creative";
}

function useIsTouch() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(max-width: 859px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 859px)").matches,
    () => false,
  );
}

type Sheet =
  | { mode: "assignPerson"; userId: string; title: string }
  | { mode: "pickSlot"; roleId: string; title: string }
  | { mode: "pickBucket"; role: Role; title: string };

export function CastCrewBoard({
  productionId,
  productionTitle,
  people,
  characters,
  members,
  currentUserId,
  canInvite,
}: {
  productionId: string;
  productionTitle: string;
  people: DirectoryPerson[];
  characters: ProductionRoleRow[];
  members: ProductionMember[];
  currentUserId: string;
  canInvite: boolean;
}) {
  const router = useRouter();
  const isTouch = useIsTouch();
  const [pending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RosterFilter>("all");
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [mtab, setMtab] = useState<"board" | "company">("board");
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const peopleById = useMemo(() => {
    const m = new Map<string, DirectoryPerson>();
    for (const p of people) m.set(p.userId, p);
    return m;
  }, [people]);

  const assignedIds = useMemo(
    () => new Set(members.map((m) => m.userId)),
    [members],
  );

  function flashToast(msg: string, error = false) {
    setToast({ msg, error });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), error ? 3200 : 1800);
  }

  function run(fn: () => Promise<{ error?: string }>, successMsg: string) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) {
        flashToast(res.error, true);
        return;
      }
      flashToast(successMsg);
      router.refresh();
    });
  }

  function assignToSlot(userId: string, roleId: string) {
    const ch = characters.find((c) => c.id === roleId);
    run(
      () => assignRoleToMember(roleId, userId),
      `${displayName(peopleById.get(userId) ?? { firstName: null, lastName: null, email: "Someone" })} cast as ${ch?.name ?? "character"}`,
    );
  }

  function assignToBucket(userId: string, role: Role) {
    const fd = new FormData();
    fd.set("production_id", productionId);
    fd.set("role", role);
    fd.set("user_ids", JSON.stringify([userId]));
    run(
      () => assignProductionMember(undefined, fd),
      `${displayName(peopleById.get(userId) ?? { firstName: null, lastName: null, email: "Someone" })} added as ${ROLE_META[role].label}`,
    );
  }

  function clearSlot(roleId: string) {
    run(() => unassignRole(roleId), "Character uncast.");
  }

  function removeFromBucket(membershipId: string, name: string) {
    const fd = new FormData();
    fd.set("membership_id", membershipId);
    run(() => removeProductionMember(undefined, fd), `Removed ${name}.`);
  }

  // ── drag & drop (desktop) ──
  function onDragStart(e: React.DragEvent, userId: string) {
    dragId.current = userId;
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", userId);
    } catch {
      /* some browsers throw on setData during programmatic drags */
    }
  }
  function onDragEnd() {
    dragId.current = null;
    setDropKey(null);
  }
  function onZoneOver(e: React.DragEvent, key: string) {
    e.preventDefault();
    if (dropKey !== key) setDropKey(key);
  }
  function onZoneLeave(e: React.DragEvent, key: string) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropKey((k) => (k === key ? null : k));
    }
  }
  function onDropSlot(e: React.DragEvent, roleId: string) {
    e.preventDefault();
    if (dragId.current) assignToSlot(dragId.current, roleId);
    setDropKey(null);
  }
  function onDropBucket(e: React.DragEvent, role: Role) {
    e.preventDefault();
    if (dragId.current) assignToBucket(dragId.current, role);
    setDropKey(null);
  }

  // ── labels ──
  function assignmentLabel(userId: string): string | null {
    const slot = characters.find((c) => c.assignedUserId === userId);
    if (slot) return `Cast · ${slot.name}`;
    const team = members.find((m) => m.userId === userId && m.role !== "cast");
    if (team) return ROLE_META[team.role as Role]?.label ?? team.role;
    const cast = members.find((m) => m.userId === userId);
    if (cast) return cast.characterName ? `Cast · ${cast.characterName}` : "Cast";
    return null;
  }

  // ── filtered roster ──
  const roster = people.filter((p) => {
    const q = search.trim().toLowerCase();
    if (filter === "unassigned" && assignedIds.has(p.userId)) return false;
    if (
      (filter === "cast" || filter === "creative" || filter === "crew") &&
      personKind(p.role) !== filter
    ) {
      return false;
    }
    if (
      q &&
      !displayName(p).toLowerCase().includes(q) &&
      !p.email.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });

  const castCount = characters.filter((c) => c.assignedUserId).length;
  const teamCount = members.filter((m) => m.role !== "cast").length;

  // ── sheet openers ──
  function openAssignSheet(userId: string) {
    const p = peopleById.get(userId);
    setSheet({ mode: "assignPerson", userId, title: `Assign ${p ? displayName(p) : "person"}` });
  }
  function openSlotSheet(roleId: string) {
    const ch = characters.find((c) => c.id === roleId);
    setSheet({ mode: "pickSlot", roleId, title: `Cast ${ch?.name ?? "character"}` });
  }
  function openBucketSheet(role: Role) {
    setSheet({ mode: "pickBucket", role, title: `Add to ${ROLE_META[role].label}` });
  }

  const drawerPerson = drawerUserId ? peopleById.get(drawerUserId) ?? null : null;

  return (
    <div className="ax-root">
      <div className="ax-mobile-tabs">
        {(["board", "company"] as const).map((k) => (
          <button
            key={k}
            type="button"
            className="ax-mobile-tab"
            data-on={mtab === k ? "1" : "0"}
            onClick={() => setMtab(k)}
          >
            {k === "board" ? "Casting board" : "Company"}
          </button>
        ))}
      </div>

      <div className="ax-wrap" data-mtab={mtab}>
        {/* ── Company roster ── */}
        <aside className="ax-pool">
          <div className="ax-pool-h">
            <div className="t">
              <h3>Company</h3>
              <span className="n">{roster.length} people</span>
            </div>
            <div className="sub">Drag anyone onto a role to assign them.</div>
            <div className="ax-search">
              <Icon name="Search" size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search the company…"
              />
            </div>
            <div className="ax-chips">
              {(
                [
                  ["all", "All"],
                  ["unassigned", "Unassigned"],
                  ["cast", "Cast"],
                  ["creative", "Creative"],
                  ["crew", "Crew"],
                ] as [RosterFilter, string][]
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  className="ax-chip"
                  data-on={filter === k ? "1" : "0"}
                  onClick={() => setFilter(k)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="ax-list">
            {roster.length === 0 ? (
              <p className="muted" style={{ fontSize: 12.5, padding: "8px 6px" }}>
                No one matches that filter.
              </p>
            ) : (
              roster.map((p) => {
                const assigned = assignedIds.has(p.userId);
                return (
                  <div
                    key={p.userId}
                    className="ax-person"
                    data-assigned={assigned ? "1" : "0"}
                    draggable={!isTouch}
                    onDragStart={(e) => onDragStart(e, p.userId)}
                    onDragEnd={onDragEnd}
                    onClick={(e: MouseEvent) => {
                      if (
                        !(e.target as HTMLElement).closest(".ax-assign-btn, .grip")
                      ) {
                        setDrawerUserId(p.userId);
                      }
                    }}
                  >
                    <span className="pp-av ax-av-sm" data-c={ROLE_META[p.role].c}>
                      {initials(p)}
                    </span>
                    <div className="who">
                      <b>{displayName(p)}</b>
                      <span>{assignmentLabel(p.userId) ?? ROLE_META[p.role].label}</span>
                    </div>
                    <span className="ax-assigned-tick">
                      <Icon name="Check" size={15} />
                    </span>
                    <button
                      type="button"
                      className="ax-assign-btn"
                      title="Assign to a role"
                      onClick={() => openAssignSheet(p.userId)}
                    >
                      <Icon name="Plus" size={15} />
                    </button>
                    <span className="grip">
                      <Icon name="Grip" size={14} />
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Board ── */}
        <section className="ax-board">
          <div className="ax-board-head">
            <div>
              <h2>{productionTitle}</h2>
              <div className="sub">
                Cast your characters and build the production team.
              </div>
            </div>
            <div className="ax-progress">
              <div className="ax-stat">
                <b>
                  {castCount}/{characters.length}
                </b>
                <span>Cast</span>
              </div>
              <div className="ax-stat">
                <b>{teamCount}</b>
                <span>Team</span>
              </div>
            </div>
          </div>

          {/* Characters */}
          <div className="ax-card">
            <div className="ax-card-h">
              <h3>Cast — characters</h3>
              <span className="n">
                {castCount} of {characters.length} cast
              </span>
            </div>
            {characters.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>
                No characters yet. Add them in the new-production wizard, or run
                AI script analysis to pull the cast list from the script.
              </p>
            ) : (
              <div className="ax-roles">
                {characters.map((ch) => {
                  const person = ch.assignedUserId
                    ? peopleById.get(ch.assignedUserId) ?? null
                    : null;
                  const key = `slot:${ch.id}`;
                  const filled = !!ch.assignedUserId;
                  return (
                    <div key={ch.id} className="ax-role">
                      <div className="cname">
                        {ch.name} <span className="tag">· {ch.type}</span>
                      </div>
                      <div
                        className={`ax-slot${dropKey === key ? " drop" : ""}`}
                        data-filled={filled ? "1" : "0"}
                        onDragOver={(e) => onZoneOver(e, key)}
                        onDragLeave={(e) => onZoneLeave(e, key)}
                        onDrop={(e) => onDropSlot(e, ch.id)}
                        onClick={() => {
                          if (!filled && isTouch) openSlotSheet(ch.id);
                        }}
                      >
                        {filled ? (
                          <>
                            <div
                              className="filled"
                              onClick={() =>
                                ch.assignedUserId &&
                                setDrawerUserId(ch.assignedUserId)
                              }
                            >
                              <span
                                className="pp-av ax-av-sm"
                                data-c={person ? ROLE_META[person.role].c : "sand"}
                              >
                                {person
                                  ? initials(person)
                                  : initials({
                                      firstName: ch.assignedFirstName,
                                      lastName: ch.assignedLastName,
                                      email: ch.assignedEmail ?? "?",
                                    })}
                              </span>
                              <div className="who">
                                <b>
                                  {person
                                    ? displayName(person)
                                    : displayName({
                                        firstName: ch.assignedFirstName,
                                        lastName: ch.assignedLastName,
                                        email: ch.assignedEmail ?? "",
                                      })}
                                </b>
                                <span>Cast</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="ax-x"
                              title="Unassign"
                              disabled={pending}
                              onClick={() => clearSlot(ch.id)}
                            >
                              <Icon name="X" size={13} />
                            </button>
                          </>
                        ) : (
                          <span className="empty">
                            <Icon name="Plus" size={14} />
                            <span className="d-hint">Drag a performer here</span>
                            <span className="m-hint">Tap to cast</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Team */}
          <div className="ax-card">
            <div className="ax-card-h">
              <h3>Production team</h3>
              <span className="n">
                {teamCount === 0 ? "0 filled" : `${teamCount} assigned`}
              </span>
            </div>
            <div className="ax-team">
              {TEAM_ROLES.map((role) => {
                const bucketMembers = members.filter((m) => m.role === role);
                const key = `bucket:${role}`;
                return (
                  <div key={role} className="ax-bucket-row">
                    <div className="ax-bucket-label">
                      {ROLE_META[role].label}
                      <span>{TEAM_ROLE_SUB[role] ?? "Team"} · multiple</span>
                    </div>
                    <div
                      className={`ax-bucket${dropKey === key ? " drop" : ""}`}
                      data-filled={bucketMembers.length ? "1" : "0"}
                      onDragOver={(e) => onZoneOver(e, key)}
                      onDragLeave={(e) => onZoneLeave(e, key)}
                      onDrop={(e) => onDropBucket(e, role)}
                      onClick={(e: MouseEvent) => {
                        if (
                          isTouch &&
                          !(e.target as HTMLElement).closest(".ax-pchip")
                        ) {
                          openBucketSheet(role);
                        }
                      }}
                    >
                      {bucketMembers.length ? (
                        bucketMembers.map((m) => (
                          <span
                            key={m.id}
                            className="ax-pchip"
                            onClick={() => setDrawerUserId(m.userId)}
                          >
                            <span
                              className="pp-av ax-av-xs"
                              data-c={ROLE_META[role].c}
                            >
                              {initials(m)}
                            </span>
                            {displayName(m)}
                            <button
                              type="button"
                              className="ax-pchip-x"
                              title="Remove"
                              disabled={pending}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromBucket(m.id, displayName(m));
                              }}
                            >
                              <Icon name="X" size={12} />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="hint">
                          <span className="d-hint">Drag people here</span>
                          <span className="m-hint">Tap to add</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ── Person drawer (reuses the People directory drawer) ── */}
      {drawerPerson && (
        <PersonDrawer
          person={drawerPerson}
          isCurrentUser={drawerPerson.userId === currentUserId}
          onClose={() => setDrawerUserId(null)}
          onAssign={(userId) => {
            setDrawerUserId(null);
            openAssignSheet(userId);
          }}
          onChanged={(message) => {
            flashToast(message);
            router.refresh();
          }}
        />
      )}

      {/* ── Tap-to-assign bottom sheet ── */}
      {sheet && (
        <AssignSheet
          sheet={sheet}
          characters={characters}
          members={members}
          people={people}
          assignedIds={assignedIds}
          canInvite={canInvite}
          pending={pending}
          assignmentLabel={assignmentLabel}
          onClose={() => setSheet(null)}
          onSlot={(userId, roleId) => {
            assignToSlot(userId, roleId);
            setSheet(null);
          }}
          onBucket={(userId, role) => {
            assignToBucket(userId, role);
            setSheet(null);
          }}
          onInvite={(roleId, firstName, lastName, email) => {
            run(
              () => inviteAndAssignRole({ roleId, firstName, lastName, email }),
              "Invited & cast.",
            );
            setSheet(null);
          }}
        />
      )}

      {toast && (
        <div className="ax-toast" data-error={toast.error ? "1" : "0"}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function AssignSheet({
  sheet,
  characters,
  members,
  people,
  assignedIds,
  canInvite,
  pending,
  assignmentLabel,
  onClose,
  onSlot,
  onBucket,
  onInvite,
}: {
  sheet: Sheet;
  characters: ProductionRoleRow[];
  members: ProductionMember[];
  people: DirectoryPerson[];
  assignedIds: Set<string>;
  canInvite: boolean;
  pending: boolean;
  assignmentLabel: (userId: string) => string | null;
  onClose: () => void;
  onSlot: (userId: string, roleId: string) => void;
  onBucket: (userId: string, role: Role) => void;
  onInvite: (
    roleId: string,
    firstName: string,
    lastName: string,
    email: string,
  ) => void;
}) {
  const [inviting, setInviting] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");

  // Unassigned people first, so casting from an empty target is quick.
  const sortedPeople = useMemo(
    () =>
      [...people].sort(
        (a, b) =>
          (assignedIds.has(a.userId) ? 1 : 0) -
          (assignedIds.has(b.userId) ? 1 : 0),
      ),
    [people, assignedIds],
  );

  return (
    <div
      className="cc-scrim sheet"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("cc-scrim")) onClose();
      }}
    >
      <div className="cc-sheet" role="dialog" aria-label={sheet.title}>
        <div className="cc-sheet-h">
          <h3>{sheet.title}</h3>
          <button
            type="button"
            className="pp-icon-btn"
            aria-label="Close"
            onClick={onClose}
          >
            <Icon name="X" size={16} />
          </button>
        </div>
        <div className="cc-sheet-body">
          {sheet.mode === "assignPerson" ? (
            <>
              <div className="cc-sheet-sec">Cast as a character</div>
              {characters.filter(
                (c) => !c.assignedUserId || c.assignedUserId === sheet.userId,
              ).length === 0 ? (
                <div className="cc-sheet-empty">All characters are cast.</div>
              ) : (
                characters
                  .filter(
                    (c) =>
                      !c.assignedUserId || c.assignedUserId === sheet.userId,
                  )
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="cc-sheet-opt"
                      disabled={pending}
                      onClick={() => onSlot(sheet.userId, c.id)}
                    >
                      <div className="who">
                        <b>{c.name}</b>
                        <span>{c.type}</span>
                      </div>
                      {c.assignedUserId === sheet.userId && (
                        <span className="meta">current</span>
                      )}
                    </button>
                  ))
              )}
              <div className="cc-sheet-sec">Production team</div>
              {TEAM_ROLES.map((role) => {
                const inBucket = members.some(
                  (m) => m.userId === sheet.userId && m.role === role,
                );
                return (
                  <button
                    key={role}
                    type="button"
                    className="cc-sheet-opt"
                    disabled={pending}
                    onClick={() => onBucket(sheet.userId, role)}
                  >
                    <div className="who">
                      <b>{ROLE_META[role].label}</b>
                      <span>{TEAM_ROLE_SUB[role] ?? "Team"}</span>
                    </div>
                    {inBucket && <span className="meta">current</span>}
                  </button>
                );
              })}
            </>
          ) : (
            <>
              {sheet.mode === "pickSlot" && canInvite && (
                <div className="cc-sheet-invite">
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
                    <div className="cc-invite-fields">
                      <input
                        className="field"
                        placeholder="First name"
                        value={first}
                        onChange={(e) => setFirst(e.target.value)}
                      />
                      <input
                        className="field"
                        placeholder="Last name"
                        value={last}
                        onChange={(e) => setLast(e.target.value)}
                      />
                      <input
                        className="field"
                        type="email"
                        placeholder="email@theatre.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn primary sm"
                        disabled={pending || !email.trim()}
                        onClick={() =>
                          onInvite(sheet.roleId, first, last, email)
                        }
                      >
                        <Icon name="UserPlus" size={13} />
                        Invite &amp; cast
                      </button>
                    </div>
                  )}
                </div>
              )}
              {sortedPeople.map((p) => (
                <button
                  key={p.userId}
                  type="button"
                  className="cc-sheet-opt"
                  disabled={pending}
                  onClick={() =>
                    sheet.mode === "pickSlot"
                      ? onSlot(p.userId, sheet.roleId)
                      : onBucket(p.userId, sheet.role)
                  }
                >
                  <span className="pp-av ax-av-sm" data-c={ROLE_META[p.role].c}>
                    {initials(p)}
                  </span>
                  <div className="who">
                    <b>{displayName(p)}</b>
                    <span>{ROLE_META[p.role].label}</span>
                  </div>
                  <span className="meta">
                    {assignmentLabel(p.userId) ?? "Unassigned"}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
