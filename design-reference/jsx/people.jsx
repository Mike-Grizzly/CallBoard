// People — workspace-level directory.
// Org-wide list of users; each can be assigned to N productions with a role each.
//
// Layout:
//   • Header: title, counts, "Add people" CTA
//   • Toolbar: search + role/department/status/production filters + view toggle
//   • Main: data table OR card grid of org members
//   • Drawer: clicking a row opens detail/edit
//   • Add modal: 3 paths — Manual single, CSV upload, Bulk wizard

const { I: PpI } = window;
const { PEOPLE: PP, ORG_ROLES: PP_ROLES, PERMISSIONS: PP_PERMS, PRONOUNS: PP_PRONS, ALL_PRODUCTIONS: PP_PRODS } = window;

// ─── Top-level People page ────────────────────────────────────────────
function PeoplePage() {
  const [people, setPeople] = React.useState(PP);
  const [search, setSearch] = React.useState("");
  const [filterCat, setFilterCat] = React.useState("All");
  const [filterStatus, setFilterStatus] = React.useState("All");
  const [filterProd, setFilterProd] = React.useState("All");
  const [view, setView] = React.useState("table"); // table | grid
  const [drawerId, setDrawerId] = React.useState(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(new Set());
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Filters
  const cats = ["All", ...Array.from(new Set(PP_ROLES.map(r => r.cat)))];
  const filtered = React.useMemo(() => {
    return people.filter(p => {
      if (search && !`${p.name} ${p.email} ${p.role}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat !== "All" && p.cat !== filterCat) return false;
      if (filterStatus !== "All" && p.status !== filterStatus) return false;
      if (filterProd !== "All" && !p.assigns.some(a => a.prod === filterProd)) return false;
      return true;
    });
  }, [people, search, filterCat, filterStatus, filterProd]);

  const counts = {
    total: people.length,
    active: people.filter(p => p.status === "active").length,
    invited: people.filter(p => p.status === "invited").length,
    cast: people.filter(p => p.cat === "Cast").length,
    creative: people.filter(p => ["Creative","Music","Design","Movement"].includes(p.cat)).length,
    stage: people.filter(p => p.cat === "Stage Mgmt").length,
  };

  const toggleSel = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const selAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };

  const handleAdd = (newPeople) => {
    setPeople(prev => [...newPeople, ...prev]);
    showToast(`Added ${newPeople.length} ${newPeople.length === 1 ? "person" : "people"} to your org.`);
  };

  const drawerPerson = people.find(p => p.id === drawerId);

  return (
    <div className="people-page">
      {/* Header */}
      <div className="pp-header">
        <div>
          <div className="pp-eyebrow">Workspace</div>
          <h1 className="pp-title">People</h1>
          <div className="pp-sub">
            Your org's directory. Add people once — assign them to productions as you need.
          </div>
        </div>
        <div className="pp-cta">
          <button className="btn ghost"><PpI.Download size={14}/><span>Export</span></button>
          <button className="btn primary" onClick={() => setAddOpen(true)}>
            <PpI.Plus size={14}/><span>Add people</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="pp-stats">
        <button className="pp-stat" data-active={filterCat === "All" && filterStatus === "All" ? "1" : "0"}
                onClick={() => { setFilterCat("All"); setFilterStatus("All"); }}>
          <b>{counts.total}</b><span>Total members</span>
        </button>
        <button className="pp-stat" data-active={filterStatus === "active" ? "1" : "0"}
                onClick={() => setFilterStatus(filterStatus === "active" ? "All" : "active")}>
          <b>{counts.active}</b><span>Active</span>
          <div className="pp-stat-dot" style={{background:"var(--c-sage)"}}/>
        </button>
        <button className="pp-stat" data-active={filterStatus === "invited" ? "1" : "0"}
                onClick={() => setFilterStatus(filterStatus === "invited" ? "All" : "invited")}>
          <b>{counts.invited}</b><span>Pending invites</span>
          <div className="pp-stat-dot" style={{background:"var(--c-amber)"}}/>
        </button>
        <button className="pp-stat" data-active={filterCat === "Cast" ? "1" : "0"}
                onClick={() => setFilterCat(filterCat === "Cast" ? "All" : "Cast")}>
          <b>{counts.cast}</b><span>Cast</span>
        </button>
        <button className="pp-stat" onClick={() => setFilterCat("Creative")}>
          <b>{counts.creative}</b><span>Creative team</span>
        </button>
        <button className="pp-stat" onClick={() => setFilterCat("Stage Mgmt")}>
          <b>{counts.stage}</b><span>Stage management</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="pp-toolbar">
        <div className="pp-search">
          <PpI.Search size={14}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, or role…"/>
        </div>
        <select className="pp-filter" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="pp-filter" value={filterProd} onChange={e => setFilterProd(e.target.value)}>
          <option>All</option>
          {PP_PRODS.map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="pp-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All statuses</option>
          <option value="active">Active</option>
          <option value="invited">Pending invite</option>
          <option value="inactive">Inactive</option>
        </select>
        <div style={{flex:1}}/>
        <div className="pp-viewtoggle">
          <button data-active={view === "table" ? "1" : "0"} onClick={() => setView("table")}>
            <PpI.Layout size={13}/><span>Table</span>
          </button>
          <button data-active={view === "grid" ? "1" : "0"} onClick={() => setView("grid")}>
            <PpI.Layers size={13}/><span>Cards</span>
          </button>
        </div>
      </div>

      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="pp-selbar">
          <span><b>{selected.size}</b> selected</span>
          <button className="btn sm" onClick={() => setAssignOpen(true)}>
            <PpI.Plus size={12}/><span>Assign to production</span>
          </button>
          <button className="btn sm"><PpI.Mail size={12}/><span>Resend invite</span></button>
          <button className="btn sm"><PpI.Download size={12}/><span>Export selected</span></button>
          <div style={{flex:1}}/>
          <button className="btn ghost sm" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* Body */}
      {filtered.length === 0
        ? <div className="pp-empty">
            <div className="pp-empty-ico"><PpI.Users size={28}/></div>
            <b>No one matches those filters.</b>
            <span>Try clearing search or filters — or add new people to your org.</span>
            <button className="btn primary" onClick={() => setAddOpen(true)} style={{marginTop:14}}>
              <PpI.Plus size={14}/><span>Add people</span>
            </button>
          </div>
        : view === "table"
          ? <PeopleTable rows={filtered} selected={selected} onToggle={toggleSel} onSelAll={selAll}
                         onOpen={setDrawerId}/>
          : <PeopleGrid rows={filtered} onOpen={setDrawerId}/>}

      {/* Drawer */}
      {drawerPerson && (
        <PersonDrawer person={drawerPerson} onClose={() => setDrawerId(null)}/>
      )}

      {/* Add modal */}
      {addOpen && (
        <AddPeopleModal onClose={() => setAddOpen(false)} onAdd={(np) => { handleAdd(np); setAddOpen(false); }}/>
      )}

      {/* Assign modal */}
      {assignOpen && (
        <AssignToProductionModal count={selected.size}
          onClose={() => setAssignOpen(false)}
          onConfirm={(prod, role) => {
            setAssignOpen(false);
            showToast(`Assigned ${selected.size} ${selected.size === 1 ? "person" : "people"} to ${prod} as ${role}.`);
            setSelected(new Set());
          }}/>
      )}

      {toast && <div className="pp-toast"><PpI.Check size={14}/><span>{toast}</span></div>}

      <PeoplePageStyles/>
    </div>
  );
}

// ─── Table view ───────────────────────────────────────────────────────
function PeopleTable({ rows, selected, onToggle, onSelAll, onOpen }) {
  const allOn = selected.size > 0 && selected.size === rows.length;
  const someOn = selected.size > 0 && selected.size < rows.length;
  return (
    <div className="pp-table-wrap">
      <table className="pp-table">
        <thead>
          <tr>
            <th style={{width:32}}>
              <input type="checkbox" checked={allOn} ref={el => { if (el) el.indeterminate = someOn; }}
                     onChange={onSelAll}/>
            </th>
            <th>Member</th>
            <th>Role</th>
            <th>Productions</th>
            <th>Permission</th>
            <th>Last active</th>
            <th style={{width:32}}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.id} data-selected={selected.has(p.id) ? "1" : "0"}
                onClick={() => onOpen(p.id)}>
              <td onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => onToggle(p.id)}/>
              </td>
              <td>
                <div className="pp-cell-member">
                  <div className="pp-av" data-c={p.c || ""}>{p.initials}</div>
                  <div>
                    <div className="pp-name">
                      {p.name}
                      {p.you && <span className="pp-you">You</span>}
                      {p.status === "invited" && <span className="pp-tag pp-tag-amber">Invite pending</span>}
                      {p.status === "inactive" && <span className="pp-tag pp-tag-mute">Inactive</span>}
                    </div>
                    <div className="pp-email">{p.email}</div>
                  </div>
                </div>
              </td>
              <td><span className="pp-pill" data-c={p.c || ""}>{p.role}</span></td>
              <td>
                {p.assigns.length === 0
                  ? <span className="pp-muted">Unassigned</span>
                  : <div className="pp-assigns">
                      {p.assigns.slice(0, 2).map((a, i) => (
                        <span key={i} className="pp-assign">
                          <span className="pp-assign-dot" data-c={a.c || ""}/>
                          <span className="pp-assign-prod">{a.prod}</span>
                          <span className="pp-assign-role">· {a.role}</span>
                        </span>
                      ))}
                      {p.assigns.length > 2 && <span className="pp-more">+{p.assigns.length - 2}</span>}
                    </div>}
              </td>
              <td>
                <span className="pp-perm" data-perm={p.permission}>
                  {PP_PERMS.find(x => x.key === p.permission)?.label || p.permission}
                </span>
              </td>
              <td><span className="pp-muted">{p.lastActive}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <button className="pp-icon-btn"><PpI.MoreV size={14}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Grid view ────────────────────────────────────────────────────────
function PeopleGrid({ rows, onOpen }) {
  return (
    <div className="pp-grid">
      {rows.map(p => (
        <button key={p.id} className="pp-card" onClick={() => onOpen(p.id)}>
          <div className="pp-av lg" data-c={p.c || ""}>{p.initials}</div>
          <div className="pp-card-name">
            {p.name}
            {p.you && <span className="pp-you">You</span>}
          </div>
          <div className="pp-card-role"><span className="pp-pill" data-c={p.c || ""}>{p.role}</span></div>
          <div className="pp-card-prods">
            {p.assigns.length === 0
              ? <span className="pp-muted">No assignments</span>
              : `${p.assigns.length} production${p.assigns.length === 1 ? "" : "s"}`}
          </div>
          {p.status === "invited" && <div className="pp-card-status amber">Invite pending</div>}
        </button>
      ))}
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────
function PersonDrawer({ person, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="pp-drawer-wrap" onClick={onClose}>
      <div className="pp-drawer" onClick={e => e.stopPropagation()}>
        <div className="pp-drawer-h">
          <button className="pp-icon-btn" onClick={onClose} title="Close"><PpI.X size={14}/></button>
          <div style={{flex:1}}/>
          <button className="btn sm"><PpI.Mail size={12}/><span>Message</span></button>
          <button className="btn sm"><PpI.Pencil size={12}/><span>Edit</span></button>
        </div>
        <div className="pp-drawer-hero">
          <div className="pp-av xl" data-c={person.c || ""}>{person.initials}</div>
          <div>
            <h2>{person.name} <span style={{fontWeight:400,color:"var(--ink-4)",fontSize:13,marginLeft:6}}>{person.pronouns}</span></h2>
            <div className="pp-drawer-role"><span className="pp-pill" data-c={person.c || ""}>{person.role}</span></div>
            <div className="pp-drawer-contact">
              <a href={`mailto:${person.email}`}>{person.email}</a>
              <span className="pp-pip"/>
              <span>{person.phone}</span>
            </div>
          </div>
        </div>

        <div className="pp-drawer-meta">
          <div><span>Status</span><b className="pp-status" data-status={person.status}>
            <span className="dot"/>{person.status === "active" ? "Active" : person.status === "invited" ? "Invite pending" : "Inactive"}</b></div>
          <div><span>Permission</span><b>{PP_PERMS.find(x => x.key === person.permission)?.label}</b></div>
          <div><span>Member since</span><b>{person.joined}</b></div>
          <div><span>Last active</span><b>{person.lastActive}</b></div>
        </div>

        <div className="pp-drawer-section">
          <div className="pp-drawer-section-h">
            <h3>Production assignments</h3>
            <button className="btn sm"><PpI.Plus size={11}/><span>Assign</span></button>
          </div>
          {person.assigns.length === 0
            ? <div className="pp-empty-sm">Not currently assigned to any production.</div>
            : <div className="pp-drawer-assigns">
                {person.assigns.map((a, i) => (
                  <div key={i} className="pp-drawer-assign">
                    <span className="pp-assign-dot lg" data-c={a.c || ""}/>
                    <div style={{flex:1}}>
                      <b>{a.prod}</b>
                      <span>{a.role}</span>
                    </div>
                    <button className="pp-icon-btn"><PpI.MoreV size={13}/></button>
                  </div>
                ))}
              </div>}
        </div>

        <div className="pp-drawer-section">
          <h3 style={{marginBottom:10}}>Activity</h3>
          <div className="pp-activity">
            <div className="pp-act-item"><span className="t">5 min ago</span><span>Signed off on Rehearsal Report R-11</span></div>
            <div className="pp-act-item"><span className="t">yesterday</span><span>Added note to Wed call sheet</span></div>
            <div className="pp-act-item"><span className="t">2 days ago</span><span>Uploaded Pirates_VocalScore_v3.pdf</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add People modal — 3 paths ───────────────────────────────────────
function AddPeopleModal({ onClose, onAdd }) {
  const [path, setPath] = React.useState(null); // null | "manual" | "csv" | "bulk"
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="pp-modal-bg" onClick={onClose}>
      <div className="pp-modal" onClick={e => e.stopPropagation()}>
        <div className="pp-modal-h">
          {path && <button className="pp-icon-btn" onClick={() => setPath(null)}><PpI.ChevLeft size={14}/></button>}
          <h2>{path === "manual" ? "Add a single person" : path === "csv" ? "Upload a CSV" : path === "bulk" ? "Bulk add wizard" : "Add people to your org"}</h2>
          <div style={{flex:1}}/>
          <button className="pp-icon-btn" onClick={onClose}><PpI.X size={14}/></button>
        </div>

        {!path && <AddPathPicker onPick={setPath}/>}
        {path === "manual" && <AddManual onAdd={onAdd} onCancel={() => setPath(null)}/>}
        {path === "csv"    && <AddCSV onAdd={onAdd} onCancel={() => setPath(null)}/>}
        {path === "bulk"   && <AddBulk onAdd={onAdd} onCancel={() => setPath(null)}/>}
      </div>
    </div>
  );
}

function AddPathPicker({ onPick }) {
  const opts = [
    { key:"manual", title:"Add a single person", sub:"Type their info into a quick form. Fastest for adding one or two.",   ico:"User",     time:"~30 sec" },
    { key:"csv",    title:"Upload a CSV",         sub:"Drop a spreadsheet. We'll map the columns and preview before adding.", ico:"Upload",   time:"~2 min for 50+ people" },
    { key:"bulk",   title:"Bulk add wizard",      sub:"Paste a list or add many at once with a guided step-by-step flow.",   ico:"Layers",   time:"~5 min for a season" },
  ];
  return (
    <div className="pp-paths">
      {opts.map(o => {
        const Ico = PpI[o.ico] || PpI.User;
        return (
          <button key={o.key} className="pp-path" onClick={() => onPick(o.key)}>
            <div className="pp-path-ico"><Ico size={18}/></div>
            <div className="pp-path-body">
              <b>{o.title}</b>
              <span>{o.sub}</span>
              <span className="pp-path-time">{o.time}</span>
            </div>
            <PpI.ChevRight size={14}/>
          </button>
        );
      })}
    </div>
  );
}

// ─── Manual single-person form ────────────────────────────────────────
function AddManual({ onAdd, onCancel }) {
  const [form, setForm] = React.useState({
    name:"", email:"", phone:"", pronouns:"—",
    roleKey:"cast-ensemble", permission:"editor",
    assigns:[], sendInvite:true,
  });
  const role = PP_ROLES.find(r => r.key === form.roleKey) || PP_ROLES[0];
  const valid = form.name.trim() && /@/.test(form.email);

  const set = (k, v) => setForm(prev => ({...prev, [k]: v}));
  const submit = () => {
    if (!valid) return;
    const initials = form.name.split(" ").map(p => p[0]).filter(Boolean).slice(0,2).join("").toUpperCase();
    onAdd([{
      id:"new-" + Date.now(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      pronouns: form.pronouns,
      role: role.label, roleKey: role.key, cat: role.cat, c: role.c,
      permission: form.permission,
      status: form.sendInvite ? "invited" : "active",
      joined: new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),
      lastActive: form.sendInvite ? "never" : "just now",
      initials,
      assigns: form.assigns,
    }]);
  };

  const addAssign = () => set("assigns", [...form.assigns, { prod: PP_PRODS[0], role: role.label, c: role.c }]);
  const updAssign = (i, patch) => set("assigns", form.assigns.map((a,j) => i===j ? {...a, ...patch} : a));
  const rmAssign  = (i)        => set("assigns", form.assigns.filter((_,j) => j !== i));

  return (
    <div className="pp-form">
      <div className="pp-form-grid">
        <div className="pp-fg" style={{gridColumn:"1 / -1"}}>
          <label>Full name<span className="pp-req">*</span></label>
          <input className="pp-field" value={form.name} placeholder="e.g. Theo Marsh"
                 onChange={e => set("name", e.target.value)} autoFocus/>
        </div>
        <div className="pp-fg">
          <label>Email<span className="pp-req">*</span></label>
          <input className="pp-field" type="email" value={form.email} placeholder="theo@example.com"
                 onChange={e => set("email", e.target.value)}/>
        </div>
        <div className="pp-fg">
          <label>Phone</label>
          <input className="pp-field" value={form.phone} placeholder="(617) 555-0142"
                 onChange={e => set("phone", e.target.value)}/>
        </div>
        <div className="pp-fg">
          <label>Pronouns</label>
          <select className="pp-field" value={form.pronouns} onChange={e => set("pronouns", e.target.value)}>
            {PP_PRONS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="pp-fg">
          <label>Org role</label>
          <select className="pp-field" value={form.roleKey} onChange={e => set("roleKey", e.target.value)}>
            {PP_ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
        <div className="pp-fg" style={{gridColumn:"1 / -1"}}>
          <label>Permission level</label>
          <div className="pp-perm-grid">
            {PP_PERMS.map(p => (
              <button key={p.key} type="button" className="pp-perm-card" data-on={form.permission === p.key ? "1" : "0"}
                      onClick={() => set("permission", p.key)}>
                <b>{p.label}</b>
                <span>{p.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pp-form-section">
        <div className="pp-form-section-h">
          <h4>Assign to productions <span className="pp-muted">(optional — can add later)</span></h4>
          <button type="button" className="btn sm" onClick={addAssign}><PpI.Plus size={11}/><span>Add</span></button>
        </div>
        {form.assigns.length === 0
          ? <div className="pp-empty-sm">No productions assigned yet.</div>
          : <div className="pp-assign-list">
              {form.assigns.map((a, i) => (
                <div key={i} className="pp-assign-row">
                  <select className="pp-field" value={a.prod} onChange={e => updAssign(i, {prod: e.target.value})}>
                    {PP_PRODS.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <input className="pp-field" value={a.role} placeholder="Role / character"
                         onChange={e => updAssign(i, {role: e.target.value})}/>
                  <button type="button" className="pp-icon-btn delete" onClick={() => rmAssign(i)}>
                    <PpI.Trash size={12}/>
                  </button>
                </div>
              ))}
            </div>}
      </div>

      <label className="pp-check">
        <input type="checkbox" checked={form.sendInvite} onChange={e => set("sendInvite", e.target.checked)}/>
        <span>Send an invite email so they can create an account</span>
      </label>

      <div className="pp-form-actions">
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
        <div style={{flex:1}}/>
        <button className="btn primary" disabled={!valid} style={{opacity: valid ? 1 : .4}} onClick={submit}>
          <PpI.Check size={14}/><span>Add person{form.sendInvite ? " & send invite" : ""}</span>
        </button>
      </div>
    </div>
  );
}

// ─── CSV upload flow ──────────────────────────────────────────────────
function AddCSV({ onAdd, onCancel }) {
  const [stage, setStage] = React.useState("drop"); // drop | map | preview
  const [rows, setRows] = React.useState([]);
  const [headers, setHeaders] = React.useState([]);
  const [mapping, setMapping] = React.useState({}); // field -> column index
  const [sendInvite, setSendInvite] = React.useState(true);
  const dropRef = React.useRef(null);

  const parseCSV = (text) => {
    // Tiny CSV parser — handles quoted fields, comma/tab/semicolon delimiters
    const detect = (s) => {
      const counts = { ",":(s.match(/,/g)||[]).length, "\t":(s.match(/\t/g)||[]).length, ";":(s.match(/;/g)||[]).length };
      return Object.entries(counts).sort((a,b) => b[1]-a[1])[0][0];
    };
    const lines = text.split(/\r?\n/).filter(l => l.trim().length);
    if (!lines.length) return { headers:[], rows:[] };
    const delim = detect(lines[0]);
    const splitLine = (line) => {
      const out = []; let cur = ""; let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"' && line[i+1] === '"' && inQ) { cur += '"'; i++; continue; }
        if (c === '"') { inQ = !inQ; continue; }
        if (c === delim && !inQ) { out.push(cur); cur = ""; continue; }
        cur += c;
      }
      out.push(cur);
      return out.map(s => s.trim());
    };
    const hdrs = splitLine(lines[0]);
    const rs = lines.slice(1).map(splitLine);
    return { headers: hdrs, rows: rs };
  };

  const guessMapping = (hdrs) => {
    const m = {};
    const find = (...patterns) => hdrs.findIndex(h => patterns.some(p => h.toLowerCase().includes(p)));
    m.name  = find("name");
    m.email = find("email", "e-mail");
    m.phone = find("phone", "mobile", "cell");
    m.role  = find("role", "position", "title");
    m.pronouns = find("pronoun");
    m.prod  = find("production", "show");
    return m;
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const { headers: h, rows: r } = parseCSV(reader.result);
      setHeaders(h);
      setRows(r);
      setMapping(guessMapping(h));
      setStage("map");
    };
    reader.readAsText(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const loadSample = () => {
    const sample = `Name,Email,Phone,Role,Pronouns,Production
Theo Marsh,theo.marsh@example.com,(617) 555-0455,Cast — Principal,he/him,Pirates of Penzance
Priya Anand,priya@example.com,(617) 555-0512,Cast — Principal,she/her,Pirates of Penzance
Helena Voss,helena.voss@example.com,(617) 555-0193,Music Director,she/her,Pirates of Penzance
Adaeze Ife,adaeze.i@example.com,(617) 555-0211,Costume Designer,she/her,Pirates of Penzance
Sasha Petrov,sasha.petr@example.com,(617) 555-1199,Stage Manager,she/her,The Mikado
Quinn Adler,quinn.adler@example.com,(617) 555-1021,Choreographer,they/them,Pirates of Penzance
Eli Hartman,eli.hartman@example.com,(617) 555-1108,Props Master,he/him,Pirates of Penzance`;
    const { headers: h, rows: r } = parseCSV(sample);
    setHeaders(h); setRows(r); setMapping(guessMapping(h)); setStage("map");
  };

  const matchRole = (raw) => {
    if (!raw) return PP_ROLES.find(r => r.key === "cast-ensemble");
    const r = PP_ROLES.find(x => x.label.toLowerCase() === raw.toLowerCase());
    if (r) return r;
    const partial = PP_ROLES.find(x => raw.toLowerCase().includes(x.label.toLowerCase()) || x.label.toLowerCase().includes(raw.toLowerCase()));
    return partial || PP_ROLES.find(r => r.key === "cast-ensemble");
  };

  const previewRows = React.useMemo(() => rows.map((r, i) => {
    const name  = mapping.name  >= 0 ? r[mapping.name]  : "";
    const email = mapping.email >= 0 ? r[mapping.email] : "";
    const phone = mapping.phone >= 0 ? r[mapping.phone] : "";
    const pronouns = mapping.pronouns >= 0 ? r[mapping.pronouns] : "—";
    const role  = matchRole(mapping.role >= 0 ? r[mapping.role] : "");
    const prod  = mapping.prod  >= 0 ? r[mapping.prod]  : "";
    return { _i:i, name, email, phone, pronouns, role, prod, valid: !!(name && /@/.test(email)) };
  }), [rows, mapping]);

  const validCount = previewRows.filter(r => r.valid).length;

  const finalize = () => {
    const ts = Date.now();
    const out = previewRows.filter(r => r.valid).map((r, i) => ({
      id:`new-${ts}-${i}`,
      name:r.name, email:r.email, phone:r.phone, pronouns:r.pronouns,
      role: r.role.label, roleKey: r.role.key, cat: r.role.cat, c: r.role.c,
      permission: r.role.cat === "Cast" ? "cast" : "editor",
      status: sendInvite ? "invited" : "active",
      joined: new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),
      lastActive: sendInvite ? "never" : "just now",
      initials: r.name.split(" ").map(p => p[0]).filter(Boolean).slice(0,2).join("").toUpperCase(),
      assigns: r.prod ? [{prod: r.prod, role: r.role.label, c: r.role.c}] : [],
    }));
    onAdd(out);
  };

  if (stage === "drop") return (
    <div className="pp-form">
      <div ref={dropRef} className="pp-drop"
           onDragOver={e => { e.preventDefault(); dropRef.current?.classList.add("over"); }}
           onDragLeave={() => dropRef.current?.classList.remove("over")}
           onDrop={(e) => { dropRef.current?.classList.remove("over"); onDrop(e); }}>
        <div className="pp-drop-ico"><PpI.Upload size={28}/></div>
        <b>Drop your CSV here</b>
        <span>or</span>
        <label className="btn primary" style={{cursor:"pointer"}}>
          <PpI.File size={13}/><span>Choose file</span>
          <input type="file" accept=".csv,text/csv" style={{display:"none"}}
                 onChange={e => handleFile(e.target.files[0])}/>
        </label>
        <button className="pp-link" onClick={loadSample}>Load a sample CSV instead</button>
      </div>
      <div className="pp-csv-hints">
        <div><b>Recommended columns:</b> <span className="mono">Name, Email, Phone, Role, Pronouns, Production</span></div>
        <div className="pp-muted">Commas, tabs, or semicolons all work. We'll auto-detect and let you map columns next.</div>
      </div>
      <div className="pp-form-actions">
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );

  if (stage === "map") return (
    <div className="pp-form">
      <div className="pp-banner">
        <PpI.Info size={14}/>
        <span>Found <b>{rows.length}</b> rows. Match columns to fields below — we've auto-guessed where we can.</span>
      </div>
      <div className="pp-map">
        {[
          {key:"name",     label:"Name",       required:true},
          {key:"email",    label:"Email",      required:true},
          {key:"phone",    label:"Phone",      required:false},
          {key:"role",     label:"Role",       required:false},
          {key:"pronouns", label:"Pronouns",   required:false},
          {key:"prod",     label:"Production", required:false},
        ].map(f => (
          <div key={f.key} className="pp-map-row">
            <div className="pp-map-label">
              {f.label}{f.required && <span className="pp-req">*</span>}
            </div>
            <select className="pp-field" value={mapping[f.key] ?? -1}
                    onChange={e => setMapping({...mapping, [f.key]: parseInt(e.target.value)})}>
              <option value={-1}>— ignore —</option>
              {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
            </select>
            <div className="pp-map-preview">
              {mapping[f.key] >= 0 && rows[0]
                ? <><span className="pp-muted">e.g.</span> "{rows[0][mapping[f.key]]}"</>
                : <span className="pp-muted">—</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="pp-form-actions">
        <button className="btn ghost" onClick={() => setStage("drop")}><PpI.ChevLeft size={12}/><span>Back</span></button>
        <div style={{flex:1}}/>
        <button className="btn primary" onClick={() => setStage("preview")}
                disabled={!(mapping.name >= 0 && mapping.email >= 0)}
                style={{opacity:(mapping.name >= 0 && mapping.email >= 0) ? 1 : .4}}>
          <span>Preview {rows.length} rows</span><PpI.ChevRight size={12}/>
        </button>
      </div>
    </div>
  );

  // preview
  return (
    <div className="pp-form">
      <div className="pp-banner success">
        <PpI.Check size={14}/>
        <span><b>{validCount}</b> of {rows.length} rows look good. {rows.length - validCount > 0 && <span>· {rows.length - validCount} skipped (missing name or email).</span>}</span>
      </div>
      <div className="pp-preview-wrap">
        <table className="pp-preview">
          <thead><tr><th></th><th>Name</th><th>Email</th><th>Role</th><th>Production</th></tr></thead>
          <tbody>
            {previewRows.slice(0, 20).map((r, i) => (
              <tr key={i} data-bad={!r.valid ? "1" : "0"}>
                <td>{r.valid ? <PpI.Check size={12} stroke={2.5}/> : <PpI.Alert size={12}/>}</td>
                <td>{r.name || <span className="pp-muted">—</span>}</td>
                <td className="mono">{r.email || <span className="pp-muted">—</span>}</td>
                <td><span className="pp-pill" data-c={r.role.c}>{r.role.label}</span></td>
                <td><span className="pp-muted">{r.prod || "—"}</span></td>
              </tr>
            ))}
            {previewRows.length > 20 && <tr><td colSpan="5" style={{textAlign:"center",color:"var(--ink-4)",fontStyle:"italic",padding:8}}>…+{previewRows.length - 20} more rows</td></tr>}
          </tbody>
        </table>
      </div>
      <label className="pp-check">
        <input type="checkbox" checked={sendInvite} onChange={e => setSendInvite(e.target.checked)}/>
        <span>Send invite emails to all {validCount} valid people</span>
      </label>
      <div className="pp-form-actions">
        <button className="btn ghost" onClick={() => setStage("map")}><PpI.ChevLeft size={12}/><span>Back</span></button>
        <div style={{flex:1}}/>
        <button className="btn primary" onClick={finalize} disabled={validCount === 0} style={{opacity: validCount === 0 ? .4 : 1}}>
          <PpI.Check size={14}/><span>Add {validCount} {validCount === 1 ? "person" : "people"}</span>
        </button>
      </div>
    </div>
  );
}

// ─── Bulk wizard (paste a list) ───────────────────────────────────────
function AddBulk({ onAdd, onCancel }) {
  const [step, setStep] = React.useState(1); // 1 paste, 2 review, 3 settings
  const [text, setText] = React.useState("");
  const [defaultRole, setDefaultRole] = React.useState("cast-ensemble");
  const [defaultProd, setDefaultProd] = React.useState("Pirates of Penzance");
  const [sendInvite, setSendInvite] = React.useState(true);
  const [parsed, setParsed] = React.useState([]);

  const parse = (raw) => {
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    return lines.map((line, i) => {
      // Try: "Name <email>"   or   "Name, email, phone"
      const angle = line.match(/^(.+?)\s*<([^>]+)>$/);
      let name = "", email = "", phone = "";
      if (angle) { name = angle[1].trim(); email = angle[2].trim(); }
      else {
        const parts = line.split(/[,\t;|]+/).map(s => s.trim());
        name  = parts[0] || "";
        email = parts.find(p => /@/.test(p)) || "";
        phone = parts.find(p => /^[\d\s\-\(\)\.+]{7,}$/.test(p)) || "";
      }
      return { _i:i, name, email, phone, valid: !!(name && /@/.test(email)) };
    });
  };

  const advance = () => {
    setParsed(parse(text));
    setStep(2);
  };

  const finalize = () => {
    const role = PP_ROLES.find(r => r.key === defaultRole);
    const ts = Date.now();
    const out = parsed.filter(r => r.valid).map((r, i) => ({
      id:`new-${ts}-${i}`,
      name:r.name, email:r.email, phone:r.phone, pronouns:"—",
      role: role.label, roleKey: role.key, cat: role.cat, c: role.c,
      permission: role.cat === "Cast" ? "cast" : "editor",
      status: sendInvite ? "invited" : "active",
      joined: new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),
      lastActive: sendInvite ? "never" : "just now",
      initials: r.name.split(" ").map(p => p[0]).filter(Boolean).slice(0,2).join("").toUpperCase(),
      assigns: defaultProd ? [{prod: defaultProd, role: role.label, c: role.c}] : [],
    }));
    onAdd(out);
  };

  const validCount = parsed.filter(p => p.valid).length;

  return (
    <div className="pp-form">
      <div className="pp-stepper">
        {["Paste your list","Review names","Set roles & send"].map((label, i) => (
          <div key={i} className="pp-stepper-i" data-state={step === i+1 ? "active" : step > i+1 ? "done" : "idle"}>
            <span className="n">{step > i+1 ? <PpI.Check size={10} stroke={2.5}/> : i+1}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {step === 1 && <React.Fragment>
        <div className="pp-fg">
          <label>Paste one person per line</label>
          <textarea className="pp-field" rows={9} value={text}
            placeholder={"Theo Marsh <theo.marsh@example.com>\nPriya Anand, priya@example.com, (617) 555-0512\nMarcus Beale, marcus.beale@example.com\nWalter Ek <wek@example.com>"}
            onChange={e => setText(e.target.value)}/>
          <div className="pp-muted" style={{marginTop:6,fontSize:12}}>
            Accepts <span className="mono">Name &lt;email&gt;</span> or comma/tab-separated <span className="mono">Name, email, phone</span>. We'll preview before you commit.
          </div>
        </div>
        <div className="pp-form-actions">
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <div style={{flex:1}}/>
          <button className="btn primary" onClick={advance} disabled={!text.trim()} style={{opacity: text.trim() ? 1 : .4}}>
            <span>Continue</span><PpI.ChevRight size={12}/>
          </button>
        </div>
      </React.Fragment>}

      {step === 2 && <React.Fragment>
        <div className="pp-banner success">
          <PpI.Check size={14}/>
          <span>Parsed <b>{validCount}</b> of {parsed.length} lines. {parsed.length - validCount > 0 && <span>· {parsed.length - validCount} couldn't be read.</span>}</span>
        </div>
        <div className="pp-preview-wrap">
          <table className="pp-preview">
            <thead><tr><th></th><th>Name</th><th>Email</th><th>Phone</th></tr></thead>
            <tbody>
              {parsed.map((r,i) => (
                <tr key={i} data-bad={!r.valid ? "1" : "0"}>
                  <td>{r.valid ? <PpI.Check size={12} stroke={2.5}/> : <PpI.Alert size={12}/>}</td>
                  <td>{r.name || <span className="pp-muted">—</span>}</td>
                  <td className="mono">{r.email || <span className="pp-muted">missing email</span>}</td>
                  <td className="mono">{r.phone || <span className="pp-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pp-form-actions">
          <button className="btn ghost" onClick={() => setStep(1)}><PpI.ChevLeft size={12}/><span>Back</span></button>
          <div style={{flex:1}}/>
          <button className="btn primary" onClick={() => setStep(3)} disabled={validCount === 0} style={{opacity: validCount === 0 ? .4 : 1}}>
            <span>Continue</span><PpI.ChevRight size={12}/>
          </button>
        </div>
      </React.Fragment>}

      {step === 3 && <React.Fragment>
        <div className="pp-banner">
          <PpI.Info size={14}/>
          <span>Apply the same role &amp; production to all {validCount} people. You can change individuals afterward in the directory.</span>
        </div>
        <div className="pp-form-grid">
          <div className="pp-fg" style={{gridColumn:"1 / -1"}}>
            <label>Default role for everyone</label>
            <select className="pp-field" value={defaultRole} onChange={e => setDefaultRole(e.target.value)}>
              {PP_ROLES.map(r => <option key={r.key} value={r.key}>{r.label} — {r.cat}</option>)}
            </select>
          </div>
          <div className="pp-fg" style={{gridColumn:"1 / -1"}}>
            <label>Assign all to production</label>
            <select className="pp-field" value={defaultProd} onChange={e => setDefaultProd(e.target.value)}>
              <option value="">— don't assign yet —</option>
              {PP_PRODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <label className="pp-check">
          <input type="checkbox" checked={sendInvite} onChange={e => setSendInvite(e.target.checked)}/>
          <span>Send invite emails to all {validCount} people</span>
        </label>
        <div className="pp-form-actions">
          <button className="btn ghost" onClick={() => setStep(2)}><PpI.ChevLeft size={12}/><span>Back</span></button>
          <div style={{flex:1}}/>
          <button className="btn primary" onClick={finalize}>
            <PpI.Check size={14}/><span>Add {validCount} {validCount === 1 ? "person" : "people"}{sendInvite ? " & send invites" : ""}</span>
          </button>
        </div>
      </React.Fragment>}
    </div>
  );
}

// ─── Assign-to-production modal ───────────────────────────────────────
function AssignToProductionModal({ count, onClose, onConfirm }) {
  const [prod, setProd] = React.useState(PP_PRODS[0]);
  const [role, setRole] = React.useState("");
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="pp-modal-bg" onClick={onClose}>
      <div className="pp-modal" style={{maxWidth:520}} onClick={e => e.stopPropagation()}>
        <div className="pp-modal-h">
          <h2>Assign {count} {count === 1 ? "person" : "people"} to a production</h2>
          <div style={{flex:1}}/>
          <button className="pp-icon-btn" onClick={onClose}><PpI.X size={14}/></button>
        </div>
        <div className="pp-form">
          <div className="pp-fg">
            <label>Production</label>
            <select className="pp-field" value={prod} onChange={e => setProd(e.target.value)}>
              {PP_PRODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="pp-fg">
            <label>Role within this production</label>
            <input className="pp-field" value={role} placeholder="e.g. Ensemble, Stage Manager, Pirate"
                   onChange={e => setRole(e.target.value)} autoFocus/>
          </div>
          <div className="pp-form-actions">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <div style={{flex:1}}/>
            <button className="btn primary" disabled={!role.trim()} style={{opacity: role.trim() ? 1 : .4}}
                    onClick={() => onConfirm(prod, role.trim())}>
              <PpI.Check size={14}/><span>Assign</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
function PeoplePageStyles() {
  return <style>{`
.people-page{ padding: 28px 36px 60px; max-width: 1400px; margin: 0 auto; }
.pp-header{ display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.pp-eyebrow{ font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-4); font-weight: 600; }
.pp-title{ font: 600 38px/1.05 var(--font-display); margin: 4px 0 6px; letter-spacing: -.01em; }
.pp-sub{ color: var(--ink-3); font-size: 14px; max-width: 540px; }
.pp-cta{ display: flex; gap: 8px; }

.pp-stats{ display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 22px; }
.pp-stat{
  appearance: none; border: 1px solid var(--border);
  background: var(--bg-elev); color: var(--ink);
  text-align: left; padding: 14px 14px;
  border-radius: 10px; cursor: pointer;
  position: relative;
  transition: border-color .12s, background .12s, transform .12s;
}
.pp-stat:hover{ border-color: var(--border-strong); transform: translateY(-1px); }
.pp-stat[data-active="1"]{ border-color: var(--accent); background: var(--accent-soft); }
.pp-stat b{ display: block; font: 600 26px/1 var(--font-display); margin-bottom: 4px; }
.pp-stat span{ font-size: 12px; color: var(--ink-3); }
.pp-stat-dot{ position: absolute; top: 12px; right: 12px; width: 7px; height: 7px; border-radius: 50%; }

.pp-toolbar{
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 14px;
}
.pp-search{
  display: flex; align-items: center; gap: 8px;
  background: var(--bg-elev); border: 1px solid var(--border);
  height: 34px; padding: 0 12px; border-radius: 7px;
  min-width: 280px;
}
.pp-search:focus-within{ border-color: var(--accent); }
.pp-search input{ border: 0; background: transparent; outline: 0; font: 400 13px var(--font-ui); color: var(--ink); flex: 1; }
.pp-search input::placeholder{ color: var(--ink-4); }
.pp-search svg{ color: var(--ink-4); }
.pp-filter{
  background: var(--bg-elev); border: 1px solid var(--border);
  height: 34px; padding: 0 28px 0 10px; border-radius: 7px;
  font: 400 13px var(--font-ui); color: var(--ink); cursor: pointer;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--ink-4) 50%), linear-gradient(135deg, var(--ink-4) 50%, transparent 50%);
  background-position: calc(100% - 14px) 50%, calc(100% - 10px) 50%;
  background-size: 4px 4px, 4px 4px;
  background-repeat: no-repeat;
}
.pp-filter:hover{ border-color: var(--border-strong); }
.pp-viewtoggle{ display: inline-flex; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 7px; padding: 2px; }
.pp-viewtoggle button{
  appearance: none; border: 0; background: transparent;
  padding: 0 10px; height: 28px;
  font: 500 12px var(--font-ui); color: var(--ink-3);
  display: inline-flex; align-items: center; gap: 5px;
  cursor: pointer; border-radius: 5px;
}
.pp-viewtoggle button[data-active="1"]{ background: var(--bg); color: var(--ink); box-shadow: 0 1px 2px rgba(40,15,5,.08); }

.pp-selbar{
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: var(--accent-soft);
  border: 1px solid color-mix(in oklch, var(--accent) 30%, var(--bg));
  border-radius: 8px;
  margin-bottom: 12px;
  font: 500 13px var(--font-ui);
}
.pp-selbar b{ font-weight: 600; }

.pp-table-wrap{
  background: var(--bg-elev); border: 1px solid var(--border);
  border-radius: 10px; overflow: hidden;
}
.pp-table{ width: 100%; border-collapse: collapse; font: 400 13px var(--font-ui); }
.pp-table thead th{
  text-align: left; padding: 10px 12px;
  font: 600 11px/1 var(--font-ui); letter-spacing: .04em; text-transform: uppercase;
  color: var(--ink-4); background: var(--bg-sunken);
  border-bottom: 1px solid var(--border);
}
.pp-table tbody tr{ border-bottom: 1px solid var(--border); cursor: pointer; transition: background .1s; }
.pp-table tbody tr:hover{ background: var(--bg-muted); }
.pp-table tbody tr:last-child{ border-bottom: 0; }
.pp-table tbody tr[data-selected="1"]{ background: color-mix(in oklch, var(--accent) 6%, var(--bg-elev)); }
.pp-table td{ padding: 10px 12px; vertical-align: middle; }
.pp-table input[type="checkbox"]{ cursor: pointer; }

.pp-cell-member{ display: flex; align-items: center; gap: 10px; }
.pp-av{
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--ink-3); color: var(--bg);
  display: grid; place-items: center;
  font: 600 11px/1 var(--font-ui); letter-spacing: .02em;
  flex-shrink: 0;
}
.pp-av[data-c="accent"]{ background: var(--accent); color: white; }
.pp-av[data-c="clay"]{   background: var(--c-clay); color: white; }
.pp-av[data-c="plum"]{   background: var(--c-plum); color: white; }
.pp-av[data-c="dusk"]{   background: var(--c-dusk); color: white; }
.pp-av[data-c="sage"]{   background: var(--c-sage); color: white; }
.pp-av[data-c="amber"]{  background: var(--c-amber); color: white; }
.pp-av[data-c="sand"]{   background: var(--c-sand); color: var(--ink); }
.pp-av.lg{ width: 48px; height: 48px; font-size: 14px; }
.pp-av.xl{ width: 72px; height: 72px; font-size: 22px; border-radius: 16px; }

.pp-name{ font-weight: 600; font-size: 13.5px; display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pp-you{ font-size: 10px; padding: 1px 6px; background: var(--accent-soft); color: var(--accent-ink); border-radius: 999px; font-weight: 600; letter-spacing: .03em; }
.pp-tag{ font-size: 10.5px; padding: 1px 6px; border-radius: 999px; font-weight: 500; }
.pp-tag-amber{ background: color-mix(in oklch, var(--c-amber) 14%, var(--bg)); color: color-mix(in oklch, var(--c-amber) 55%, var(--ink)); }
.pp-tag-mute{ background: var(--bg-sunken); color: var(--ink-4); }
.pp-email{ font-size: 12px; color: var(--ink-4); font-family: var(--font-mono); }

.pp-pill{
  display: inline-flex; align-items: center; gap: 4px;
  font: 500 11.5px/1 var(--font-ui);
  padding: 4px 8px; border-radius: 999px;
  background: var(--bg-sunken); color: var(--ink-2);
  border: 1px solid var(--border);
}
.pp-pill[data-c="accent"]{ background: var(--accent-soft); color: var(--accent-ink); border-color: color-mix(in oklch, var(--accent) 20%, var(--bg)); }
.pp-pill[data-c="clay"]{   background: color-mix(in oklch, var(--c-clay) 14%, var(--bg));  color: color-mix(in oklch, var(--c-clay) 55%, var(--ink));  border-color: color-mix(in oklch, var(--c-clay) 25%, var(--bg)); }
.pp-pill[data-c="plum"]{   background: color-mix(in oklch, var(--c-plum) 14%, var(--bg));  color: color-mix(in oklch, var(--c-plum) 55%, var(--ink));  border-color: color-mix(in oklch, var(--c-plum) 25%, var(--bg)); }
.pp-pill[data-c="dusk"]{   background: color-mix(in oklch, var(--c-dusk) 14%, var(--bg));  color: color-mix(in oklch, var(--c-dusk) 55%, var(--ink));  border-color: color-mix(in oklch, var(--c-dusk) 25%, var(--bg)); }
.pp-pill[data-c="sage"]{   background: color-mix(in oklch, var(--c-sage) 14%, var(--bg));  color: color-mix(in oklch, var(--c-sage) 55%, var(--ink));  border-color: color-mix(in oklch, var(--c-sage) 25%, var(--bg)); }
.pp-pill[data-c="amber"]{  background: color-mix(in oklch, var(--c-amber) 14%, var(--bg)); color: color-mix(in oklch, var(--c-amber) 55%, var(--ink)); border-color: color-mix(in oklch, var(--c-amber) 25%, var(--bg)); }
.pp-pill[data-c="sand"]{   background: color-mix(in oklch, var(--c-sand) 22%, var(--bg));  color: color-mix(in oklch, var(--c-sand) 70%, var(--ink));  border-color: color-mix(in oklch, var(--c-sand) 30%, var(--bg)); }

.pp-assigns{ display: flex; flex-direction: column; gap: 3px; }
.pp-assign{ display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; }
.pp-assign-dot{ width: 6px; height: 6px; border-radius: 50%; background: var(--ink-3); flex-shrink: 0; }
.pp-assign-dot.lg{ width: 10px; height: 10px; }
.pp-assign-dot[data-c="accent"]{ background: var(--accent); }
.pp-assign-dot[data-c="clay"]{   background: var(--c-clay); }
.pp-assign-dot[data-c="plum"]{   background: var(--c-plum); }
.pp-assign-dot[data-c="dusk"]{   background: var(--c-dusk); }
.pp-assign-dot[data-c="sage"]{   background: var(--c-sage); }
.pp-assign-dot[data-c="amber"]{  background: var(--c-amber); }
.pp-assign-dot[data-c="sand"]{   background: var(--c-sand); }
.pp-assign-prod{ font-weight: 500; color: var(--ink-2); }
.pp-assign-role{ color: var(--ink-4); font-size: 12px; }
.pp-more{ font-size: 11px; color: var(--ink-4); padding-left: 12px; }

.pp-perm{
  font: 500 11.5px var(--font-ui); padding: 2px 8px;
  border-radius: 4px; border: 1px solid var(--border);
  background: var(--bg-sunken); color: var(--ink-2);
}
.pp-perm[data-perm="admin"]{ background: var(--accent-soft); color: var(--accent-ink); border-color: color-mix(in oklch, var(--accent) 20%, var(--bg)); }
.pp-perm[data-perm="cast"]{ background: color-mix(in oklch, var(--c-plum) 12%, var(--bg)); color: color-mix(in oklch, var(--c-plum) 55%, var(--ink)); border-color: color-mix(in oklch, var(--c-plum) 22%, var(--bg)); }
.pp-perm[data-perm="viewer"]{ color: var(--ink-3); }

.pp-muted{ color: var(--ink-4); font-size: 12.5px; }
.pp-icon-btn{
  width: 26px; height: 26px; border: 0; background: transparent;
  display: grid; place-items: center; cursor: pointer;
  border-radius: 5px; color: var(--ink-3);
}
.pp-icon-btn:hover{ background: var(--bg-muted); color: var(--ink); }
.pp-icon-btn.delete:hover{ color: var(--c-clay); }

.pp-empty{
  background: var(--bg-elev); border: 1px dashed var(--border-strong);
  border-radius: 10px; padding: 50px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  text-align: center;
}
.pp-empty b{ font-size: 14px; }
.pp-empty span{ color: var(--ink-4); font-size: 13px; }
.pp-empty-ico{ width: 64px; height: 64px; border-radius: 18px; background: var(--bg-sunken); display: grid; place-items: center; color: var(--ink-4); margin-bottom: 6px; }
.pp-empty-sm{ color: var(--ink-4); font-size: 12.5px; font-style: italic; padding: 8px 0; }

/* Grid view */
.pp-grid{
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;
}
.pp-card{
  appearance: none; border: 1px solid var(--border);
  background: var(--bg-elev); color: var(--ink);
  text-align: center; padding: 22px 14px 16px;
  border-radius: 12px; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  transition: border-color .12s, transform .12s, box-shadow .12s;
}
.pp-card:hover{ border-color: var(--border-strong); transform: translateY(-2px); box-shadow: 0 6px 18px -8px rgba(40,15,5,.16); }
.pp-card-name{ font-weight: 600; font-size: 14px; }
.pp-card-role{ margin-top: 2px; }
.pp-card-prods{ font-size: 12px; color: var(--ink-4); }
.pp-card-status.amber{ font-size: 10.5px; padding: 2px 8px; border-radius: 999px;
  background: color-mix(in oklch, var(--c-amber) 14%, var(--bg));
  color: color-mix(in oklch, var(--c-amber) 55%, var(--ink));
  font-weight: 500; }

/* Drawer */
.pp-drawer-wrap{
  position: fixed; inset: 0; background: rgba(20,10,5,.32);
  z-index: 240; display: flex; justify-content: flex-end;
  animation: pp-fade .15s ease;
}
@keyframes pp-fade { from { opacity: 0; } to { opacity: 1; } }
.pp-drawer{
  width: 480px; max-width: 92vw;
  background: var(--bg); height: 100vh;
  display: flex; flex-direction: column;
  box-shadow: -16px 0 36px -10px rgba(40,15,5,.22);
  animation: pp-slide .22s cubic-bezier(.2,.9,.3,1.05);
  overflow-y: auto;
}
@keyframes pp-slide { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.pp-drawer-h{ display: flex; align-items: center; gap: 6px; padding: 14px 18px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg); z-index: 2; }
.pp-drawer-hero{ display: flex; gap: 16px; align-items: center; padding: 22px 22px 18px; }
.pp-drawer-hero h2{ font: 600 22px var(--font-display); margin: 0 0 4px; }
.pp-drawer-role{ margin-bottom: 6px; }
.pp-drawer-contact{ display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--ink-3); }
.pp-drawer-contact a{ color: var(--ink-2); text-decoration: none; font-family: var(--font-mono); }
.pp-drawer-contact a:hover{ color: var(--accent); text-decoration: underline; }
.pp-pip{ width: 3px; height: 3px; border-radius: 50%; background: var(--ink-4); }

.pp-drawer-meta{
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 14px 24px;
  padding: 16px 22px 18px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--bg-sunken);
}
.pp-drawer-meta > div span{ display: block; font-size: 11px; color: var(--ink-4); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 2px; }
.pp-drawer-meta > div b{ font-size: 13px; font-weight: 500; }
.pp-status{ display: inline-flex; align-items: center; gap: 6px; }
.pp-status .dot{ width: 6px; height: 6px; border-radius: 50%; }
.pp-status[data-status="active"] .dot{ background: var(--c-sage); }
.pp-status[data-status="invited"] .dot{ background: var(--c-amber); }
.pp-status[data-status="inactive"] .dot{ background: var(--ink-4); }

.pp-drawer-section{ padding: 18px 22px; border-bottom: 1px solid var(--border); }
.pp-drawer-section:last-child{ border-bottom: 0; }
.pp-drawer-section-h{ display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.pp-drawer-section h3{ font: 600 12px var(--font-ui); margin: 0; text-transform: uppercase; letter-spacing: .07em; color: var(--ink-4); }
.pp-drawer-assigns{ display: flex; flex-direction: column; gap: 8px; }
.pp-drawer-assign{
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg-elev);
}
.pp-drawer-assign b{ display: block; font-size: 13.5px; font-weight: 600; }
.pp-drawer-assign span{ font-size: 12px; color: var(--ink-3); }

.pp-activity{ display: flex; flex-direction: column; gap: 6px; }
.pp-act-item{ display: grid; grid-template-columns: 80px 1fr; gap: 12px; font-size: 12.5px; padding: 4px 0; }
.pp-act-item .t{ color: var(--ink-4); font-family: var(--font-mono); font-size: 11px; padding-top: 1px; }

/* Modal */
.pp-modal-bg{
  position: fixed; inset: 0; background: rgba(20,10,5,.32);
  z-index: 250; display: grid; place-items: center;
  padding: 24px; animation: pp-fade .15s ease;
}
.pp-modal{
  background: var(--bg); border-radius: 14px;
  width: 720px; max-width: 100%; max-height: 88vh; overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 60px -16px rgba(40,15,5,.32);
  animation: pp-pop .18s cubic-bezier(.2,.9,.3,1.1);
}
@keyframes pp-pop { from { transform: scale(.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.pp-modal-h{ display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--border); }
.pp-modal-h h2{ font: 600 16px var(--font-ui); margin: 0; }

.pp-paths{ padding: 18px; display: flex; flex-direction: column; gap: 10px; }
.pp-path{
  appearance: none; border: 1px solid var(--border);
  background: var(--bg-elev); color: var(--ink);
  display: flex; align-items: center; gap: 14px;
  padding: 16px;
  text-align: left;
  border-radius: 10px; cursor: pointer;
  transition: border-color .12s, transform .12s, background .12s;
}
.pp-path:hover{ border-color: var(--accent); transform: translateY(-1px); background: color-mix(in oklch, var(--accent) 4%, var(--bg-elev)); }
.pp-path-ico{
  width: 44px; height: 44px; border-radius: 10px;
  background: var(--accent-soft); color: var(--accent-ink);
  display: grid; place-items: center; flex-shrink: 0;
}
.pp-path-body{ flex: 1; display: flex; flex-direction: column; gap: 2px; }
.pp-path-body b{ font-size: 14.5px; font-weight: 600; }
.pp-path-body > span{ font-size: 12.5px; color: var(--ink-3); }
.pp-path-time{ font-size: 11px !important; color: var(--ink-4) !important; margin-top: 2px; font-family: var(--font-mono); }

/* Form */
.pp-form{ padding: 18px 20px 20px; overflow-y: auto; }
.pp-form-grid{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px 14px; }
.pp-fg{ display: flex; flex-direction: column; gap: 4px; }
.pp-fg label{ font: 500 12px var(--font-ui); color: var(--ink-3); }
.pp-req{ color: var(--accent); margin-left: 2px; }
.pp-field{
  background: var(--bg-elev); border: 1px solid var(--border);
  height: 36px; padding: 0 12px; border-radius: 7px;
  font: 400 13px var(--font-ui); color: var(--ink);
  outline: 0; width: 100%; box-sizing: border-box;
}
textarea.pp-field{ height: auto; padding: 10px 12px; font-family: var(--font-mono); font-size: 12.5px; line-height: 1.5; resize: vertical; }
.pp-field:focus{ border-color: var(--accent); }
select.pp-field{ appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--ink-4) 50%), linear-gradient(135deg, var(--ink-4) 50%, transparent 50%);
  background-position: calc(100% - 14px) 50%, calc(100% - 10px) 50%;
  background-size: 4px 4px, 4px 4px;
  background-repeat: no-repeat;
  padding-right: 28px;
}

.pp-perm-grid{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.pp-perm-card{
  appearance: none; background: var(--bg-elev); border: 1px solid var(--border);
  padding: 10px; border-radius: 8px; text-align: left; cursor: pointer;
  display: flex; flex-direction: column; gap: 2px;
  transition: border-color .1s, background .1s;
}
.pp-perm-card:hover{ border-color: var(--border-strong); }
.pp-perm-card[data-on="1"]{ border-color: var(--accent); background: var(--accent-soft); }
.pp-perm-card b{ font-size: 12.5px; font-weight: 600; }
.pp-perm-card span{ font-size: 11px; color: var(--ink-4); line-height: 1.3; }

.pp-form-section{ margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
.pp-form-section-h{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.pp-form-section h4{ font: 600 12.5px var(--font-ui); margin: 0; }
.pp-form-section h4 .pp-muted{ font-size: 11px; font-weight: 400; }
.pp-assign-list{ display: flex; flex-direction: column; gap: 6px; }
.pp-assign-row{ display: grid; grid-template-columns: 1.4fr 1fr 30px; gap: 6px; }

.pp-check{ display: flex; align-items: center; gap: 8px; margin-top: 16px; font-size: 13px; cursor: pointer; user-select: none; }
.pp-check input{ cursor: pointer; }

.pp-form-actions{ display: flex; align-items: center; gap: 8px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border); }

/* CSV drop */
.pp-drop{
  border: 2px dashed var(--border-strong); border-radius: 12px;
  padding: 36px 24px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: var(--bg-sunken);
  transition: border-color .12s, background .12s;
}
.pp-drop.over{ border-color: var(--accent); background: var(--accent-soft); }
.pp-drop-ico{ width: 56px; height: 56px; border-radius: 14px; background: var(--bg-elev); display: grid; place-items: center; color: var(--ink-3); margin-bottom: 6px; }
.pp-drop b{ font-size: 15px; font-weight: 600; }
.pp-drop span{ font-size: 12.5px; color: var(--ink-4); }
.pp-link{
  appearance: none; border: 0; background: transparent;
  color: var(--accent-ink); font: 500 12px var(--font-ui);
  cursor: pointer; text-decoration: underline; margin-top: 8px;
}
.pp-csv-hints{ margin-top: 16px; padding: 12px 14px; background: var(--bg-sunken); border-radius: 8px; font-size: 12.5px; line-height: 1.5; }
.pp-csv-hints .mono{ font-family: var(--font-mono); font-size: 12px; }

.pp-banner{
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 14px;
  background: color-mix(in oklch, var(--c-dusk) 7%, var(--bg));
  border: 1px solid color-mix(in oklch, var(--c-dusk) 20%, var(--bg));
  border-radius: 8px;
  font-size: 13px; line-height: 1.45;
  margin-bottom: 16px;
}
.pp-banner.success{
  background: color-mix(in oklch, var(--c-sage) 9%, var(--bg));
  border-color: color-mix(in oklch, var(--c-sage) 22%, var(--bg));
}
.pp-banner svg{ color: var(--ink-3); flex-shrink: 0; margin-top: 1px; }

.pp-map{ display: flex; flex-direction: column; gap: 8px; }
.pp-map-row{ display: grid; grid-template-columns: 110px 1fr 1fr; gap: 12px; align-items: center; }
.pp-map-label{ font: 500 13px var(--font-ui); }
.pp-map-preview{ font-size: 12px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--font-mono); }

.pp-preview-wrap{ max-height: 280px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; }
.pp-preview{ width: 100%; border-collapse: collapse; font: 400 12.5px var(--font-ui); }
.pp-preview thead th{ position: sticky; top: 0; background: var(--bg-sunken); padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-4); font-weight: 600; border-bottom: 1px solid var(--border); }
.pp-preview td{ padding: 8px 10px; border-bottom: 1px solid var(--border); }
.pp-preview tbody tr:last-child td{ border-bottom: 0; }
.pp-preview tbody tr[data-bad="1"]{ background: color-mix(in oklch, var(--c-amber) 6%, var(--bg)); color: var(--ink-3); }
.pp-preview td:first-child{ color: var(--c-sage); width: 28px; }
.pp-preview tr[data-bad="1"] td:first-child{ color: var(--c-amber); }
.pp-preview .mono{ font-family: var(--font-mono); font-size: 12px; }

/* Stepper for bulk wizard */
.pp-stepper{ display: flex; gap: 8px; margin-bottom: 18px; padding: 4px; background: var(--bg-sunken); border-radius: 8px; }
.pp-stepper-i{ flex: 1; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font: 500 12px var(--font-ui); color: var(--ink-4); border-radius: 6px; }
.pp-stepper-i .n{ width: 20px; height: 20px; border-radius: 50%; background: var(--bg); border: 1px solid var(--border); display: grid; place-items: center; font-size: 11px; font-weight: 600; }
.pp-stepper-i[data-state="active"]{ background: var(--bg); color: var(--ink); box-shadow: 0 1px 2px rgba(40,15,5,.06); }
.pp-stepper-i[data-state="active"] .n{ background: var(--accent); color: white; border-color: var(--accent); }
.pp-stepper-i[data-state="done"] .n{ background: var(--c-sage); color: white; border-color: var(--c-sage); }

/* Toast */
.pp-toast{
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: var(--ink); color: var(--bg);
  padding: 10px 16px; border-radius: 999px;
  font: 500 13px var(--font-ui);
  box-shadow: 0 12px 30px -8px rgba(0,0,0,.35);
  display: inline-flex; align-items: center; gap: 8px;
  z-index: 300;
  animation: pp-toast-rise .2s cubic-bezier(.2,.9,.3,1.2);
}
@keyframes pp-toast-rise { from { opacity:0; transform: translate(-50%, 8px); } to { opacity:1; transform: translate(-50%, 0); } }

.mono{ font-family: var(--font-mono); }

@media (max-width: 1100px){
  .pp-stats{ grid-template-columns: repeat(3, 1fr); }
  .pp-perm-grid{ grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px){
  .people-page{ padding: 20px 18px 40px; }
  .pp-title{ font-size: 28px; }
  .pp-stats{ grid-template-columns: repeat(2, 1fr); }
  .pp-form-grid{ grid-template-columns: 1fr; }
}
`}</style>;
}

Object.assign(window, { PeoplePage });
