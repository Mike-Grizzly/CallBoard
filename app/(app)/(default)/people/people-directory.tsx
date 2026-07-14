"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import type { DirectoryPerson } from "@/features/members/queries";
import {
  ROLE_META,
  STATUS_META,
  PEOPLE_CATEGORIES,
} from "@/features/members/constants";
import { resendInvite } from "@/features/members/actions";
import { exportPeopleCsv, type ProductionOption } from "./helpers";
import { PeopleTable, PeopleCards } from "./people-views";
import { PersonDrawer } from "./person-drawer";
import { AddPeopleModal } from "./add-people-modal";
import { AssignProductionModal } from "./assign-production-modal";

export function PeopleDirectory({
  people,
  productions,
  currentUserId,
}: {
  people: DirectoryPerson[];
  productions: ProductionOption[];
  currentUserId: string;
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterProd, setFilterProd] = useState("All");
  const [view, setView] = useState<"table" | "grid">("table");

  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [assignUserIds, setAssignUserIds] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3600);
  };

  const refreshWith = (message: string) => {
    showToast(message);
    router.refresh();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((p) => {
      if (q) {
        const hay = `${p.firstName} ${p.lastName} ${p.email} ${
          ROLE_META[p.role].label
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterCat !== "All" && ROLE_META[p.role].category !== filterCat)
        return false;
      if (filterStatus !== "All" && p.status !== filterStatus) return false;
      if (
        filterProd !== "All" &&
        !p.assignments.some((a) => a.productionId === filterProd)
      )
        return false;
      return true;
    });
  }, [people, search, filterCat, filterStatus, filterProd]);

  const counts = useMemo(
    () => ({
      total: people.length,
      active: people.filter((p) => p.status === "active").length,
      invited: people.filter((p) => p.status === "invited").length,
      cast: people.filter((p) => ROLE_META[p.role].category === "Cast").length,
      creative: people.filter(
        (p) => ROLE_META[p.role].category === "Creative",
      ).length,
      stage: people.filter(
        (p) => ROLE_META[p.role].category === "Stage Mgmt",
      ).length,
    }),
    [people],
  );

  const toggleSelect = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const selectAll = () => {
    setSelected((prev) =>
      prev.size === filtered.length
        ? new Set()
        : new Set(filtered.map((p) => p.userId)),
    );
  };

  const drawerPerson = people.find((p) => p.userId === drawerUserId) ?? null;
  const selectedCount = selected.size;

  const resendForSelected = async () => {
    if (busy) return;
    const targets = people.filter(
      (p) => selected.has(p.userId) && p.status === "invited",
    );
    if (targets.length === 0) {
      showToast("No pending invites in your selection.");
      return;
    }
    setBusy(true);
    let sent = 0;
    for (const t of targets) {
      const res = await resendInvite(t.userId);
      if (!res.error) sent += 1;
    }
    setBusy(false);
    refreshWith(
      `Resent ${sent} invite${sent === 1 ? "" : "s"}.`,
    );
  };

  return (
    <div className="people-page">
      <div className="pp-header">
        <div>
          <div className="pp-eyebrow">Workspace</div>
          <h1 className="pp-title">People</h1>
          <div className="pp-sub">
            Your org&apos;s directory. Add people once — assign them to
            productions as you need.
          </div>
        </div>
        <div className="pp-cta">
          <button
            className="btn ghost"
            onClick={() => exportPeopleCsv(people)}
            disabled={people.length === 0}
          >
            <Icon name="Download" size={14} />
            <span>Export</span>
          </button>
          <button className="btn primary" onClick={() => setAddOpen(true)}>
            <Icon name="Plus" size={14} />
            <span>Add people</span>
          </button>
        </div>
      </div>

      <div className="pp-stats">
        <button
          className="pp-stat"
          data-active={
            filterCat === "All" && filterStatus === "All" ? "1" : "0"
          }
          onClick={() => {
            setFilterCat("All");
            setFilterStatus("All");
          }}
        >
          <b>{counts.total}</b>
          <span>Total members</span>
        </button>
        <button
          className="pp-stat"
          data-active={filterStatus === "active" ? "1" : "0"}
          onClick={() =>
            setFilterStatus(filterStatus === "active" ? "All" : "active")
          }
        >
          <b>{counts.active}</b>
          <span>Active</span>
          <div className="pp-stat-dot" style={{ background: "var(--c-sage)" }} />
        </button>
        <button
          className="pp-stat"
          data-active={filterStatus === "invited" ? "1" : "0"}
          onClick={() =>
            setFilterStatus(filterStatus === "invited" ? "All" : "invited")
          }
        >
          <b>{counts.invited}</b>
          <span>Pending invites</span>
          <div
            className="pp-stat-dot"
            style={{ background: "var(--c-amber)" }}
          />
        </button>
        <button
          className="pp-stat"
          data-active={filterCat === "Cast" ? "1" : "0"}
          onClick={() => setFilterCat(filterCat === "Cast" ? "All" : "Cast")}
        >
          <b>{counts.cast}</b>
          <span>Cast</span>
        </button>
        <button
          className="pp-stat"
          data-active={filterCat === "Creative" ? "1" : "0"}
          onClick={() =>
            setFilterCat(filterCat === "Creative" ? "All" : "Creative")
          }
        >
          <b>{counts.creative}</b>
          <span>Creative team</span>
        </button>
        <button
          className="pp-stat"
          data-active={filterCat === "Stage Mgmt" ? "1" : "0"}
          onClick={() =>
            setFilterCat(filterCat === "Stage Mgmt" ? "All" : "Stage Mgmt")
          }
        >
          <b>{counts.stage}</b>
          <span>Stage management</span>
        </button>
      </div>

      <div className="pp-toolbar">
        <div className="pp-search">
          <Icon name="Search" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or role…"
          />
        </div>
        <select
          className="pp-filter"
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          {PEOPLE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All categories" : c}
            </option>
          ))}
        </select>
        <select
          className="pp-filter"
          value={filterProd}
          onChange={(e) => setFilterProd(e.target.value)}
        >
          <option value="All">All productions</option>
          {productions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <select
          className="pp-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All statuses</option>
          <option value="active">{STATUS_META.active.label}</option>
          <option value="invited">{STATUS_META.invited.label}</option>
          <option value="inactive">{STATUS_META.inactive.label}</option>
        </select>
        <div style={{ flex: 1 }} />
        <div className="pp-viewtoggle">
          <button
            data-active={view === "table" ? "1" : "0"}
            onClick={() => setView("table")}
          >
            <Icon name="Layout" size={13} />
            <span>Table</span>
          </button>
          <button
            data-active={view === "grid" ? "1" : "0"}
            onClick={() => setView("grid")}
          >
            <Icon name="Layers" size={13} />
            <span>Cards</span>
          </button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="pp-selbar">
          <span>
            <b>{selectedCount}</b> selected
          </span>
          <button
            className="btn sm"
            onClick={() => setAssignUserIds([...selected])}
          >
            <Icon name="Plus" size={12} />
            <span>Assign to production</span>
          </button>
          <button
            className="btn sm"
            onClick={resendForSelected}
            disabled={busy}
          >
            <Icon name="Mail" size={12} />
            <span>Resend invite</span>
          </button>
          <button
            className="btn sm"
            onClick={() =>
              exportPeopleCsv(people.filter((p) => selected.has(p.userId)))
            }
          >
            <Icon name="Download" size={12} />
            <span>Export selected</span>
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="btn ghost sm"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="Users"
          iconSize={28}
          title={
            people.length === 0
              ? "No one in your org yet."
              : "No one matches those filters."
          }
          hint={
            people.length === 0
              ? "Add your cast, crew, and creative team to get started."
              : "Try clearing search or filters."
          }
          action={
            <button className="btn primary" onClick={() => setAddOpen(true)}>
              <Icon name="Plus" size={14} />
              <span>Add people</span>
            </button>
          }
        />
      ) : view === "table" ? (
        <PeopleTable
          rows={filtered}
          selected={selected}
          currentUserId={currentUserId}
          onToggle={toggleSelect}
          onSelectAll={selectAll}
          onOpen={setDrawerUserId}
        />
      ) : (
        <PeopleCards rows={filtered} onOpen={setDrawerUserId} />
      )}

      {drawerPerson && (
        <PersonDrawer
          person={drawerPerson}
          isCurrentUser={drawerPerson.userId === currentUserId}
          onClose={() => setDrawerUserId(null)}
          onAssign={(userId) => setAssignUserIds([userId])}
          onChanged={refreshWith}
        />
      )}

      {addOpen && (
        <AddPeopleModal
          productions={productions}
          onClose={() => setAddOpen(false)}
          onDone={(message) => {
            setAddOpen(false);
            refreshWith(message);
          }}
        />
      )}

      {assignUserIds && (
        <AssignProductionModal
          userIds={assignUserIds}
          productions={productions}
          onClose={() => setAssignUserIds(null)}
          onDone={(message) => {
            setAssignUserIds(null);
            setSelected(new Set());
            refreshWith(message);
          }}
        />
      )}

      {toast && (
        <div className="pp-toast">
          <Icon name="Check" size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
