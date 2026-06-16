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
import { type Role } from "@/types/roles";
import {
  assignRoleToMember,
  unassignRole,
  inviteAndAssignRole,
  assignTeamMember,
  removeProductionMember,
} from "@/features/members/actions";
import type { DirectoryPerson, ProductionMember } from "@/features/members/queries";
import type { ProductionRoleRow } from "@/features/productions/queries";
import type { ProductionTeamBucket } from "@/features/productions/departments";
import { PersonDrawer } from "@/app/(app)/(default)/people/person-drawer";

// A team bucket is a (role, position) pair. `position` is an optional label
// stored in `production_memberships.characterName`, letting the board show
// finer positions than the coarse role enum while still mapping to a real role
// for access. The team buckets themselves are derived per-production from the
// setup wizard's department selections (see `buildTeamBuckets`).
type Bucket = ProductionTeamBucket;

// The big multi-occupant ensemble bucket lives in the Cast section. Stored as
// cast members tagged with the "Ensemble" position.
const ENSEMBLE_BUCKET: Bucket = {
  id: "ensemble",
  label: "Ensemble",
  role: "cast",
  position: "Ensemble",
  sub: "The company ensemble",
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
  | { mode: "pickBucket"; bucket: Bucket; title: string };

export function CastCrewBoard({
  productionId,
  productionTitle,
  people,
  characters,
  members,
  teamBuckets,
  currentUserId,
  canInvite,
}: {
  productionId: string;
  productionTitle: string;
  people: DirectoryPerson[];
  characters: ProductionRoleRow[];
  members: ProductionMember[];
  teamBuckets: Bucket[];
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

  // A person's avatar color is their stable org-role color — the same value the
  // People directory + drawer use — so it never changes as they move between
  // board roles.
  function colorOf(userId: string | null | undefined): string {
    if (!userId) return "sand";
    const p = peopleById.get(userId);
    return p ? ROLE_META[p.role].c : "sand";
  }

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

  function nameOf(userId: string) {
    const p = peopleById.get(userId);
    return p ? displayName(p) : "Someone";
  }

  function assignToSlot(userId: string, roleId: string) {
    const ch = characters.find((c) => c.id === roleId);
    run(
      () => assignRoleToMember(roleId, userId),
      `${nameOf(userId)} cast as ${ch?.name ?? "character"}`,
    );
  }

  function assignToBucket(userId: string, bucket: Bucket) {
    run(
      () =>
        assignTeamMember({
          productionId,
          userId,
          role: bucket.role,
          position: bucket.position,
        }),
      `${nameOf(userId)} added as ${bucket.label}`,
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

  // ── drag & drop (desktop) — sources are roster cards, filled slots, chips ──
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
  function onDropBucket(e: React.DragEvent, bucket: Bucket) {
    e.preventDefault();
    if (dragId.current) assignToBucket(dragId.current, bucket);
    setDropKey(null);
  }

  // ── data helpers ──
  function bucketMembers(b: Bucket): ProductionMember[] {
    return members.filter(
      (m) =>
        m.role === b.role &&
        (b.position ? m.characterName === b.position : !m.characterName),
    );
  }

  function assignmentLabel(userId: string): string | null {
    const slot = characters.find((c) => c.assignedUserId === userId);
    if (slot) return `Cast · ${slot.name}`;
    const m = members.find((x) => x.userId === userId);
    if (!m) return null;
    if (m.role === "cast") {
      return m.characterName ? `Cast · ${m.characterName}` : "Cast";
    }
    const roleLabel = ROLE_META[m.role as Role]?.label ?? m.role;
    return m.characterName ? `${roleLabel} · ${m.characterName}` : roleLabel;
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
  const ensembleMembers = bucketMembers(ENSEMBLE_BUCKET);
  const teamCount = members.filter((m) => m.role !== "cast").length;

  // ── sheet openers ──
  function openAssignSheet(userId: string) {
    setSheet({
      mode: "assignPerson",
      userId,
      title: `Assign ${nameOf(userId)}`,
    });
  }
  function openSlotSheet(roleId: string) {
    const ch = characters.find((c) => c.id === roleId);
    setSheet({ mode: "pickSlot", roleId, title: `Cast ${ch?.name ?? "character"}` });
  }
  function openBucketSheet(bucket: Bucket) {
    setSheet({ mode: "pickBucket", bucket, title: `Add to ${bucket.label}` });
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
                    <span className="pp-av ax-av-sm" data-c={colorOf(p.userId)}>
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
                Cast your characters and build the production team. Drag a name
                between roles to move them.
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

          {/* Cast: named characters + the ensemble bucket */}
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
                        {filled && ch.assignedUserId ? (
                          <>
                            <div
                              className="filled"
                              draggable={!isTouch}
                              onDragStart={(e) =>
                                onDragStart(e, ch.assignedUserId!)
                              }
                              onDragEnd={onDragEnd}
                              onClick={() => setDrawerUserId(ch.assignedUserId)}
                            >
                              <span
                                className="pp-av ax-av-sm"
                                data-c={colorOf(ch.assignedUserId)}
                              >
                                {initials({
                                  firstName: ch.assignedFirstName,
                                  lastName: ch.assignedLastName,
                                  email: ch.assignedEmail ?? "?",
                                })}
                              </span>
                              <div className="who">
                                <b>
                                  {displayName({
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

            {/* Ensemble — the big multi-occupant cast bucket */}
            <BucketZone
              bucket={ENSEMBLE_BUCKET}
              members={ensembleMembers}
              big
              dropKey={dropKey}
              pending={pending}
              isTouch={isTouch}
              colorOf={colorOf}
              displayName={displayName}
              initials={initials}
              onZoneOver={onZoneOver}
              onZoneLeave={onZoneLeave}
              onDropBucket={onDropBucket}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onOpenSheet={openBucketSheet}
              onChip={(userId) => setDrawerUserId(userId)}
              onRemove={removeFromBucket}
            />
          </div>

          {/* Production team */}
          <div className="ax-card">
            <div className="ax-card-h">
              <h3>Production team</h3>
              <span className="n">
                {teamCount === 0 ? "0 filled" : `${teamCount} assigned`}
              </span>
            </div>
            <div className="ax-team">
              {teamBuckets.map((bucket) => (
                <BucketZone
                  key={bucket.id}
                  bucket={bucket}
                  members={bucketMembers(bucket)}
                  dropKey={dropKey}
                  pending={pending}
                  isTouch={isTouch}
                  colorOf={colorOf}
                  displayName={displayName}
                  initials={initials}
                  onZoneOver={onZoneOver}
                  onZoneLeave={onZoneLeave}
                  onDropBucket={onDropBucket}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onOpenSheet={openBucketSheet}
                  onChip={(userId) => setDrawerUserId(userId)}
                  onRemove={removeFromBucket}
                />
              ))}
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
          teamBuckets={teamBuckets}
          people={people}
          assignedIds={assignedIds}
          canInvite={canInvite}
          pending={pending}
          colorOf={colorOf}
          assignmentLabel={assignmentLabel}
          onClose={() => setSheet(null)}
          onSlot={(userId, roleId) => {
            assignToSlot(userId, roleId);
            setSheet(null);
          }}
          onBucket={(userId, bucket) => {
            assignToBucket(userId, bucket);
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

function BucketZone({
  bucket,
  members,
  big,
  dropKey,
  pending,
  isTouch,
  colorOf,
  displayName,
  initials,
  onZoneOver,
  onZoneLeave,
  onDropBucket,
  onDragStart,
  onDragEnd,
  onOpenSheet,
  onChip,
  onRemove,
}: {
  bucket: Bucket;
  members: ProductionMember[];
  big?: boolean;
  dropKey: string | null;
  pending: boolean;
  isTouch: boolean;
  colorOf: (userId: string) => string;
  displayName: (p: { firstName: string | null; lastName: string | null; email: string }) => string;
  initials: (p: { firstName: string | null; lastName: string | null; email: string }) => string;
  onZoneOver: (e: React.DragEvent, key: string) => void;
  onZoneLeave: (e: React.DragEvent, key: string) => void;
  onDropBucket: (e: React.DragEvent, bucket: Bucket) => void;
  onDragStart: (e: React.DragEvent, userId: string) => void;
  onDragEnd: () => void;
  onOpenSheet: (bucket: Bucket) => void;
  onChip: (userId: string) => void;
  onRemove: (membershipId: string, name: string) => void;
}) {
  const key = `bucket:${bucket.id}`;
  return (
    <div className={`ax-bucket-row${big ? " ax-ensemble-row" : ""}`}>
      <div className="ax-bucket-label">
        {bucket.label}
        <span>
          {bucket.sub} · {members.length || (big ? "many" : "multiple")}
        </span>
      </div>
      <div
        className={`ax-bucket${big ? " ax-bucket-big" : ""}${dropKey === key ? " drop" : ""}`}
        data-filled={members.length ? "1" : "0"}
        onDragOver={(e) => onZoneOver(e, key)}
        onDragLeave={(e) => onZoneLeave(e, key)}
        onDrop={(e) => onDropBucket(e, bucket)}
        onClick={(e: MouseEvent) => {
          if (isTouch && !(e.target as HTMLElement).closest(".ax-pchip")) {
            onOpenSheet(bucket);
          }
        }}
      >
        {members.length ? (
          members.map((m) => (
            <span
              key={m.id}
              className="ax-pchip"
              draggable={!isTouch}
              onDragStart={(e) => onDragStart(e, m.userId)}
              onDragEnd={onDragEnd}
              onClick={() => onChip(m.userId)}
            >
              <span className="pp-av ax-av-xs" data-c={colorOf(m.userId)}>
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
                  onRemove(m.id, displayName(m));
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
}

function AssignSheet({
  sheet,
  characters,
  members,
  teamBuckets,
  people,
  assignedIds,
  canInvite,
  pending,
  colorOf,
  assignmentLabel,
  onClose,
  onSlot,
  onBucket,
  onInvite,
}: {
  sheet: Sheet;
  characters: ProductionRoleRow[];
  members: ProductionMember[];
  teamBuckets: Bucket[];
  people: DirectoryPerson[];
  assignedIds: Set<string>;
  canInvite: boolean;
  pending: boolean;
  colorOf: (userId: string) => string;
  assignmentLabel: (userId: string) => string | null;
  onClose: () => void;
  onSlot: (userId: string, roleId: string) => void;
  onBucket: (userId: string, bucket: Bucket) => void;
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
              <button
                type="button"
                className="cc-sheet-opt"
                disabled={pending}
                onClick={() => onBucket(sheet.userId, ENSEMBLE_BUCKET)}
              >
                <div className="who">
                  <b>{ENSEMBLE_BUCKET.label}</b>
                  <span>{ENSEMBLE_BUCKET.sub}</span>
                </div>
                {members.some(
                  (m) =>
                    m.userId === sheet.userId &&
                    m.role === ENSEMBLE_BUCKET.role &&
                    m.characterName === ENSEMBLE_BUCKET.position,
                ) && <span className="meta">current</span>}
              </button>

              <div className="cc-sheet-sec">Production team</div>
              {teamBuckets.map((bucket) => {
                const inBucket = members.some(
                  (m) =>
                    m.userId === sheet.userId &&
                    m.role === bucket.role &&
                    (bucket.position
                      ? m.characterName === bucket.position
                      : !m.characterName),
                );
                return (
                  <button
                    key={bucket.id}
                    type="button"
                    className="cc-sheet-opt"
                    disabled={pending}
                    onClick={() => onBucket(sheet.userId, bucket)}
                  >
                    <div className="who">
                      <b>{bucket.label}</b>
                      <span>{bucket.sub}</span>
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
                      : onBucket(p.userId, sheet.bucket)
                  }
                >
                  <span className="pp-av ax-av-sm" data-c={colorOf(p.userId)}>
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
