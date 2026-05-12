// Notes / To-dos tab — personal SM workspace.

const { I: NtI } = window;
const { NOTES } = window.DATA;

function TabNotes() {
  const [items, setItems] = React.useState(NOTES);
  const [filter, setFilter] = React.useState("all");
  const [active, setActive] = React.useState(items.find(n => n.pinned) || items[0]);
  const [draftBody, setDraftBody] = React.useState(active?.body || "");

  React.useEffect(() => { setDraftBody(active?.body || ""); }, [active?.id]);

  const toggle = (id) => {
    setItems(items.map(n => n.id === id ? {...n, done: !n.done} : n));
  };

  const filtered = items.filter(n => {
    if (filter === "todo") return n.kind === "todo" && !n.done;
    if (filter === "done") return n.done;
    if (filter === "notes") return n.kind === "note";
    if (filter === "pinned") return n.pinned;
    return true;
  });

  const pinned = filtered.filter(n => n.pinned);
  const others = filtered.filter(n => !n.pinned);

  return (
    <div className="anim-in" style={{display:"grid",gridTemplateColumns:"360px 1fr",gap:16,maxWidth:1180,margin:"0 auto"}}>
      {/* List column */}
      <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0}}>
        <div className="row-between">
          <h2 className="h-section">My notes</h2>
          <button className="btn primary" style={{height:30,padding:"0 10px"}}><NtI.Plus size={14}/><span>New</span></button>
        </div>

        <div className="row" style={{gap:6,flexWrap:"wrap"}}>
          {[
            ["all","All"],["todo","To-do"],["pinned","Pinned"],["notes","Notes"],["done","Done"]
          ].map(([k,l]) => (
            <button key={k} className="btn ghost" data-active={filter===k?"1":"0"}
              onClick={() => setFilter(k)}
              style={{height:26,padding:"0 10px",fontSize:12,
                background: filter===k ? "var(--bg-sunken)" : "transparent",
                color: filter===k ? "var(--ink)" : "var(--ink-3)",
                fontWeight: filter===k ? 500 : 400}}>
              {l}
            </button>
          ))}
        </div>

        {pinned.length > 0 && (
          <>
            <div className="h-eyebrow" style={{marginTop:4}}><NtI.Pin size={11}/> Pinned</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {pinned.map(n => <NoteRow key={n.id} n={n} active={active?.id===n.id} onPick={() => setActive(n)} onToggle={() => toggle(n.id)} />)}
            </div>
          </>
        )}

        <div className="h-eyebrow" style={{marginTop:8}}>{pinned.length>0 ? "All" : "Items"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {others.map(n => <NoteRow key={n.id} n={n} active={active?.id===n.id} onPick={() => setActive(n)} onToggle={() => toggle(n.id)} />)}
        </div>
      </div>

      {/* Detail column */}
      <div className="card" style={{display:"flex",flexDirection:"column",minHeight:540}}>
        {active ? (
          <>
            <div className="row-between" style={{padding:"16px 22px",borderBottom:"1px solid var(--border)"}}>
              <div className="row" style={{gap:10}}>
                {active.kind === "todo" && (
                  <button onClick={() => toggle(active.id)} style={{background:"none",border:0,cursor:"pointer",padding:0,color: active.done ? "var(--c-sage)" : "var(--ink-4)"}}>
                    {active.done ? <NtI.CircleCheck size={20}/> : <NtI.CircleEmpty size={20}/>}
                  </button>
                )}
                <span className="pill" data-c={active.c}>{active.tag}</span>
                {active.due && <span className="pill"><NtI.Clock size={11}/>{active.due}</span>}
                {active.pinned && <span className="pill" data-c="accent"><NtI.Pin size={11}/>Pinned</span>}
              </div>
              <div className="row" style={{gap:6}}>
                <button className="btn ghost btn-icon"><NtI.Pin size={14}/></button>
                <button className="btn ghost btn-icon"><NtI.Trash size={14}/></button>
                <button className="btn ghost btn-icon"><NtI.Dots size={14}/></button>
              </div>
            </div>
            <div style={{padding:"22px 28px",flex:1,display:"flex",flexDirection:"column"}}>
              <input className="field" defaultValue={active.title}
                style={{border:0,padding:0,fontSize:24,fontWeight:600,fontFamily:"var(--font-display)",letterSpacing:"-.012em",background:"transparent",marginBottom:14}} />
              <textarea className="field" value={draftBody} onChange={e => setDraftBody(e.target.value)}
                placeholder="Type your note…"
                style={{border:0,padding:0,background:"transparent",flex:1,minHeight:200,fontSize:14,lineHeight:1.6,resize:"none"}} />
            </div>
            <div className="row-between" style={{padding:"12px 22px",borderTop:"1px solid var(--border)",fontSize:11.5,color:"var(--ink-4)"}}>
              <span>Saved automatically · Visible only to you</span>
              <span className="row" style={{gap:6}}><NtI.User size={11}/>Maya · 2m ago</span>
            </div>
          </>
        ) : (
          <div style={{margin:"auto",textAlign:"center",color:"var(--ink-3)"}}>
            <NtI.Pencil size={28}/>
            <div style={{marginTop:8}}>Pick a note or create a new one</div>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteRow({ n, active, onPick, onToggle }) {
  return (
    <div onClick={onPick}
      style={{display:"grid",gridTemplateColumns:"22px 1fr auto",gap:10,padding:"10px 12px",
              borderRadius:8, cursor:"pointer",
              border:"1px solid " + (active ? "var(--border-strong)" : "transparent"),
              background: active ? "var(--bg-elev)" : "transparent",
              boxShadow: active ? "var(--shadow-1)" : "none"}}
      onMouseEnter={e => { if(!active) e.currentTarget.style.background = "var(--bg-muted)"; }}
      onMouseLeave={e => { if(!active) e.currentTarget.style.background = "transparent"; }}>
      <button onClick={(e) => { e.stopPropagation(); n.kind === "todo" && onToggle(); }}
        style={{background:"none",border:0,padding:0,cursor:"pointer",
                color: n.done ? "var(--c-sage)" : (n.kind==="todo" ? "var(--ink-4)" : "var(--ink-3)")}}>
        {n.kind === "todo"
          ? (n.done ? <NtI.CircleCheck size={16}/> : <NtI.CircleEmpty size={16}/>)
          : <NtI.Pencil size={14}/>}
      </button>
      <div style={{minWidth:0}}>
        <div className="truncate" style={{fontSize:13,fontWeight:500,
            textDecoration: n.done ? "line-through" : "none",
            color: n.done ? "var(--ink-3)" : "var(--ink)"}}>
          {n.title}
        </div>
        <div className="row" style={{gap:8,marginTop:3}}>
          <span className="pill" data-c={n.c} style={{fontSize:10.5,height:16,padding:"0 6px"}}>{n.tag}</span>
          {n.due && <span className="muted" style={{fontSize:11}}>{n.due}</span>}
        </div>
      </div>
      {n.pinned && <NtI.Pin size={12} style={{color:"var(--accent)"}}/>}
    </div>
  );
}

window.TabNotes = TabNotes;
