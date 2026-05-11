// Rehearsal Reports tab — list / view / edit-or-create.
//
// Three modes: list (all reports), view (read-only past report),
// edit (full editor — used for both creating new and editing pending).
// Permission-aware via ROLE constant — SM/Director have full access,
// cast see redacted view (no line notes, no internal stage notes).

const { I: RpI } = window;
const { REPORTS, ACTIVE_REPORT } = window.DATA;

// We are the Stage Manager — full access. Toggleable via tweaks later.
const ROLE = "stage_manager";
const CAN_EDIT = ROLE === "stage_manager" || ROLE === "director";

const DEPTS = [
  { key:"director",  label:"Director / Production",  c:"accent", I:"Star",      restricted:false },
  { key:"costumes",  label:"Costumes",               c:"clay",   I:"Tag",       restricted:false },
  { key:"props",     label:"Props",                  c:"sand",   I:"Layers",    restricted:false },
  { key:"set",       label:"Set",                    c:"sage",   I:"Layout",    restricted:false },
  { key:"lighting",  label:"Lighting",               c:"amber",  I:"Lightbulb", restricted:false },
  { key:"sound",     label:"Sound",                  c:"dusk",   I:"Volume",    restricted:false },
  { key:"music",     label:"Music",                  c:"plum",   I:"Music",     restricted:false },
  { key:"stage",     label:"Stage Management",       c:"",       I:"Clipboard", restricted:true  }, // hidden from cast
];

// ─── Module-level state for new reports created during the session ───
// (Persists across mode switches but resets on reload — fine for prototype.)
let SESSION_REPORTS = [...REPORTS];

// Build a "view-shaped" record from a list-shaped row, hydrating the
// active sample for R-11 and synthesizing reasonable detail for older rows.
function hydrate(row) {
  if (row.num === "R-11") return { ...ACTIVE_REPORT, ...row, list: row };
  return {
    ...row,
    rehearsal: row.id, of: 36,
    start: row.calls.split(" – ")[0],
    end: row.calls.split(" – ")[1],
    breaks: [{start:"—",end:"—",kind:"10-min"}],
    totalRehearsal: "—",
    scenesWorked: [{ label: row.scene, pages:"—", time:"—" }],
    attendance: { present: 22 - (row.absences||0), absent: row.absences||0, late: row.late||0, notes: [] },
    schedule: [],
    notes: { director:"—", costumes:"—", props:"—", set:"—", lighting:"—", sound:"—", music:"—", stage:"—" },
    lineNotes: [],
    list: row,
  };
}

// ─── Top-level shell ───────────────────────────────────────────────────
function TabReports() {
  const [mode, setMode] = React.useState("list");        // list | view | edit
  const [active, setActive] = React.useState(null);       // report record
  const [reports, setReports] = React.useState(SESSION_REPORTS);

  const openReport = (row) => {
    setActive(hydrate(row));
    setMode(row.status === "Pending review" && CAN_EDIT ? "edit" : "view");
  };

  const newReport = () => {
    const next = nextReport(reports);
    setActive(next);
    setMode("edit");
  };

  const saveReport = (record, distribute = false) => {
    const list = {
      id: record.id ?? Math.max(...reports.map(r=>r.id))+1,
      num: record.num,
      date: record.shortDate,
      weekday: record.weekday,
      scene: record.scenesWorked?.[0]?.label || "—",
      calls: `${record.start} – ${record.end}`,
      status: distribute ? "Distributed" : "Pending review",
      c: distribute ? "sage" : "amber",
      absences: record.attendance?.absent || 0,
      late: record.attendance?.late || 0,
      injuries: record.injuries?.length || 0,
      dept: 0,
    };
    const exists = reports.findIndex(r => r.id === list.id);
    let next;
    if (exists >= 0) {
      next = reports.map((r,i) => i === exists ? list : r);
    } else {
      next = [list, ...reports];
    }
    setReports(next);
    SESSION_REPORTS = next;
    setActive({ ...record, list });
    setMode("view");
  };

  return (
    <div className="page-narrow anim-in">
      {mode === "list" && <ReportsList reports={reports} onOpen={openReport} onNew={newReport}/>}
      {mode === "view" && active && <ReportView record={active} onBack={() => setMode("list")} onEdit={() => setMode("edit")}/>}
      {mode === "edit" && active && <ReportEditor record={active} onCancel={() => setMode("list")} onSave={saveReport}/>}
    </div>
  );
}

// ─── New report scaffold ──────────────────────────────────────────────
function nextReport(reports) {
  const nums = reports.map(r => parseInt(r.num.replace("R-",""))).filter(Number.isFinite);
  const next = (Math.max(...nums) + 1).toString().padStart(2,"0");
  const today = new Date(2026, 4, 6); // demo: May 6 2026
  const wk = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][today.getDay()];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const long = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][today.getDay()];
  return {
    isNew: true,
    num: `R-${next}`,
    date: `${long}, ${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`,
    shortDate: `${months[today.getMonth()]} ${today.getDate()}`,
    weekday: wk,
    rehearsal: nums.length + 1, of: 36,
    start: "7:00 PM", end: "10:30 PM",
    breaks: [],
    totalRehearsal: "—",
    scenesWorked: [],
    attendance: { present: 22, absent: 0, late: 0, notes: [] },
    injuries: [],
    schedule: [],
    notes: { director:"", costumes:"", props:"", set:"", lighting:"", sound:"", music:"", stage:"" },
    lineNotes: [],
  };
}

// ════════════════════════════════════════════════════════════════════
// LIST MODE
// ════════════════════════════════════════════════════════════════════
function ReportsList({ reports, onOpen, onNew }) {
  const [filter, setFilter] = React.useState("all");
  const [q, setQ] = React.useState("");

  const filtered = reports.filter(r => {
    if (filter === "pending"  && r.status !== "Pending review") return false;
    if (filter === "distrib"  && r.status !== "Distributed")    return false;
    if (q && !(`${r.num} ${r.scene} ${r.date}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  const pending = reports.filter(r => r.status === "Pending review").length;
  const distrib = reports.filter(r => r.status === "Distributed").length;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="row-between">
        <div>
          <h2 className="h-section">Rehearsal reports</h2>
          <div className="muted" style={{fontSize:13,marginTop:2}}>
            {reports.length} reports · {pending} pending · {distrib} distributed
          </div>
        </div>
        <div className="row" style={{gap:8}}>
          <div style={{position:"relative"}}>
            <input className="field" placeholder="Search reports…" value={q} onChange={e => setQ(e.target.value)}
                   style={{paddingLeft:30,height:32,width:240}}/>
            <span style={{position:"absolute",left:10,top:9,color:"var(--ink-4)",pointerEvents:"none"}}>
              <RpI.Search size={14}/>
            </span>
          </div>
          {CAN_EDIT && (
            <button className="btn primary" onClick={onNew}>
              <RpI.Plus size={14}/><span>New report</span>
            </button>
          )}
        </div>
      </div>

      <div className="row" style={{gap:6}}>
        <FilterChip label={`All · ${reports.length}`} active={filter==="all"}     onClick={() => setFilter("all")}/>
        <FilterChip label={`Pending · ${pending}`}    active={filter==="pending"} onClick={() => setFilter("pending")} c="amber"/>
        <FilterChip label={`Distributed · ${distrib}`}active={filter==="distrib"} onClick={() => setFilter("distrib")} c="sage"/>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"70px 110px 1fr 170px 70px 70px 70px 140px",
                     padding:"10px 16px",borderBottom:"1px solid var(--border)",
                     fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:"var(--ink-4)"}}>
          <span>No.</span><span>Date</span><span>Worked</span><span>Hours</span>
          <span>Absent</span><span>Late</span><span>Inj.</span><span>Status</span>
        </div>
        {filtered.map(r => (
          <div key={r.id} onClick={() => onOpen(r)}
               style={{display:"grid",gridTemplateColumns:"70px 110px 1fr 170px 70px 70px 70px 140px",
                       padding:"12px 16px",borderBottom:"1px solid var(--border)",
                       alignItems:"center",fontSize:13,cursor:"pointer",
                       transition:"background .1s"}}
               onMouseEnter={e => e.currentTarget.style.background = "var(--bg-muted)"}
               onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{fontFamily:"var(--font-mono)",fontSize:12,color:"var(--ink-3)"}}>{r.num}</span>
            <span><b style={{fontWeight:500}}>{r.weekday}</b> <span className="muted">{r.date}</span></span>
            <span style={{fontWeight:500}}>{r.scene}</span>
            <span className="mono muted">{r.calls}</span>
            <span className="mono">{r.absences || "—"}</span>
            <span className="mono">{r.late || "—"}</span>
            <span className="mono">{r.injuries || "—"}</span>
            <span><span className="pill" data-c={r.c}><span className="dot"/>{r.status}</span></span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{padding:"40px 0",textAlign:"center",color:"var(--ink-3)"}}>
            No reports match your filters
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick, c }) {
  return (
    <button onClick={onClick}
      style={{appearance:"none",border:"1px solid " + (active ? "var(--border-strong)" : "transparent"),
              background: active ? "var(--bg-elev)" : "transparent",
              boxShadow: active ? "var(--shadow-1)" : "none",
              borderRadius:999,height:28,padding:"0 12px",fontSize:12.5,
              fontWeight: active ? 500 : 400,
              color: active ? "var(--ink)" : "var(--ink-3)",cursor:"pointer"}}>
      {label}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════
// VIEW MODE — read-only
// ════════════════════════════════════════════════════════════════════
function ReportView({ record, onBack, onEdit }) {
  const [section, setSection] = React.useState("notes");
  const visibleDepts = DEPTS.filter(d => CAN_EDIT || !d.restricted);

  return (
    <div className="anim-in" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div className="card card-pad">
        <div className="row" style={{gap:8,marginBottom:8}}>
          <button className="btn ghost" onClick={onBack} style={{padding:"0 8px"}}>
            <RpI.ChevLeft size={14}/><span>All reports</span>
          </button>
          <span className="muted">·</span>
          <span className="pill" data-c={record.list?.c || "sage"}>
            <span className="dot"/>{record.list?.status || "Distributed"}
          </span>
          {!CAN_EDIT && <span className="pill"><RpI.User size={11}/>Cast view</span>}
        </div>
        <div className="row-between">
          <div>
            <div className="h-eyebrow" style={{marginBottom:4}}>Rehearsal Report · {record.num}</div>
            <h2 className="h-section">{record.date}</h2>
            <div className="muted" style={{fontSize:13,marginTop:4}}>
              Rehearsal {record.rehearsal} of {record.of} · The Pirates of Penzance
            </div>
          </div>
          <div className="row" style={{gap:8}}>
            <button className="btn"><RpI.Download size={14}/><span>Export PDF</span></button>
            {CAN_EDIT && <button className="btn primary" onClick={onEdit}><RpI.Pencil size={14}/><span>Edit</span></button>}
          </div>
        </div>
      </div>

      {/* Top summary */}
      <div className="grid grid-3" style={{gap:16}}>
        <SummaryCard title="Call times">
          <div className="row" style={{gap:24,marginBottom:10}}>
            <div>
              <div className="h-eyebrow" style={{marginBottom:4}}>Start</div>
              <div className="mono" style={{fontSize:18,fontWeight:500}}>{record.start}</div>
            </div>
            <div>
              <div className="h-eyebrow" style={{marginBottom:4}}>End</div>
              <div className="mono" style={{fontSize:18,fontWeight:500}}>{record.end}</div>
            </div>
            <div style={{marginLeft:"auto",textAlign:"right"}}>
              <div className="h-eyebrow" style={{marginBottom:4}}>Total</div>
              <div className="mono" style={{fontSize:18,fontWeight:500}}>{record.totalRehearsal}</div>
            </div>
          </div>
          {record.breaks?.length > 0 && record.breaks[0].start !== "—" && (
            <div style={{display:"flex",flexDirection:"column",gap:6,paddingTop:10,borderTop:"1px solid var(--border)"}}>
              <div className="h-eyebrow">Breaks</div>
              {record.breaks.map((b,i) => (
                <div key={i} className="row" style={{gap:8,fontSize:12}}>
                  <span className="mono">{b.start}</span>
                  <span className="muted">→</span>
                  <span className="mono">{b.end}</span>
                  <span className="pill" style={{marginLeft:"auto"}} data-c="sand">{b.kind}</span>
                </div>
              ))}
            </div>
          )}
        </SummaryCard>

        <SummaryCard title="Attendance">
          <div className="grid grid-3" style={{gap:8,marginBottom:10}}>
            <StatBlock n={record.attendance.present} label="Present" c="sage"/>
            <StatBlock n={record.attendance.absent}  label="Absent"  c="amber"/>
            <StatBlock n={record.attendance.late}    label="Late"    c=""/>
          </div>
          {record.attendance.notes?.map((n,i) => (
            <div key={i} className="row" style={{gap:8,padding:"8px 10px",background:"var(--c-amber-soft)",borderRadius:6,marginTop:6}}>
              <RpI.Info size={14}/>
              <div style={{fontSize:12.5}}><b style={{fontWeight:500}}>{n.who}</b><br/><span className="muted">{n.note}</span></div>
            </div>
          ))}
        </SummaryCard>

        <SummaryCard title="Scenes worked">
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {record.scenesWorked.map((s,i) => (
              <div key={i} style={{padding:"10px 12px",background:"var(--bg-sunken)",borderRadius:6}}>
                <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{s.label}</div>
                <div className="row" style={{gap:10,fontSize:12}}>
                  <span className="muted">pp. {s.pages}</span>
                  <span className="muted">·</span>
                  <span className="mono">{s.time}</span>
                </div>
              </div>
            ))}
          </div>
        </SummaryCard>
      </div>

      {/* Bottom subtabs */}
      <div className="card">
        <div style={{display:"flex",borderBottom:"1px solid var(--border)",padding:"0 16px"}}>
          {[
            { id:"notes", label:"Department notes" },
            { id:"sched", label:"Schedule changes" },
            ...(CAN_EDIT ? [{ id:"lines", label:"Line notes" }] : []),
            { id:"injuries", label:"Injuries / incidents" },
          ].map(s => (
            <button key={s.id} className="tab" data-active={section===s.id?"1":"0"} onClick={() => setSection(s.id)}>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        <div style={{padding:20}}>
          {section === "notes" && <DeptNotesView notes={record.notes} depts={visibleDepts}/>}
          {section === "sched" && <ScheduleView changes={record.schedule}/>}
          {section === "lines" && CAN_EDIT && <LineNotesView lines={record.lineNotes}/>}
          {section === "injuries" && <InjuriesView injuries={record.injuries}/>}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, children }) {
  return (
    <div className="card card-pad">
      <h3 className="h-card" style={{marginBottom:10}}>{title}</h3>
      {children}
    </div>
  );
}
function StatBlock({ n, label, c }) {
  const bg = c ? `var(--c-${c}-soft)` : "var(--bg-sunken)";
  const fg = c ? `color-mix(in oklch, var(--c-${c}) 50%, var(--ink))` : "var(--ink)";
  return (
    <div style={{textAlign:"center",padding:"10px 4px",background:bg,borderRadius:6}}>
      <div style={{fontSize:22,fontWeight:600,color:fg}}>{n}</div>
      <div className="h-eyebrow">{label}</div>
    </div>
  );
}

function DeptNotesView({ notes, depts }) {
  return (
    <div className="grid grid-2" style={{gap:14}}>
      {depts.map(d => {
        const Ico = RpI[d.I];
        return (
          <div key={d.key} style={{padding:"14px 16px",border:"1px solid var(--border)",borderRadius:"var(--radius-s)"}}>
            <div className="row" style={{gap:8,marginBottom:8}}>
              <div className="notif-ico" data-c={d.c} style={{width:24,height:24}}><Ico size={13}/></div>
              <b style={{fontSize:13,fontWeight:600}}>{d.label}</b>
            </div>
            <window.RichRender html={notes[d.key]}/>
          </div>
        );
      })}
    </div>
  );
}
function ScheduleView({ changes }) {
  if (!changes?.length) return <Empty icon="Calendar" text="No schedule changes today"/>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {changes.map((s,i) => (
        <div key={i} className="row" style={{gap:12,padding:"12px 14px",background:"var(--bg-sunken)",borderRadius:6}}>
          <span className="pill" data-c={s.c}>{s.who}</span>
          <span style={{fontSize:13}}>{s.what}</span>
        </div>
      ))}
    </div>
  );
}
function LineNotesView({ lines }) {
  if (!lines?.length) return <Empty icon="Pencil" text="No line notes"/>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <div style={{display:"grid",gridTemplateColumns:"160px 220px 1fr",gap:12,padding:"6px 12px",fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:"var(--ink-4)"}}>
        <span>Character</span><span>Line / cue</span><span>Note</span>
      </div>
      {lines.map((l,i) => (
        <div key={i} style={{display:"grid",gridTemplateColumns:"160px 220px 1fr",gap:12,padding:"10px 12px",borderTop:"1px solid var(--border)",fontSize:13,alignItems:"center"}}>
          <b style={{fontWeight:500}}>{l.who}</b>
          <span className="mono muted">{l.line}</span>
          <span>{l.issue}</span>
        </div>
      ))}
    </div>
  );
}
function InjuriesView({ injuries }) {
  if (!injuries?.length) {
    return (
      <div style={{textAlign:"center",padding:"32px 0",color:"var(--ink-3)"}}>
        <RpI.Check size={28} stroke={1.5}/>
        <div style={{marginTop:8,fontSize:14,fontWeight:500,color:"var(--ink-2)"}}>No incidents reported</div>
      </div>
    );
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {injuries.map((inj,i) => (
        <div key={i} className="row" style={{gap:12,padding:"12px 14px",background:"var(--c-amber-soft)",borderRadius:6}}>
          <RpI.Alert size={16}/><span>{inj.text}</span>
        </div>
      ))}
    </div>
  );
}
function Empty({ icon, text }) {
  const Ico = RpI[icon] || RpI.Info;
  return (
    <div style={{textAlign:"center",padding:"32px 0",color:"var(--ink-3)"}}>
      <Ico size={26} stroke={1.5}/>
      <div style={{marginTop:8,fontSize:13.5}}>{text}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// EDIT / CREATE MODE
// ════════════════════════════════════════════════════════════════════
function ReportEditor({ record, onCancel, onSave }) {
  const [r, setR] = React.useState(record);
  const [section, setSection] = React.useState("notes");
  const [savedHint, setSavedHint] = React.useState("");

  const update = (patch) => setR(prev => ({...prev, ...patch}));
  const updateNotes = (key, val) => setR(prev => ({...prev, notes:{...prev.notes,[key]:val}}));

  // autosave hint
  React.useEffect(() => {
    if (r === record) return;
    setSavedHint("Saving…");
    const t = setTimeout(() => setSavedHint("Saved just now"), 600);
    return () => clearTimeout(t);
  }, [r]);

  const isNew = r.isNew;

  return (
    <div className="anim-in" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div className="card card-pad">
        <div className="row" style={{gap:8,marginBottom:8}}>
          <button className="btn ghost" onClick={onCancel} style={{padding:"0 8px"}}>
            <RpI.ChevLeft size={14}/><span>{isNew ? "Cancel" : "Back"}</span>
          </button>
          <span className="muted">·</span>
          <span className="pill" data-c="amber"><span className="dot"/>{isNew ? "New draft" : "Editing"}</span>
          {savedHint && <span className="pill"><RpI.Clock size={11}/>{savedHint}</span>}
        </div>
        <div className="row-between">
          <div>
            <div className="h-eyebrow" style={{marginBottom:4}}>
              {isNew ? "New rehearsal report" : `Rehearsal Report · ${r.num}`}
            </div>
            <h2 className="h-section">{r.date}</h2>
            <div className="muted" style={{fontSize:13,marginTop:4}}>
              Report number {r.num} · Rehearsal {r.rehearsal} of {r.of} · The Pirates of Penzance
            </div>
          </div>
          <div className="row" style={{gap:8}}>
            <button className="btn" onClick={() => onSave(r, false)}>
              <RpI.Check size={14}/><span>Save draft</span>
            </button>
            <button className="btn primary" onClick={() => onSave(r, true)}>
              <RpI.Send size={14}/><span>Distribute</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top editable summary */}
      <div className="grid grid-3" style={{gap:16}}>
        {/* Times + breaks */}
        <div className="card card-pad">
          <h3 className="h-card" style={{marginBottom:10}}>Call times</h3>
          <div className="grid grid-2" style={{gap:10}}>
            <div>
              <div className="label">Start</div>
              <input className="field" value={r.start} onChange={e => update({start:e.target.value})}/>
            </div>
            <div>
              <div className="label">End</div>
              <input className="field" value={r.end} onChange={e => update({end:e.target.value})}/>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <div className="label">Breaks</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {(r.breaks || []).map((b,i) => (
                <div key={i} className="row" style={{gap:6}}>
                  <input className="field" value={b.start} placeholder="Start"
                         onChange={e => update({breaks: r.breaks.map((x,j)=> j===i?{...x,start:e.target.value}:x)})}
                         style={{width:80,fontFamily:"var(--font-mono)",fontSize:12}}/>
                  <input className="field" value={b.end} placeholder="End"
                         onChange={e => update({breaks: r.breaks.map((x,j)=> j===i?{...x,end:e.target.value}:x)})}
                         style={{width:80,fontFamily:"var(--font-mono)",fontSize:12}}/>
                  <select className="field" value={b.kind}
                         onChange={e => update({breaks: r.breaks.map((x,j)=> j===i?{...x,kind:e.target.value}:x)})}
                         style={{flex:1}}>
                    <option>5-min</option><option>10-min</option><option>Meal</option>
                  </select>
                  <button className="btn ghost btn-icon" onClick={() => update({breaks: r.breaks.filter((_,j)=>j!==i)})}>
                    <RpI.X size={13}/>
                  </button>
                </div>
              ))}
              <button className="btn ghost" style={{alignSelf:"flex-start",height:28,padding:"0 10px",fontSize:12}}
                      onClick={() => update({breaks: [...(r.breaks||[]), {start:"",end:"",kind:"10-min"}]})}>
                <RpI.Plus size={12}/><span>Add break</span>
              </button>
            </div>
          </div>
        </div>

        {/* Attendance */}
        <div className="card card-pad">
          <h3 className="h-card" style={{marginBottom:10}}>Attendance</h3>
          <div className="grid grid-3" style={{gap:8,marginBottom:10}}>
            <NumberStat value={r.attendance.present} label="Present" c="sage"
              onChange={v => update({attendance:{...r.attendance,present:v}})}/>
            <NumberStat value={r.attendance.absent} label="Absent" c="amber"
              onChange={v => update({attendance:{...r.attendance,absent:v}})}/>
            <NumberStat value={r.attendance.late} label="Late" c=""
              onChange={v => update({attendance:{...r.attendance,late:v}})}/>
          </div>
          <div className="label" style={{marginTop:6}}>Notes</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {(r.attendance.notes || []).map((n,i) => (
              <div key={i} className="row" style={{gap:6}}>
                <input className="field" value={n.who} placeholder="Who"
                       onChange={e => update({attendance:{...r.attendance, notes: r.attendance.notes.map((x,j)=> j===i?{...x,who:e.target.value}:x)}})}
                       style={{width:160,fontSize:12.5}}/>
                <input className="field" value={n.note} placeholder="Excused, vocal rest…"
                       onChange={e => update({attendance:{...r.attendance, notes: r.attendance.notes.map((x,j)=> j===i?{...x,note:e.target.value}:x)}})}
                       style={{flex:1,fontSize:12.5}}/>
                <button className="btn ghost btn-icon"
                        onClick={() => update({attendance:{...r.attendance, notes: r.attendance.notes.filter((_,j)=>j!==i)}})}>
                  <RpI.X size={13}/>
                </button>
              </div>
            ))}
            <button className="btn ghost" style={{alignSelf:"flex-start",height:28,padding:"0 10px",fontSize:12}}
                    onClick={() => update({attendance:{...r.attendance, notes:[...(r.attendance.notes||[]),{who:"",note:"",c:"amber"}]}})}>
              <RpI.Plus size={12}/><span>Add note</span>
            </button>
          </div>
        </div>

        {/* Scenes worked */}
        <div className="card card-pad">
          <h3 className="h-card" style={{marginBottom:10}}>Scenes worked</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {(r.scenesWorked || []).map((s,i) => (
              <div key={i} style={{padding:"10px 12px",background:"var(--bg-sunken)",borderRadius:6,position:"relative"}}>
                <input className="field" value={s.label} placeholder="Act II, Sc. 1 — Title"
                       onChange={e => update({scenesWorked: r.scenesWorked.map((x,j)=> j===i?{...x,label:e.target.value}:x)})}
                       style={{border:0,padding:0,background:"transparent",fontSize:13,fontWeight:500,marginBottom:4}}/>
                <div className="row" style={{gap:8}}>
                  <input className="field" value={s.pages} placeholder="42–48"
                         onChange={e => update({scenesWorked: r.scenesWorked.map((x,j)=> j===i?{...x,pages:e.target.value}:x)})}
                         style={{width:80,fontSize:12,fontFamily:"var(--font-mono)"}}/>
                  <input className="field" value={s.time} placeholder="55m"
                         onChange={e => update({scenesWorked: r.scenesWorked.map((x,j)=> j===i?{...x,time:e.target.value}:x)})}
                         style={{width:80,fontSize:12,fontFamily:"var(--font-mono)"}}/>
                  <button className="btn ghost btn-icon" style={{marginLeft:"auto"}}
                          onClick={() => update({scenesWorked: r.scenesWorked.filter((_,j)=>j!==i)})}>
                    <RpI.X size={13}/>
                  </button>
                </div>
              </div>
            ))}
            <button className="btn ghost" style={{alignSelf:"flex-start",height:28,padding:"0 10px",fontSize:12}}
                    onClick={() => update({scenesWorked: [...(r.scenesWorked||[]), {label:"",pages:"",time:""}]})}>
              <RpI.Plus size={12}/><span>Add scene</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom subtabs — editable */}
      <div className="card">
        <div style={{display:"flex",borderBottom:"1px solid var(--border)",padding:"0 16px"}}>
          {[
            { id:"notes", label:"Department notes", count: Object.values(r.notes||{}).filter(Boolean).length },
            { id:"sched", label:"Schedule changes", count: r.schedule?.length || 0 },
            { id:"lines", label:"Line notes",       count: r.lineNotes?.length || 0 },
            { id:"injuries", label:"Injuries / incidents", count: r.injuries?.length || 0 },
          ].map(s => (
            <button key={s.id} className="tab" data-active={section===s.id?"1":"0"} onClick={() => setSection(s.id)}>
              <span>{s.label}</span>
              {s.count > 0 && <span className="count">{s.count}</span>}
            </button>
          ))}
        </div>
        <div style={{padding:20}}>
          {section === "notes" && <DeptNotesEditor notes={r.notes} onChange={updateNotes}/>}
          {section === "sched" && <ScheduleEditor schedule={r.schedule||[]}
                                                  onChange={s => update({schedule:s})}/>}
          {section === "lines" && <LineNotesEditor lines={r.lineNotes||[]}
                                                   onChange={l => update({lineNotes:l})}/>}
          {section === "injuries" && <InjuriesEditor injuries={r.injuries||[]}
                                                     onChange={inj => update({injuries:inj})}/>}
        </div>
      </div>
    </div>
  );
}

function NumberStat({ value, label, c, onChange }) {
  const bg = c ? `var(--c-${c}-soft)` : "var(--bg-sunken)";
  const fg = c ? `color-mix(in oklch, var(--c-${c}) 50%, var(--ink))` : "var(--ink)";
  return (
    <div style={{textAlign:"center",padding:"10px 4px",background:bg,borderRadius:6}}>
      <input value={value} onChange={e => onChange(parseInt(e.target.value)||0)}
             style={{width:"100%",border:0,background:"transparent",textAlign:"center",
                     fontSize:22,fontWeight:600,color:fg,fontVariantNumeric:"tabular-nums",
                     fontFamily:"inherit",outline:"none",padding:0}}/>
      <div className="h-eyebrow">{label}</div>
    </div>
  );
}

function DeptNotesEditor({ notes, onChange }) {
  const visibleDepts = DEPTS;
  const [editing, setEditing] = React.useState(null); // dept key

  const editingDept = visibleDepts.find(d => d.key === editing);

  return (
    <React.Fragment>
      <div className="grid grid-2" style={{gap:14}}>
        {visibleDepts.map(d => {
          const Ico = RpI[d.I];
          const text = notes[d.key];
          const empty = !text || !text.trim();
          return (
            <div key={d.key}
              onClick={() => setEditing(d.key)}
              className="dept-note-card"
              style={{padding:"14px 16px",border:"1px solid var(--border)",borderRadius:"var(--radius-s)",
                      cursor:"pointer", position:"relative", minHeight:108,
                      transition:"border-color .12s, background .12s, box-shadow .12s"}}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.boxShadow = "var(--shadow-1)";
                const exp = e.currentTarget.querySelector(".dept-note-edit-hint");
                if (exp) exp.style.opacity = "1";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
                const exp = e.currentTarget.querySelector(".dept-note-edit-hint");
                if (exp) exp.style.opacity = "0";
              }}>
              <div className="row" style={{gap:8,marginBottom:8}}>
                <div className="notif-ico" data-c={d.c} style={{width:24,height:24}}><Ico size={13}/></div>
                <b style={{fontSize:13,fontWeight:600}}>{d.label}</b>
                {d.restricted && <span className="pill" style={{marginLeft:"auto",fontSize:10}}>SM only</span>}
                <span className="dept-note-edit-hint"
                  style={{marginLeft: d.restricted ? 6 : "auto", opacity:0, transition:"opacity .12s",
                          color:"var(--ink-3)", display:"inline-flex", alignItems:"center", gap:4, fontSize:11}}>
                  <RpI.Pencil size={11}/><span>Edit</span>
                </span>
              </div>
              {empty
                ? <div style={{fontSize:13,lineHeight:1.55,color:"var(--ink-4)",fontStyle:"italic"}}>
                    Click to add notes for {d.label.toLowerCase()}…
                  </div>
                : <window.RichRender html={text}/>}
            </div>
          );
        })}
      </div>

      <window.RichEditorModal
        open={!!editing}
        title={editingDept?.label || ""}
        subtitle="Department note"
        accentColor={editingDept?.c}
        value={editing ? notes[editing] : ""}
        onSave={(html) => { onChange(editing, html); setEditing(null); }}
        onClose={() => setEditing(null)}
      />
    </React.Fragment>
  );
}

function ScheduleEditor({ schedule, onChange }) {
  const update = (i, patch) => onChange(schedule.map((s,j) => j===i ? {...s,...patch} : s));
  const add = () => onChange([...schedule, {who:"Costume", what:"", c:"clay"}]);
  const remove = (i) => onChange(schedule.filter((_,j) => j!==i));
  const deptOpts = DEPTS.filter(d => !d.restricted).map(d => ({value:d.label.split(" /")[0], c:d.c}));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {schedule.map((s,i) => (
        <div key={i} className="row" style={{gap:8,padding:"10px 12px",background:"var(--bg-sunken)",borderRadius:6}}>
          <select className="field" value={s.who} onChange={e => {
            const opt = deptOpts.find(o => o.value === e.target.value);
            update(i, {who:e.target.value, c: opt?.c || ""});
          }} style={{width:140}}>
            {deptOpts.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
          </select>
          <input className="field" value={s.what} placeholder="What changed"
                 onChange={e => update(i, {what:e.target.value})} style={{flex:1}}/>
          <button className="btn ghost btn-icon" onClick={() => remove(i)}><RpI.X size={13}/></button>
        </div>
      ))}
      <button className="btn ghost" style={{alignSelf:"flex-start"}} onClick={add}>
        <RpI.Plus size={14}/><span>Add change</span>
      </button>
      {schedule.length === 0 && <div className="muted" style={{fontSize:13,padding:"8px 0"}}>No schedule changes yet.</div>}
    </div>
  );
}

function LineNotesEditor({ lines, onChange }) {
  const update = (i, patch) => onChange(lines.map((s,j) => j===i ? {...s,...patch} : s));
  const add = () => onChange([...lines, {who:"", line:"", issue:""}]);
  const remove = (i) => onChange(lines.filter((_,j) => j!==i));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <div style={{display:"grid",gridTemplateColumns:"160px 220px 1fr 32px",gap:8,padding:"6px 12px",fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:"var(--ink-4)"}}>
        <span>Character</span><span>Line / cue</span><span>Note</span><span></span>
      </div>
      {lines.map((l,i) => (
        <div key={i} style={{display:"grid",gridTemplateColumns:"160px 220px 1fr 32px",gap:8,padding:"4px 12px",alignItems:"center"}}>
          <input className="field" value={l.who} placeholder="Frederic"
                 onChange={e => update(i, {who:e.target.value})}/>
          <input className="field" value={l.line} placeholder='"…line text"' style={{fontFamily:"var(--font-mono)",fontSize:12}}
                 onChange={e => update(i, {line:e.target.value})}/>
          <input className="field" value={l.issue} placeholder="Paraphrased / dropped / clean"
                 onChange={e => update(i, {issue:e.target.value})}/>
          <button className="btn ghost btn-icon" onClick={() => remove(i)}><RpI.X size={13}/></button>
        </div>
      ))}
      <button className="btn ghost" style={{alignSelf:"flex-start",marginTop:4}} onClick={add}>
        <RpI.Plus size={14}/><span>Add line note</span>
      </button>
      {lines.length === 0 && <div className="muted" style={{fontSize:13,padding:"8px 12px"}}>No line notes yet.</div>}
    </div>
  );
}

function InjuriesEditor({ injuries, onChange }) {
  const update = (i, patch) => onChange(injuries.map((s,j) => j===i ? {...s,...patch} : s));
  const add = () => onChange([...injuries, {who:"", text:"", time:""}]);
  const remove = (i) => onChange(injuries.filter((_,j) => j!==i));

  if (injuries.length === 0) {
    return (
      <div style={{textAlign:"center",padding:"24px 0"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 16px",background:"var(--c-sage-soft)",borderRadius:8,fontSize:13}}>
          <RpI.Check size={14}/>
          <span>No incidents reported. </span>
          <button className="btn ghost" onClick={add} style={{height:24,padding:"0 8px",fontSize:12,color:"var(--accent)"}}>
            Log an incident
          </button>
        </div>
      </div>
    );
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {injuries.map((inj,i) => (
        <div key={i} style={{padding:"12px 14px",background:"var(--c-amber-soft)",borderRadius:6,display:"flex",flexDirection:"column",gap:8}}>
          <div className="row" style={{gap:8}}>
            <input className="field" value={inj.who} placeholder="Person"
                   onChange={e => update(i, {who:e.target.value})} style={{width:200}}/>
            <input className="field" value={inj.time} placeholder="Time"
                   onChange={e => update(i, {time:e.target.value})} style={{width:120,fontFamily:"var(--font-mono)"}}/>
            <button className="btn ghost btn-icon" style={{marginLeft:"auto"}} onClick={() => remove(i)}>
              <RpI.X size={13}/>
            </button>
          </div>
          <textarea className="field" value={inj.text} placeholder="Description, treatment, follow-up…"
                    onChange={e => update(i, {text:e.target.value})} style={{minHeight:60}}/>
        </div>
      ))}
      <button className="btn ghost" style={{alignSelf:"flex-start"}} onClick={add}>
        <RpI.Plus size={14}/><span>Add incident</span>
      </button>
    </div>
  );
}

window.TabReports = TabReports;
