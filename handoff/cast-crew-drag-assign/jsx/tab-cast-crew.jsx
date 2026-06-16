// Cast & Crew — drag-to-assign casting board with a persistent person drawer.
//
// Conventions match the other design-reference tabs:
//   • window.I icons (destructured as CcI)
//   • classNames from demo-styles.css, plus the `.ax-*` / `.cc-*` block in
//     styles/cast-crew.css (merge into demo-styles.css → app/globals.css)
//   • inline styles using CSS vars (--accent, --ink, --bg-elev, --c-*)
//   • self-contained mock data (like tab-home.jsx) — swap for real
//     production members + characters during port
//   • exported via window.TabCastCrew
//
// Interaction model (see README):
//   • Desktop: DRAG a person from the Company roster onto a character slot
//     (single occupant) or a team bucket (one or many).
//   • Touch/≤859px: TAP — the + on a person opens a role sheet; an empty
//     slot/bucket opens a people sheet. Board ⇄ Company tab toggle.
//   • Click any person (roster card, filled slot, team chip) → person drawer.

const { I: CcI } = window;

const CC_KIND = { cast: "Cast", creative: "Creative", crew: "Crew" };

const CC_PEOPLE = [
  { id: "p1",  first: "Felix",   last: "Hart",   c: "amber", kind: "cast",     email: "felix.hart@gmail.com",         phone: "(555) 201-7788", perm: "Viewer" },
  { id: "p2",  first: "Mara",    last: "Olsen",  c: "sage",  kind: "cast",     email: "mara.olsen@gmail.com",         phone: "(555) 281-4470", perm: "Viewer", pro: "she/her" },
  { id: "p3",  first: "Rufus",   last: "Bell",   c: "dusk",  kind: "cast",     email: "rufus.bell@gmail.com",         phone: "(555) 332-9001", perm: "Viewer" },
  { id: "p4",  first: "Priya",   last: "Desai",  c: "plum",  kind: "cast",     email: "priya.desai@gmail.com",        phone: "(555) 884-1220", perm: "Viewer" },
  { id: "p5",  first: "Sofia",   last: "Kraus",  c: "clay",  kind: "cast",     email: "sofia.kraus@gmail.com",        phone: "(555) 447-2210", perm: "Viewer" },
  { id: "p6",  first: "Aria",    last: "Dunn",   c: "sand",  kind: "cast",     email: "aria.dunn@gmail.com",          phone: "(555) 663-1180", perm: "Viewer" },
  { id: "p7",  first: "Jonah",   last: "West",   c: "sage",  kind: "cast",     email: "jonah.west@gmail.com",         phone: "(555) 119-5521", perm: "Viewer" },
  { id: "p8",  first: "Cora",    last: "Méndez", c: "dusk",  kind: "cast",     email: "cora.mendez@gmail.com",        phone: "(555) 770-3345", perm: "Viewer" },
  { id: "p9",  first: "Eleanor", last: "Voss",   c: "plum",  kind: "creative", email: "eleanor.voss@harborlight.org", phone: "(555) 900-2200", perm: "Admin" },
  { id: "p10", first: "Nadia",   last: "Vance",  c: "clay",  kind: "creative", email: "nadia.vance@harborlight.org",  phone: "(555) 900-4410", perm: "Admin" },
  { id: "p11", first: "Mike",    last: "Rivera", c: "sage",  kind: "creative", email: "mike.rivera@harborlight.org",  phone: "(555) 900-7782", perm: "Editor" },
  { id: "p12", first: "Tasha",   last: "Cole",   c: "amber", kind: "creative", email: "tasha.cole@harborlight.org",   phone: "(555) 900-6651", perm: "Admin" },
  { id: "p13", first: "Theo",    last: "Nunez",  c: "sand",  kind: "crew",     email: "theo.nunez@gmail.com",         phone: "(555) 552-8890", perm: "Viewer" },
  { id: "p14", first: "Leo",     last: "Brooks", c: "dusk",  kind: "crew",     email: "leo.brooks@gmail.com",         phone: "(555) 552-1123", perm: "Viewer" },
];

const CC_CHARACTERS = [
  { id: "c1",  name: "Frederic",              tag: "Principal" },
  { id: "c2",  name: "Mabel",                 tag: "Principal" },
  { id: "c3",  name: "The Pirate King",       tag: "Principal" },
  { id: "c4",  name: "Major-General Stanley", tag: "Principal" },
  { id: "c5",  name: "Ruth",                  tag: "Principal" },
  { id: "c6",  name: "Sergeant of Police",    tag: "Supporting" },
  { id: "c7",  name: "Edith",                 tag: "Supporting" },
  { id: "c8",  name: "Kate",                  tag: "Supporting" },
  { id: "c9",  name: "Isabel",                tag: "Supporting" },
  { id: "c10", name: "Samuel",                tag: "Supporting" },
];

const CC_TEAM = [
  { id: "t1", role: "Director",      sub: "Leads the show",  multi: false },
  { id: "t2", role: "Stage Manager", sub: "Runs rehearsals", multi: false },
  { id: "t3", role: "Music Director", sub: "Leads the score", multi: false },
  { id: "t4", role: "Choreographer", sub: "Movement",        multi: false },
  { id: "t5", role: "Wardrobe",      sub: "Costumes",         multi: true },
  { id: "t6", role: "Deck Crew",     sub: "Backstage",        multi: true },
];

function ccInitials(p) { return (p.first[0] + p.last[0]).toUpperCase(); }
function ccName(p) { return p.first + " " + p.last; }

function TabCastCrew() {
  const byId = React.useMemo(() => {
    const m = {}; CC_PEOPLE.forEach((p) => { m[p.id] = p; }); return m;
  }, []);

  // seeded so the board isn't empty
  const [slotOf, setSlotOf] = React.useState({ c1: "p1", c2: "p2" });
  const [bucketOf, setBucketOf] = React.useState({ t1: ["p9"], t2: ["p11"], t3: [], t4: [], t5: [], t6: [] });
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [drawer, setDrawer] = React.useState(null);   // personId | null
  const [sheet, setSheet] = React.useState(null);      // { mode, pid?|ch?|t?, title } | null
  const [mtab, setMtab] = React.useState("board");     // "board" | "company"
  const [toast, setToast] = React.useState("");
  const [dropKey, setDropKey] = React.useState(null);  // "slot:cX" | "bucket:tX"
  const dragId = React.useRef(null);
  const toastTimer = React.useRef(null);
  const isTouch = React.useSyncExternalStore(
    (cb) => { const m = window.matchMedia("(max-width: 859px)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia("(max-width: 859px)").matches,
    () => false
  );

  function flashToast(msg) { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), 1800); }

  function isAssigned(id) {
    if (Object.values(slotOf).indexOf(id) !== -1) return true;
    return Object.keys(bucketOf).some((k) => bucketOf[k].indexOf(id) !== -1);
  }
  function assignmentLabel(id) {
    for (const c in slotOf) if (slotOf[c] === id) return "Cast · " + CC_CHARACTERS.find((x) => x.id === c).name;
    for (const t in bucketOf) if (bucketOf[t].indexOf(id) !== -1) return CC_TEAM.find((x) => x.id === t).role;
    return null;
  }

  function assignToSlot(pid, ch) {
    setSlotOf((prev) => {
      const next = {}; for (const k in prev) if (prev[k] !== pid) next[k] = prev[k];
      next[ch] = pid; return next;
    });
    flashToast(ccName(byId[pid]) + " cast as " + CC_CHARACTERS.find((x) => x.id === ch).name);
  }
  function assignToBucket(pid, t) {
    const tm = CC_TEAM.find((x) => x.id === t);
    setBucketOf((prev) => {
      const next = { ...prev };
      if (next[t].indexOf(pid) === -1) next[t] = tm.multi ? next[t].concat(pid) : [pid];
      return next;
    });
    flashToast(ccName(byId[pid]) + " added as " + tm.role);
  }
  function clearSlot(ch) { setSlotOf((prev) => { const n = { ...prev }; delete n[ch]; return n; }); }
  function clearBucket(t, pid) { setBucketOf((prev) => ({ ...prev, [t]: prev[t].filter((x) => x !== pid) })); }

  // ── drag & drop (desktop) ──
  function onDragStart(e, pid) { dragId.current = pid; e.dataTransfer.effectAllowed = "copyMove"; try { e.dataTransfer.setData("text/plain", pid); } catch (x) {} }
  function onDragEnd() { dragId.current = null; setDropKey(null); }
  function onZoneOver(e, key) { e.preventDefault(); if (dropKey !== key) setDropKey(key); }
  function onZoneLeave(e, key) { if (!e.currentTarget.contains(e.relatedTarget)) setDropKey((k) => (k === key ? null : k)); }
  function onDropSlot(e, ch) { e.preventDefault(); if (dragId.current) assignToSlot(dragId.current, ch); setDropKey(null); }
  function onDropBucket(e, t) { e.preventDefault(); if (dragId.current) assignToBucket(dragId.current, t); setDropKey(null); }

  // ── filtered roster ──
  const roster = CC_PEOPLE.filter((p) => {
    const q = search.trim().toLowerCase();
    if (filter === "unassigned" && isAssigned(p.id)) return false;
    if ((filter === "cast" || filter === "creative" || filter === "crew") && p.kind !== filter) return false;
    if (q && ccName(p).toLowerCase().indexOf(q) === -1 && p.email.toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
  const castCount = Object.keys(slotOf).length;
  const teamCount = Object.keys(bucketOf).reduce((n, k) => n + bucketOf[k].length, 0);

  // ── sheet openers (touch) ──
  function openAssignSheet(pid) { setSheet({ mode: "assignPerson", pid, title: "Assign " + ccName(byId[pid]) }); }
  function openSlotSheet(ch) { setSheet({ mode: "pickSlot", ch, title: "Cast " + CC_CHARACTERS.find((x) => x.id === ch).name }); }
  function openBucketSheet(t) { setSheet({ mode: "pickBucket", t, title: "Add to " + CC_TEAM.find((x) => x.id === t).role }); }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Mobile board/company toggle */}
      <div className="ax-mobile-tabs">
        {[["board", "Casting board"], ["company", "Company"]].map(([k, l]) => (
          <button key={k} className="ax-mobile-tab" data-on={mtab === k ? "1" : "0"} onClick={() => setMtab(k)}>{l}</button>
        ))}
      </div>

      <div className="ax-wrap" data-mtab={mtab}>
        {/* ── Company roster ── */}
        <aside className="ax-pool">
          <div className="ax-pool-h">
            <div className="t"><h3>Company</h3><span className="n">{roster.length} people</span></div>
            <div className="sub">Drag anyone onto a role to assign them.</div>
            <div className="ax-search">
              <CcI.Search size={15} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the company…" />
            </div>
            <div className="ax-chips">
              {[["all", "All"], ["unassigned", "Unassigned"], ["cast", "Cast"], ["creative", "Creative"], ["crew", "Crew"]].map(([k, l]) => (
                <button key={k} className="ax-chip" data-on={filter === k ? "1" : "0"} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="ax-list">
            {roster.map((p) => {
              const assigned = isAssigned(p.id);
              return (
                <div key={p.id} className="ax-person" data-assigned={assigned ? "1" : "0"}
                  draggable onDragStart={(e) => onDragStart(e, p.id)} onDragEnd={onDragEnd}
                  onClick={(e) => { if (!e.target.closest(".ax-assign-btn, .grip")) setDrawer(p.id); }}>
                  <div className="avatar" style={{ background: "var(--c-" + p.c + ")", width: 32, height: 32, fontSize: 12 }}>{ccInitials(p)}</div>
                  <div className="who"><b>{ccName(p)}</b><span>{assignmentLabel(p.id) || CC_KIND[p.kind]}</span></div>
                  <span className="ax-assigned-tick"><CcI.Check size={15} /></span>
                  <button className="ax-assign-btn" title="Assign to a role" onClick={() => openAssignSheet(p.id)}><CcI.Plus size={15} /></button>
                  <span className="grip"><CcI.Grip size={14} /></span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Board ── */}
        <section className="ax-board">
          <div className="ax-board-head">
            <div>
              <h2>The Pirates of Penzance</h2>
              <div className="sub">Cast your characters and build the production team.</div>
            </div>
            <div className="ax-progress">
              <div className="ax-stat"><b>{castCount}/10</b><span>Cast</span></div>
              <div className="ax-stat"><b>{Math.min(teamCount, 6)}/6</b><span>Team</span></div>
            </div>
          </div>

          {/* Characters */}
          <div className="ax-card">
            <div className="ax-card-h"><h3>Cast — characters</h3><span className="n">{castCount} of 10 cast</span></div>
            <div className="ax-roles">
              {CC_CHARACTERS.map((ch) => {
                const pid = slotOf[ch.id]; const p = pid ? byId[pid] : null; const key = "slot:" + ch.id;
                return (
                  <div key={ch.id} className="ax-role">
                    <div className="cname">{ch.name} <span className="tag">· {ch.tag}</span></div>
                    <div className={"ax-slot" + (dropKey === key ? " drop" : "")} data-filled={p ? "1" : "0"}
                      onDragOver={(e) => onZoneOver(e, key)} onDragLeave={(e) => onZoneLeave(e, key)} onDrop={(e) => onDropSlot(e, ch.id)}
                      onClick={() => { if (!p && isTouch) openSlotSheet(ch.id); }}>
                      {p ? (
                        <React.Fragment>
                          <div className="filled" onClick={() => setDrawer(pid)}>
                            <div className="avatar" style={{ background: "var(--c-" + p.c + ")", width: 30, height: 30, fontSize: 11 }}>{ccInitials(p)}</div>
                            <div className="who"><b>{ccName(p)}</b><span>{CC_KIND[p.kind]}</span></div>
                          </div>
                          <button className="ax-x" title="Unassign" onClick={() => clearSlot(ch.id)}><CcI.X size={13} /></button>
                        </React.Fragment>
                      ) : (
                        <span className="empty"><CcI.Plus size={14} /><span className="d-hint">Drag a performer here</span><span className="m-hint">Tap to cast</span></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team */}
          <div className="ax-card">
            <div className="ax-card-h"><h3>Production team</h3><span className="n">{teamCount === 0 ? "0 filled" : teamCount + " assigned"}</span></div>
            <div className="ax-team">
              {CC_TEAM.map((t) => {
                const ids = bucketOf[t.id]; const key = "bucket:" + t.id;
                return (
                  <div key={t.id} className="ax-bucket-row">
                    <div className="ax-bucket-label">{t.role}<span>{t.sub}{t.multi ? " · multiple" : ""}</span></div>
                    <div className={"ax-bucket" + (dropKey === key ? " drop" : "")} data-filled={ids.length ? "1" : "0"}
                      onDragOver={(e) => onZoneOver(e, key)} onDragLeave={(e) => onZoneLeave(e, key)} onDrop={(e) => onDropBucket(e, t.id)}
                      onClick={(e) => { if (isTouch && !e.target.closest(".ax-pchip")) openBucketSheet(t.id); }}>
                      {ids.length ? ids.map((pid) => {
                        const p = byId[pid];
                        return (
                          <span key={pid} className="ax-pchip" onClick={() => setDrawer(pid)}>
                            <span className="avatar" style={{ background: "var(--c-" + p.c + ")", width: 22, height: 22, fontSize: 10 }}>{ccInitials(p)}</span>
                            {ccName(p)}
                            <button className="ax-pchip-x" title="Remove" onClick={(e) => { e.stopPropagation(); clearBucket(t.id, pid); }}><CcI.X size={12} /></button>
                          </span>
                        );
                      }) : <span className="hint"><span className="d-hint">Drag people here</span><span className="m-hint">Tap to add</span></span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ── Person drawer (reuses pp-drawer classes) ── */}
      {drawer && (() => {
        const p = byId[drawer]; const lbl = assignmentLabel(drawer);
        return (
          <div className="cc-scrim drawer" onClick={(e) => { if (e.target.classList.contains("cc-scrim")) setDrawer(null); }}>
            <div className="pp-drawer" style={{ height: "100vh", overflowY: "auto", maxWidth: 440 }}>
              <div className="pp-drawer-h">
                <button className="pp-icon-btn" aria-label="Close" onClick={() => setDrawer(null)}><CcI.X size={14} /></button>
                <div style={{ flex: 1 }} />
                <button className="btn sm"><CcI.Mail size={12} /><span>Message</span></button>
                <button className="btn sm"><CcI.Pencil size={12} /><span>Edit</span></button>
              </div>
              <div className="pp-drawer-hero">
                <div className="pp-av xl" data-c={p.c}>{ccInitials(p)}</div>
                <div>
                  <h2>{ccName(p)} {p.pro && <span className="pp-drawer-pronouns">{p.pro}</span>}</h2>
                  <div className="pp-drawer-role"><span className="pp-pill" data-c={p.c}>{CC_KIND[p.kind]}</span></div>
                  <div className="pp-drawer-contact"><a href="#">{p.email}</a><span className="pp-pip" /><span>{p.phone}</span></div>
                </div>
              </div>
              <div className="pp-drawer-meta">
                <div><span>Status</span><b className="pp-status" data-status="active"><span className="dot" />Active</b></div>
                <div><span>Permission</span><b>{p.perm}</b></div>
                <div><span>Member since</span><b>Mar 2025</b></div>
                <div><span>Last active</span><b>5h ago</b></div>
              </div>
              <div className="pp-drawer-section">
                <div className="pp-drawer-section-h"><h3>This production</h3></div>
                <div className="pp-drawer-assigns">
                  {lbl ? (
                    <div className="pp-drawer-assign"><span className="pp-assign-dot lg" data-c="clay" /><div style={{ flex: 1 }}><b>The Pirates of Penzance</b><span>{lbl}</span></div></div>
                  ) : <div className="pp-empty-sm">Not yet assigned on The Pirates of Penzance.</div>}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Touch tap-to-assign bottom sheet ── */}
      {sheet && (
        <div className="cc-scrim sheet" onClick={(e) => { if (e.target.classList.contains("cc-scrim")) setSheet(null); }}>
          <div className="ax-sheet">
            <div className="ax-sheet-h"><h3>{sheet.title}</h3><button className="pp-icon-btn" aria-label="Close" onClick={() => setSheet(null)}><CcI.X size={16} /></button></div>
            <div className="ax-sheet-body">
              {sheet.mode === "assignPerson" ? (
                <React.Fragment>
                  <div className="ax-sheet-sec">Cast as a character</div>
                  {CC_CHARACTERS.filter((c) => !slotOf[c.id] || slotOf[c.id] === sheet.pid).length === 0
                    ? <div className="ax-sheet-empty">All characters are cast.</div>
                    : CC_CHARACTERS.filter((c) => !slotOf[c.id] || slotOf[c.id] === sheet.pid).map((c) => (
                        <button key={c.id} className="ax-sheet-opt" onClick={() => { assignToSlot(sheet.pid, c.id); setSheet(null); }}>
                          <div className="who"><b>{c.name}</b><span>{c.tag}</span></div>{slotOf[c.id] === sheet.pid && <span className="meta">current</span>}
                        </button>
                      ))}
                  <div className="ax-sheet-sec">Production team</div>
                  {CC_TEAM.map((t) => (
                    <button key={t.id} className="ax-sheet-opt" onClick={() => { assignToBucket(sheet.pid, t.id); setSheet(null); }}>
                      <div className="who"><b>{t.role}</b><span>{t.sub}</span></div>{bucketOf[t.id].indexOf(sheet.pid) !== -1 && <span className="meta">current</span>}
                    </button>
                  ))}
                </React.Fragment>
              ) : (
                CC_PEOPLE.slice().sort((a, b) => (isAssigned(a.id) ? 1 : 0) - (isAssigned(b.id) ? 1 : 0)).map((p) => (
                  <button key={p.id} className="ax-sheet-opt" onClick={() => {
                    if (sheet.mode === "pickSlot") assignToSlot(p.id, sheet.ch); else assignToBucket(p.id, sheet.t); setSheet(null);
                  }}>
                    <div className="avatar" style={{ background: "var(--c-" + p.c + ")", width: 30, height: 30, fontSize: 11 }}>{ccInitials(p)}</div>
                    <div className="who"><b>{ccName(p)}</b><span>{CC_KIND[p.kind]}</span></div>
                    <span className="meta">{assignmentLabel(p.id) || "Unassigned"}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="ax-toast" data-show="1">{toast}</div>}
    </div>
  );
}

window.TabCastCrew = TabCastCrew;
