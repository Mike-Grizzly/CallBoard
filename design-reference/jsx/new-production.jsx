// New Production setup wizard — 6 steps from blank slate to launched show.
//
// Step 1  · Basics       — title, venue, type, season
// Step 2  · Calendar     — key dates (first rehearsal, tech, opening, closing)
// Step 3  · Departments  — which functional areas this show needs
// Step 4  · Roles        — characters in the play
// Step 5  · Team         — invite stage management + creative + cast
// Step 6  · Review       — confirm + launch

const { I } = window;

const STEPS = [
  { id:"basics",   no:"01", label:"Production basics",  hint:"Title, venue, season" },
  { id:"calendar", no:"02", label:"Key dates",          hint:"Tech, opening, closing" },
  { id:"depts",    no:"03", label:"Departments",        hint:"Which teams this show needs" },
  { id:"roles",    no:"04", label:"Roles & characters", hint:"The cast list for this show" },
  { id:"team",     no:"05", label:"Invite your team",   hint:"Stage management, creative, cast" },
  { id:"review",   no:"06", label:"Review & launch",    hint:"Confirm and create" },
];

// Mock org-level user directory — people previously added to this org
// who can be auto-suggested when typing actor names.
const ORG_USERS = [
  { name:"Theo Marsh",      email:"theo.marsh@example.com",      lastIn:"Into the Woods (2024)" },
  { name:"Priya Anand",     email:"priya@example.com",            lastIn:"Carousel (2025)" },
  { name:"Marcus Beale",    email:"marcus.beale@example.com",     lastIn:"Anything Goes (2025)" },
  { name:"Walter Ek",       email:"wek@example.com",              lastIn:"H.M.S. Pinafore (2024)" },
  { name:"Adaeze Ife",      email:"adaeze.i@example.com",          lastIn:"The Mikado (2023)" },
  { name:"Helena Voss",     email:"helena.voss@example.com",       lastIn:"Carousel (2025)" },
  { name:"Maya Okafor",     email:"maya@example.com",              lastIn:"Carousel (2025)" },
  { name:"Renaud Tremblay", email:"renaud.t@example.com",          lastIn:"H.M.S. Pinafore (2024)" },
  { name:"Sergei Karavaev", email:"sergei.k@example.com",          lastIn:"Anything Goes (2025)" },
  { name:"Quinn Adler",     email:"quinn.adler@example.com",       lastIn:"Into the Woods (2024)" },
  { name:"Imani Brooks",    email:"imani.brooks@example.com",      lastIn:"The Mikado (2023)" },
  { name:"Eli Hartman",     email:"eli.hartman@example.com",       lastIn:"Carousel (2025)" },
  { name:"Sasha Petrov",    email:"sasha.p@example.com",           lastIn:"Anything Goes (2025)" },
  { name:"June Castellanos",email:"june.c@example.com",            lastIn:"Into the Woods (2024)" },
];

const ALL_DEPTS = [
  { key:"director",  label:"Director / Production", hint:"Always on",                  c:"accent", I:"Star",      required:true },
  { key:"stage",     label:"Stage Management",      hint:"You & your team",            c:"",       I:"Clipboard", required:true },
  { key:"music",     label:"Music",                 hint:"MD, accompanist, orchestra", c:"plum",   I:"Music" },
  { key:"costumes",  label:"Costumes / Wardrobe",   hint:"Designer, dresser, build",   c:"clay",   I:"Tag" },
  { key:"props",     label:"Props",                 hint:"Master, build, run crew",    c:"sand",   I:"Layers" },
  { key:"set",       label:"Set / Scenic",          hint:"Designer, build, paint",     c:"sage",   I:"Layout" },
  { key:"lighting",  label:"Lighting",              hint:"Designer, board op",         c:"amber",  I:"Lightbulb" },
  { key:"sound",     label:"Sound",                 hint:"Designer, engineer, A2",     c:"dusk",   I:"Volume" },
  { key:"choreo",    label:"Choreography",          hint:"Choreographer, dance captain", c:"plum", I:"Move" },
  { key:"intimacy",  label:"Intimacy / Fight",      hint:"Direction & captain",        c:"clay",   I:"Users" },
  { key:"dramaturgy",label:"Dramaturgy",            hint:"Research, program notes",    c:"sand",   I:"Pencil" },
  { key:"casting",   label:"Casting / Producing",   hint:"Producer, GM, casting",      c:"dusk",   I:"Users" },
];

const SEED_ROLES_BY_TEMPLATE = {
  musical:  [{ name:"Lead", type:"Principal" }, { name:"Featured", type:"Principal" }, { name:"Ensemble", type:"Ensemble" }],
  straight: [{ name:"Lead", type:"Principal" }, { name:"Supporting", type:"Principal" }],
  opera:    [{ name:"Soprano", type:"Principal" }, { name:"Tenor", type:"Principal" }, { name:"Chorus", type:"Ensemble" }],
  workshop: [{ name:"Reader 1", type:"Principal" }, { name:"Reader 2", type:"Principal" }],
  concert:  [{ name:"Performer", type:"Principal" }],
  custom:   [],
};

const SEED_TEAM = [
  { name:"", email:"", role:"Director",        dept:"director", c:"accent" },
  { name:"", email:"", role:"Stage Manager",   dept:"stage",    c:"" },
  { name:"", email:"", role:"Music Director",  dept:"music",    c:"plum" },
];

const ROLE_TYPES = ["Principal", "Supporting", "Ensemble", "Dance Core", "Swing/Cover"];
const TEAM_ROLES = [
  { label:"Director", dept:"director", c:"accent" },
  { label:"Assoc. Director", dept:"director", c:"accent" },
  { label:"Stage Manager", dept:"stage", c:"" },
  { label:"Asst. Stage Manager", dept:"stage", c:"" },
  { label:"Production Assistant", dept:"stage", c:"" },
  { label:"Producer", dept:"casting", c:"dusk" },
  { label:"Music Director", dept:"music", c:"plum" },
  { label:"Conductor", dept:"music", c:"plum" },
  { label:"Choreographer", dept:"choreo", c:"plum" },
  { label:"Costume Designer", dept:"costumes", c:"clay" },
  { label:"Lighting Designer", dept:"lighting", c:"amber" },
  { label:"Sound Designer", dept:"sound", c:"dusk" },
  { label:"Set Designer", dept:"set", c:"sage" },
  { label:"Props Master", dept:"props", c:"sand" },
  { label:"Cast — Principal", dept:"cast", c:"clay" },
  { label:"Cast — Ensemble", dept:"cast", c:"plum" },
];

// ─── Top-level wizard ─────────────────────────────────────────────────
// Supports two modes:
//   mode="page"    — standalone full-page setup (own top bar, links to exit)
//   mode="overlay" — embedded in CallBoard as a full-screen overlay
//                    (host provides exit chrome via onClose)
function NewProduction({ mode = "page", onClose, onLaunch }) {
  const overlay = mode === "overlay";
  const [stepIdx, setStepIdx] = React.useState(0);
  const [data, setData] = React.useState({
    title: "",
    venue: "",
    season: "Spring 2026",
    firstRehearsal: "",
    techStart: "",
    opening: "",
    closing: "",
    rehearsalDays: { Mon:true, Tue:true, Wed:true, Thu:true, Fri:true, Sat:true, Sun:false },
    rehearsalStart: "7:00 PM",
    rehearsalEnd: "10:30 PM",
    depts: { director:true, stage:true, music:true, costumes:true, props:true, set:true, lighting:true, sound:true, choreo:false, intimacy:false, dramaturgy:false, casting:false },
    roles: [],
    team: [],
  });
  const [launched, setLaunched] = React.useState(false);

  const set = (patch) => setData(prev => ({...prev, ...patch}));
  const step = STEPS[stepIdx];

  const goNext = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
    else {
      setLaunched(true);
      if (overlay && onLaunch) setTimeout(() => onLaunch(data), 1800);
    }
  };
  const goPrev = () => stepIdx > 0 && setStepIdx(stepIdx - 1);

  // Seed roles + team once
  React.useEffect(() => {
    if (data.roles.length === 0) {
      set({ roles: [
        { id:"r1", name:"", actor:"", type:"Principal" },
        { id:"r2", name:"", actor:"", type:"Principal" },
        { id:"r3", name:"", actor:"", type:"Ensemble" },
      ]});
    }
    if (data.team.length === 0) {
      set({ team: SEED_TEAM.map((t,i) => ({...t, id:`t${Date.now()}-${i}`})) });
    }
  }, []);

  if (launched) return <LaunchScreen data={data} overlay={overlay} onDone={onLaunch}/>;

  return (
    <div className="app" data-mode={mode}>
      <NPTopBar overlay={overlay} onClose={onClose}/>
      <div className="body">
        <NPRail stepIdx={stepIdx} setStepIdx={setStepIdx}/>
        <div className="main">
          <div key={step.id} className="anim-in">
            <div className="crumb">Step {step.no} of 06</div>
            {step.id === "basics"   && <StepBasics data={data} set={set}/>}
            {step.id === "calendar" && <StepCalendar data={data} set={set}/>}
            {step.id === "depts"    && <StepDepts data={data} set={set}/>}
            {step.id === "roles"    && <StepRoles data={data} set={set}/>}
            {step.id === "team"     && <StepTeam data={data} set={set}/>}
            {step.id === "review"   && <StepReview data={data} set={set} jumpTo={setStepIdx}/>}
          </div>
          <Actions stepIdx={stepIdx} onPrev={goPrev} onNext={goNext} canNext={canAdvance(data, step.id)}/>
        </div>
      </div>
    </div>
  );
}

function canAdvance(data, stepId) {
  if (stepId === "basics") return data.title.trim().length > 0;
  if (stepId === "calendar") return true; // dates optional but recommended
  if (stepId === "depts") return true;
  if (stepId === "roles") return true;
  if (stepId === "team") return true;
  return true;
}

// ─── Chrome ───────────────────────────────────────────────────────────
function NPTopBar({ overlay, onClose }) {
  if (overlay) {
    return (
      <div className="topbar overlay">
        <button className="back-link" onClick={onClose}>
          <I.ChevLeft size={14}/><span>Back to productions</span>
        </button>
        <div className="brand" style={{marginLeft:"auto"}}>
          <div className="brand-mark">C</div>
          <span>New production</span>
        </div>
        <button className="btn ghost icon-only sm" onClick={onClose} title="Close (Esc)"
                style={{marginLeft:14}}>
          <I.X size={14}/>
        </button>
      </div>
    );
  }
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">C</div>
        <span>CallBoard</span>
      </div>
      <div className="top-crumbs">
        <I.ChevRight size={12}/>
        <a href="CallBoard.html">Productions</a>
        <I.ChevRight size={12}/>
        <span style={{color:"var(--ink)"}}>New production</span>
      </div>
      <a className="top-exit" href="CallBoard.html" title="Exit setup">
        <I.X size={14}/><span>Save & exit</span>
      </a>
    </div>
  );
}

function NPRail({ stepIdx, setStepIdx }) {
  return (
    <aside className="rail">
      <h1>Set up your production.</h1>
      <div className="rail-sub">Six quick steps. You can edit everything later.</div>
      <div className="steps">
        {STEPS.map((s, i) => (
          <div key={s.id}
               className={"step " + (i === stepIdx ? "active" : i < stepIdx ? "done" : "")}
               onClick={() => setStepIdx(i)}>
            <div className="step-no">
              {i < stepIdx ? <I.Check size={12} stroke={2.5}/> : s.no}
            </div>
            <div>
              <div className="step-label">{s.label}</div>
              <div className="step-hint">{s.hint}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="rail-foot">
        <b>Tip</b>
        Need to invite cast later? You can send invite links from the Team page any time.
      </div>
    </aside>
  );
}

function Actions({ stepIdx, onPrev, onNext, canNext }) {
  const last = stepIdx === STEPS.length - 1;
  return (
    <div className="actions">
      <button className="btn ghost" onClick={onPrev} disabled={stepIdx === 0}
              style={{opacity: stepIdx === 0 ? .4 : 1}}>
        <I.ChevLeft size={14}/><span>Back</span>
      </button>
      <span className="progress-tag">{String(stepIdx+1).padStart(2,"0")} / 06</span>
      <div className="spacer"/>
      <button className="btn ghost" onClick={onNext}>Save draft</button>
      <button className={"btn " + (last ? "accent" : "primary")} onClick={onNext} disabled={!canNext}
              style={{opacity: canNext ? 1 : .4}}>
        <span>{last ? "Launch production" : "Continue"}</span>
        {!last && <I.ChevRight size={14}/>}
      </button>
    </div>
  );
}

// ─── STEP 1 · Basics ──────────────────────────────────────────────────
function StepBasics({ data, set }) {
  return (
    <React.Fragment>
      <h2 className="page-title">Tell us about your show.</h2>
      <div className="page-sub">
        Just the essentials — we'll use this for naming on reports, call sheets, and your season archive.
      </div>

      <div className="grid grid-2">
        <div className="field-group" style={{gridColumn:"1 / -1"}}>
          <label className="label">Title<span className="req">*</span></label>
          <input className="field lg" value={data.title} placeholder="e.g. The Pirates of Penzance"
                 onChange={e => set({title: e.target.value})} autoFocus/>
        </div>
        <div className="field-group">
          <label className="label">Venue</label>
          <input className="field" value={data.venue} placeholder="e.g. Wellman Theatre"
                 onChange={e => set({venue: e.target.value})}/>
          <div className="hint">Where you'll perform. You can add rehearsal rooms later.</div>
        </div>
        <div className="field-group">
          <label className="label">Season</label>
          <select className="field" value={data.season} onChange={e => set({season: e.target.value})}>
            <option>Spring 2026</option>
            <option>Summer 2026</option>
            <option>Fall 2026</option>
            <option>Winter 2026</option>
            <option>2026–2027 Mainstage</option>
            <option>One-off</option>
          </select>
          <div className="hint">Used to group productions in your archive.</div>
        </div>
      </div>
    </React.Fragment>
  );
}

// ─── STEP 2 · Calendar ────────────────────────────────────────────────
function StepCalendar({ data, set }) {
  return (
    <React.Fragment>
      <h2 className="page-title">When does this happen?</h2>
      <div className="page-sub">
        These dates power your dashboard countdown, default call windows, and rehearsal-day naming.
        You can adjust them any time — we'll update everything downstream.
      </div>

      <div className="banner">
        <I.Info size={16}/>
        <div>
          <b style={{fontWeight:600}}>Only opening night is required.</b> Everything else can be set later, but adding them now lets CallBoard plan ahead — flag conflicts, schedule auto-reminders, and structure your default rehearsal calendar.
        </div>
      </div>

      <div className="grid grid-2">
        <div className="field-group">
          <label className="label">First rehearsal</label>
          <input className="field" type="date" value={data.firstRehearsal}
                 onChange={e => set({firstRehearsal: e.target.value})}/>
        </div>
        <div className="field-group">
          <label className="label">Tech week starts</label>
          <input className="field" type="date" value={data.techStart}
                 onChange={e => set({techStart: e.target.value})}/>
        </div>
        <div className="field-group">
          <label className="label">Opening night<span className="req">*</span></label>
          <input className="field" type="date" value={data.opening}
                 onChange={e => set({opening: e.target.value})}/>
        </div>
        <div className="field-group">
          <label className="label">Closing</label>
          <input className="field" type="date" value={data.closing}
                 onChange={e => set({closing: e.target.value})}/>
        </div>
      </div>

      <h3 className="sec" style={{marginTop:36}}>Default rehearsal pattern</h3>
      <div className="field-group" style={{marginBottom:18}}>
        <label className="label">Which days of the week do you rehearse?</label>
        <div className="day-picker">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
            <button key={d} type="button"
              className="day-chip" data-on={data.rehearsalDays[d] ? "1" : "0"}
              onClick={() => set({rehearsalDays: {...data.rehearsalDays, [d]: !data.rehearsalDays[d]}})}>
              {d}
            </button>
          ))}
        </div>
        <div className="hint">
          {Object.values(data.rehearsalDays).filter(Boolean).length} days/week selected.
          Tap any day to toggle.
        </div>
      </div>
      <div className="grid grid-2">
        <div className="field-group">
          <label className="label">Typical start</label>
          <input className="field" value={data.rehearsalStart}
                 onChange={e => set({rehearsalStart: e.target.value})}/>
        </div>
        <div className="field-group">
          <label className="label">Typical end</label>
          <input className="field" value={data.rehearsalEnd}
                 onChange={e => set({rehearsalEnd: e.target.value})}/>
        </div>
      </div>
      <div className="hint" style={{marginTop:8}}>Used to pre-fill call times when creating reports — overridden per day.</div>
    </React.Fragment>
  );
}

// ─── STEP 3 · Departments ─────────────────────────────────────────────
function StepDepts({ data, set }) {
  const toggle = (key) => {
    if (ALL_DEPTS.find(d => d.key === key)?.required) return;
    set({ depts: {...data.depts, [key]: !data.depts[key]} });
  };
  const onCount = Object.values(data.depts).filter(Boolean).length;
  return (
    <React.Fragment>
      <h2 className="page-title">Which departments are active?</h2>
      <div className="page-sub">
        Turn on the teams this production needs. Each enabled department gets its own
        section in rehearsal reports, document folder, and a notification channel.
      </div>

      <h3 className="sec">Departments <span className="count">{onCount} active</span></h3>
      <div className="dept-grid">
        {ALL_DEPTS.map(d => {
          const Ico = I[d.I] || I.Star;
          const on = data.depts[d.key];
          return (
            <div key={d.key} className="dept-card" data-on={on ? "1" : "0"}
                 onClick={() => toggle(d.key)}>
              <div className="dept-ico" style={{
                background: on ? `var(--c-${d.c}-soft, var(--bg-sunken))` : "var(--bg-sunken)",
                color: on && d.c ? `color-mix(in oklch, var(--c-${d.c}) 45%, var(--ink))` : "var(--ink-3)"
              }}>
                <Ico size={16}/>
              </div>
              <div className="dept-meta">
                <b>{d.label}{d.required && <span style={{color:"var(--ink-4)",fontWeight:400,marginLeft:6,fontSize:11}}>· required</span>}</b>
                <span>{d.hint}</span>
              </div>
              <div className="dept-toggle"/>
            </div>
          );
        })}
      </div>

      <div className="banner" style={{marginTop:28}}>
        <I.Info size={16}/>
        <div>
          Don't worry about getting this perfect — you can add or remove departments
          later from <b>Settings → Departments</b>. Disabled departments just disappear
          from the report form and team filters.
        </div>
      </div>
    </React.Fragment>
  );
}

// ─── STEP 4 · Roles / Characters ──────────────────────────────────────
function StepRoles({ data, set }) {
  const update = (i, patch) => set({ roles: data.roles.map((r,j) => j===i ? {...r,...patch} : r) });
  const remove = (i) => set({ roles: data.roles.filter((_,j) => j!==i) });
  const add = () => set({ roles: [...data.roles, { id:`r${Date.now()}`, name:"", actor:"", type:"Principal" }] });

  const [bulk, setBulk] = React.useState("");
  const applyBulk = () => {
    const lines = bulk.split("\n").map(l => l.trim()).filter(Boolean);
    const parsed = lines.map((line,i) => {
      const parts = line.split(/[,—|\t]+/).map(s => s.trim());
      return { id:`r${Date.now()}-${i}`, name: parts[0] || "", actor: parts[1] || "", type: parts[2] || "Principal" };
    });
    set({ roles: [...data.roles, ...parsed] });
    setBulk("");
  };

  return (
    <React.Fragment>
      <h2 className="page-title">Cast list & characters.</h2>
      <div className="page-sub">
        Add the roles in your show. You can leave actor names blank for now and assign them
        later as you cast — or invite cast directly in the next step and they'll show up here automatically.
      </div>

      <h3 className="sec">Roles <span className="count">{data.roles.length}</span></h3>

      <div className="row-list">
        <div className="row-header role-row">
          <span>Character / role</span>
          <span>Actor (optional)</span>
          <span>Type</span>
          <span></span>
        </div>
        {data.roles.map((r,i) => (
          <div key={r.id} className="row-item role-row">
            <input className="field" value={r.name} placeholder="Frederic"
                   onChange={e => update(i, {name: e.target.value})}/>
            <ActorAutocomplete value={r.actor} onChange={(val) => update(i, {actor: val})}/>
            <select className="field" value={r.type} onChange={e => update(i, {type: e.target.value})}>
              {ROLE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <button className="btn ghost icon-only sm delete" onClick={() => remove(i)} title="Remove">
              <I.Trash size={12}/>
            </button>
          </div>
        ))}
        <button className="add-btn" onClick={add}>
          <I.Plus size={14}/><span>Add a role</span>
        </button>
      </div>

      <details className="bulk">
        <summary>Paste a cast list to import several at once</summary>
        <div className="bulk-body">
          <div className="hint" style={{margin:"4px 0 10px"}}>
            One per line — <span className="mono">Character, Actor, Type</span> (commas, tabs, or dashes work).
            Actor and type are optional.
          </div>
          <textarea className="field" value={bulk} placeholder={"Frederic, Theo Marsh, Principal\nMabel, Priya Anand, Principal\nPirate King, Marcus Beale, Principal\nDaughter chorus, , Ensemble"}
                    onChange={e => setBulk(e.target.value)}/>
          <button className="btn sm primary" style={{marginTop:10}} onClick={applyBulk} disabled={!bulk.trim()}>
            <I.Plus size={12}/><span>Import {bulk.split("\n").filter(l => l.trim()).length || 0} role{bulk.split("\n").filter(l => l.trim()).length === 1 ? "" : "s"}</span>
          </button>
        </div>
      </details>
    </React.Fragment>
  );
}

// ─── Actor autocomplete — typeahead over org users ────────────────────
function ActorAutocomplete({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const wrapRef = React.useRef(null);

  const matches = React.useMemo(() => {
    if (!value || !value.trim()) return [];
    const q = value.toLowerCase().trim();
    return ORG_USERS
      .filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 6);
  }, [value]);

  // Close on outside click
  React.useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (u) => { onChange(u.name); setOpen(false); };

  return (
    <div ref={wrapRef} style={{position:"relative"}}>
      <input className="field" value={value} placeholder="Theo Marsh"
        onChange={e => { onChange(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (!open || matches.length === 0) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a+1, matches.length-1)); }
          if (e.key === "ArrowUp")   { e.preventDefault(); setActive(a => Math.max(a-1, 0)); }
          if (e.key === "Enter")     { e.preventDefault(); pick(matches[active]); }
          if (e.key === "Escape")    { setOpen(false); }
        }}/>
      {open && matches.length > 0 && (
        <div className="ac-pop">
          <div className="ac-head">From your org</div>
          {matches.map((u,i) => (
            <div key={u.email} className="ac-item" data-active={i===active?"1":"0"}
              onMouseDown={e => { e.preventDefault(); pick(u); }}
              onMouseEnter={() => setActive(i)}>
              <div className="av" style={{background:"var(--c-dusk)", width:24, height:24, fontSize:10}}>
                {u.name.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase()}
              </div>
              <div style={{flex:1, minWidth:0, overflow:"hidden"}}>
                <div style={{fontSize:13, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{u.name}</div>
                <div style={{fontSize:11, color:"var(--ink-4)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>last in {u.lastIn}</div>
              </div>
            </div>
          ))}
          <div className="ac-foot">↑↓ to navigate · ↵ to select</div>
        </div>
      )}
    </div>
  );
}

// ─── STEP 5 · Team / Invites ──────────────────────────────────────────
function StepTeam({ data, set }) {
  const update = (i, patch) => set({ team: data.team.map((r,j) => j===i ? {...r,...patch} : r) });
  const remove = (i) => set({ team: data.team.filter((_,j) => j!==i) });
  const add = (role) => {
    const r = role || { label:"Stage Manager", dept:"stage", c:"" };
    set({ team: [...data.team, { id:`t${Date.now()}`, name:"", email:"", role: r.label, dept: r.dept, c: r.c, permission:"Editor" }] });
  };

  // Group team by dept for visual structure
  const groups = React.useMemo(() => {
    const map = {};
    data.team.forEach((m, idx) => {
      const k = m.dept || "other";
      (map[k] = map[k] || []).push({...m, _i: idx});
    });
    return map;
  }, [data.team]);

  return (
    <React.Fragment>
      <h2 className="page-title">Invite your team.</h2>
      <div className="page-sub">
        Add stage management, creatives, and cast. Everyone gets an email invite — they create an account
        and land directly on this production with the right permissions.
      </div>

      <div className="banner success">
        <I.Info size={16}/>
        <div>
          <b style={{fontWeight:600}}>Permissions are set per role.</b> Stage Managers & Directors get full edit access.
          Designers see their department + shared docs. Cast see their schedule, call times, and the cast-facing
          report view — line notes and internal SM notes stay private.
        </div>
      </div>

      <h3 className="sec">Team members <span className="count">{data.team.length}</span></h3>

      <div className="row-list">
        <div className="row-header cast-row">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span></span>
        </div>
        {data.team.map((m,i) => (
          <div key={m.id} className="row-item cast-row">
            <input className="field" value={m.name} placeholder="Full name"
                   onChange={e => update(i, {name: e.target.value})}/>
            <input className="field" type="email" value={m.email} placeholder="name@theatre.com"
                   onChange={e => update(i, {email: e.target.value})}/>
            <select className="field" value={m.role}
                    onChange={e => {
                      const r = TEAM_ROLES.find(x => x.label === e.target.value);
                      update(i, {role: e.target.value, dept: r?.dept || m.dept, c: r?.c || m.c});
                    }}>
              {TEAM_ROLES.map(r => <option key={r.label}>{r.label}</option>)}
            </select>
            <button className="btn ghost icon-only sm delete" onClick={() => remove(i)} title="Remove">
              <I.Trash size={12}/>
            </button>
          </div>
        ))}
        <button className="add-btn" onClick={() => add()}>
          <I.Plus size={14}/><span>Add a team member</span>
        </button>
      </div>

      <h3 className="sec" style={{marginTop:32}}>Quick add by role</h3>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {TEAM_ROLES.slice(0, 12).map(r => (
          <button key={r.label} className="btn sm" onClick={() => add(r)}>
            <I.Plus size={11}/><span>{r.label}</span>
          </button>
        ))}
      </div>

      <details className="bulk">
        <summary>Bulk invite from a CSV or spreadsheet</summary>
        <div className="bulk-body">
          <div className="hint" style={{margin:"4px 0 10px"}}>
            One per line — <span className="mono">Name, Email, Role</span>.
          </div>
          <textarea className="field" placeholder={"Maya Okafor, maya@example.com, Stage Manager\nHelena Voss, helena@example.com, Music Director\nTheo Marsh, theo@example.com, Cast — Principal"}/>
          <button className="btn sm primary" style={{marginTop:10}}>
            <I.Mail size={12}/><span>Preview & send invites</span>
          </button>
        </div>
      </details>
    </React.Fragment>
  );
}

// ─── STEP 6 · Review ──────────────────────────────────────────────────
function StepReview({ data, jumpTo }) {
  const onDepts = Object.entries(data.depts).filter(([_,v]) => v).map(([k]) => k);
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"}) : "—";
  const filledTeam = data.team.filter(t => t.name || t.email);
  const filledRoles = data.roles.filter(r => r.name);

  return (
    <React.Fragment>
      <h2 className="page-title">Ready to launch.</h2>
      <div className="page-sub">
        Here's what we'll set up. Click any section to make changes — your team gets notified the moment
        you launch, so double-check before you press the button.
      </div>

      <div className="review-grid">
        <div className="review-card" style={{gridColumn:"1 / -1"}}>
          <h4>
            <I.Star size={12}/><span>Production</span>
            <a onClick={() => jumpTo(0)}>Edit</a>
          </h4>
          <div className="kv"><span className="k">Title</span><span className="v" style={{fontFamily:"var(--font-display)",fontSize:18,fontWeight:500}}>{data.title || "Untitled production"}</span></div>
          <div className="kv"><span className="k">Venue</span><span className="v">{data.venue || "—"}</span></div>
          <div className="kv"><span className="k">Season</span><span className="v">{data.season}</span></div>
          <div className="kv"><span className="k">Rehearsal days</span><span className="v">{Object.entries(data.rehearsalDays).filter(([_,v])=>v).map(([k])=>k).join(", ") || "—"}</span></div>
          <div className="kv"><span className="k">Typical call</span><span className="v" style={{fontFamily:"var(--font-mono)"}}>{data.rehearsalStart} – {data.rehearsalEnd}</span></div>
        </div>

        <div className="review-card" style={{gridColumn:"1 / -1"}}>
          <h4>
            <I.Calendar size={12}/><span>Calendar</span>
            <a onClick={() => jumpTo(1)}>Edit</a>
          </h4>
          <div className="date-band">
            <div className="item"><span>First rehearsal</span><b>{fmt(data.firstRehearsal)}</b></div>
            <div className="item"><span>Tech starts</span><b>{fmt(data.techStart)}</b></div>
            <div className="item"><span>Opening</span><b style={{color:"var(--accent)"}}>{fmt(data.opening)}</b></div>
            <div className="item"><span>Closing</span><b>{fmt(data.closing)}</b></div>
          </div>
        </div>

        <div className="review-card">
          <h4>
            <I.Layers size={12}/><span>Departments</span>
            <a onClick={() => jumpTo(2)}>Edit</a>
          </h4>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
            {onDepts.map(key => {
              const d = ALL_DEPTS.find(x => x.key === key);
              return <span key={key} className="pill" data-c={d?.c || ""}>{d?.label}</span>;
            })}
          </div>
        </div>

        <div className="review-card">
          <h4>
            <I.Mask size={12}/><span>Roles</span>
            <a onClick={() => jumpTo(3)}>Edit</a>
          </h4>
          <div style={{fontFamily:"var(--font-display)",fontSize:32,fontWeight:500,lineHeight:1}}>{filledRoles.length}</div>
          <div className="hint" style={{marginTop:6}}>{filledRoles.length ? filledRoles.slice(0,4).map(r => r.name).join(" · ") + (filledRoles.length > 4 ? ` · +${filledRoles.length - 4} more` : "") : "No roles added yet."}</div>
        </div>

        <div className="review-card" style={{gridColumn:"1 / -1"}}>
          <h4>
            <I.Users size={12}/><span>Team — {filledTeam.length} invite{filledTeam.length === 1 ? "" : "s"} ready</span>
            <a onClick={() => jumpTo(4)}>Edit</a>
          </h4>
          {filledTeam.length === 0
            ? <div className="hint">No invites added yet — you can add team members after launching.</div>
            : <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:6}}>
                {filledTeam.slice(0, 6).map((m,i) => (
                  <div key={i} style={{display:"grid",gridTemplateColumns:"26px 1fr 1fr auto",alignItems:"center",gap:10,fontSize:13}}>
                    <div className="av" style={{background: m.c ? `var(--c-${m.c})` : "var(--ink-3)"}}>
                      {m.name.split(" ").map(p => p[0]).filter(Boolean).slice(0,2).join("").toUpperCase() || "?"}
                    </div>
                    <span style={{fontWeight:500}}>{m.name || <span className="hint">unnamed</span>}</span>
                    <span style={{color:"var(--ink-3)",fontFamily:"var(--font-mono)",fontSize:12}}>{m.email || "no email"}</span>
                    <span className="pill" data-c={m.c || ""}>{m.role}</span>
                  </div>
                ))}
                {filledTeam.length > 6 && <div className="hint">+{filledTeam.length - 6} more</div>}
              </div>
          }
        </div>
      </div>

      <div className="banner success" style={{marginTop:28}}>
        <I.Check size={16}/>
        <div>
          <b style={{fontWeight:600}}>When you launch:</b> we'll create the production dashboard,
          generate folder structure for all enabled departments, send invite emails to your team, and
          drop you into the Overview page ready to schedule your first rehearsal.
        </div>
      </div>
    </React.Fragment>
  );
}

// ─── Launch screen ────────────────────────────────────────────────────
function LaunchScreen({ data, overlay, onDone }) {
  const filledTeam = data.team.filter(t => t.name || t.email);
  const filledRoles = data.roles.filter(r => r.name);
  const onDepts = Object.values(data.depts).filter(Boolean).length;

  return (
    <div className="app" data-mode={overlay ? "overlay" : "page"}>
      {!overlay && <NPTopBar/>}
      <div className="main" style={{margin:"0 auto",maxWidth:680}}>
        <div className="launch anim-in">
          <div className="launch-mark">{(data.title || "P")[0]}</div>
          <h2>{data.title || "Your production"} is live.</h2>
          <p>
            Invites are on their way to {filledTeam.length} team member{filledTeam.length === 1 ? "" : "s"}.
            Your dashboard is ready — schedule your first rehearsal and start tracking from day one.
          </p>
          <div className="launch-stats">
            <div className="item"><b>{filledRoles.length}</b><span>Roles</span></div>
            <div className="item"><b>{filledTeam.length}</b><span>Invites sent</span></div>
            <div className="item"><b>{onDepts}</b><span>Departments</span></div>
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:10}}>
            <a className="btn" href="CallBoard.html">Go to dashboard</a>
            <a className="btn accent" href="CallBoard.html">
              <span>Open {data.title || "production"}</span>
              <I.ChevRight size={14}/>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export for in-app overlay use
window.NewProduction = NewProduction;

// Auto-mount only when loaded as a standalone page
if (window.__npStandalone) {
  ReactDOM.createRoot(document.getElementById("root")).render(<NewProduction mode="page"/>);
}
