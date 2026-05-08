// Stage Blocking tab — drag and drop actor tokens onto a stage grid.

const { I: BkI } = window;
const { CAST: BkCAST } = window.DATA;

// Stage convention: from audience POV — DSL/DSR (downstage = closest to audience)
// We'll use a stage area drawn in proscenium perspective.
const SCENES = [
  { id:"act1op",  label:"Act I — Opening", time:"pp. 1–6" },
  { id:"act1mab", label:"Act I — Mabel's entrance", time:"pp. 12–14", active:true },
  { id:"act2",    label:"Act II — Ruined Chapel", time:"pp. 42–48" },
  { id:"act2fin", label:"Act II — Finale", time:"pp. 65–72" },
];

// Initial positions per actor for the active scene (% of stage box)
const INITIAL = {
  c1: { x: 38, y: 62, scene:"act1mab" },  // Frederic
  c2: { x: 60, y: 50, scene:"act1mab" },  // Mabel
  c3: { x: 22, y: 38, scene:"act1mab" },  // Pirate King
  c5: { x: 30, y: 70, scene:"act1mab" },  // Ruth
  c7: { x: 72, y: 65, scene:"act1mab" },  // Edith
  c8: { x: 80, y: 56, scene:"act1mab" },  // Kate
  c9: { x: 78, y: 70, scene:"act1mab" },  // Isabel
};

const PROPS = [
  { id:"p1", label:"Bench",    x: 50, y: 78, kind:"set" },
  { id:"p2", label:"Cliff",    x: 18, y: 28, kind:"set" },
  { id:"p3", label:"Cutlass",  x: 24, y: 42, kind:"prop" },
];

function TabBlocking() {
  const [scene, setScene] = React.useState("act1mab");
  const [positions, setPositions] = React.useState(INITIAL);
  const [props, setProps] = React.useState(PROPS);
  const [selected, setSelected] = React.useState(null);
  const [showTrails, setShowTrails] = React.useState(true);
  const [showGrid, setShowGrid] = React.useState(true);
  const stageRef = React.useRef(null);

  const onStage = Object.keys(positions);
  const offStage = BkCAST.filter(c => !onStage.includes(c.id));

  const startDrag = (id, isActor, e) => {
    e.preventDefault();
    setSelected(id);
    const stage = stageRef.current.getBoundingClientRect();
    const move = (ev) => {
      const x = Math.max(2, Math.min(98, ((ev.clientX - stage.left) / stage.width) * 100));
      const y = Math.max(4, Math.min(96, ((ev.clientY - stage.top) / stage.height) * 100));
      if (isActor) {
        setPositions(p => ({ ...p, [id]: { ...(p[id] || {scene}), x, y } }));
      } else {
        setProps(ps => ps.map(p => p.id === id ? {...p, x, y} : p));
      }
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const onDropFromList = (e, castId) => {
    const stage = stageRef.current.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((e.clientX - stage.left) / stage.width) * 100));
    const y = Math.max(6, Math.min(94, ((e.clientY - stage.top) / stage.height) * 100));
    setPositions(p => ({ ...p, [castId]: { x, y, scene } }));
  };

  const remove = (id) => {
    const p = {...positions};
    delete p[id];
    setPositions(p);
    setSelected(null);
  };

  return (
    <div className="anim-in" style={{display:"grid",gridTemplateColumns:"260px 1fr 280px",gap:16,maxWidth:1400,margin:"0 auto"}}>
      {/* Scenes / cast list */}
      <div style={{display:"flex",flexDirection:"column",gap:14,minHeight:0}}>
        <div>
          <div className="h-eyebrow" style={{marginBottom:8}}>Scenes</div>
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            {SCENES.map(s => (
              <div key={s.id} onClick={() => setScene(s.id)}
                style={{padding:"8px 10px",borderRadius:6,cursor:"pointer",
                        background: scene===s.id ? "var(--bg-elev)" : "transparent",
                        boxShadow: scene===s.id ? "var(--shadow-1)" : "none",
                        border: "1px solid " + (scene===s.id ? "var(--border-strong)" : "transparent")}}>
                <div style={{fontSize:13,fontWeight:scene===s.id?500:400,color:scene===s.id?"var(--ink)":"var(--ink-2)"}}>{s.label}</div>
                <div className="muted" style={{fontSize:11.5,marginTop:2}}>{s.time}</div>
              </div>
            ))}
            <button className="btn ghost" style={{marginTop:6,height:28,padding:"0 10px",fontSize:12,justifyContent:"flex-start"}}>
              <BkI.Plus size={13}/><span>Add scene</span>
            </button>
          </div>
        </div>

        <div>
          <div className="row-between" style={{marginBottom:8}}>
            <div className="h-eyebrow">Off stage · {offStage.length}</div>
            <span className="muted" style={{fontSize:10.5}}>drag in</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:320,overflowY:"auto"}} className="scroll">
            {offStage.map(c => (
              <div key={c.id} draggable onDragEnd={(e) => onDropFromList(e, c.id)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"6px 8px",
                        borderRadius:6,cursor:"grab",
                        border:"1px dashed var(--border-strong)",background:"var(--bg-muted)"}}>
                <div className="avatar" style={{width:24,height:24,fontSize:10,background:`var(--c-${c.color})`}}>{c.initials}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="truncate" style={{fontSize:12.5,fontWeight:500}}>{c.name}</div>
                  <div className="muted" style={{fontSize:10.5}} className="truncate">{c.actor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage canvas */}
      <div style={{display:"flex",flexDirection:"column",gap:10,minWidth:0}}>
        <div className="row-between">
          <div>
            <h2 className="h-section">Stage blocking</h2>
            <div className="muted" style={{fontSize:12.5,marginTop:2}}>
              {SCENES.find(s => s.id === scene)?.label} · drag actors to set positions
            </div>
          </div>
          <div className="row" style={{gap:6}}>
            <button className="btn ghost" onClick={() => setShowGrid(!showGrid)}
              style={{height:28,padding:"0 10px",fontSize:12,background:showGrid?"var(--bg-sunken)":"transparent"}}>
              <BkI.Hash size={12}/><span>Grid</span>
            </button>
            <button className="btn ghost" onClick={() => setShowTrails(!showTrails)}
              style={{height:28,padding:"0 10px",fontSize:12,background:showTrails?"var(--bg-sunken)":"transparent"}}>
              <BkI.Bolt size={12}/><span>Trails</span>
            </button>
            <button className="btn"><BkI.Refresh size={13}/><span>Reset</span></button>
            <button className="btn primary"><BkI.Check size={13}/><span>Save</span></button>
          </div>
        </div>

        {/* Stage proper */}
        <div ref={stageRef} className="card" style={{
          padding:0,position:"relative",aspectRatio:"16 / 10",overflow:"hidden",
          background:"linear-gradient(180deg, oklch(0.96 0.015 60) 0%, oklch(0.94 0.02 60) 100%)"
        }}>
          {/* Stage area trapezoid (proscenium) */}
          <svg viewBox="0 0 800 500" style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
            <defs>
              {showGrid && (
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.85 0.01 60)" strokeWidth="1"/>
                </pattern>
              )}
            </defs>
            {showGrid && <rect width="800" height="500" fill="url(#grid)"/>}

            {/* Proscenium frame */}
            <rect x="20" y="20" width="760" height="440" fill="none" stroke="oklch(0.55 0.16 25)" strokeWidth="2" strokeDasharray="4 6" rx="4"/>

            {/* Center line + apron */}
            <line x1="400" y1="20" x2="400" y2="460" stroke="oklch(0.78 0.01 60)" strokeWidth="1" strokeDasharray="2 4"/>

            {/* Apron arc */}
            <path d="M 60 460 Q 400 510 740 460" fill="oklch(0.92 0.018 60)" stroke="oklch(0.7 0.01 60)" strokeWidth="1"/>
          </svg>

          {/* Stage labels */}
          <div style={{position:"absolute",top:6,left:8,fontSize:10,letterSpacing:".1em",color:"var(--ink-4)",textTransform:"uppercase"}}>Upstage</div>
          <div style={{position:"absolute",bottom:6,left:8,fontSize:10,letterSpacing:".1em",color:"var(--ink-4)",textTransform:"uppercase"}}>Downstage / Audience</div>
          <div style={{position:"absolute",top:"50%",left:6,fontSize:10,letterSpacing:".1em",color:"var(--ink-4)",textTransform:"uppercase",writingMode:"vertical-rl",transform:"rotate(180deg)"}}>Stage Right</div>
          <div style={{position:"absolute",top:"50%",right:6,fontSize:10,letterSpacing:".1em",color:"var(--ink-4)",textTransform:"uppercase",writingMode:"vertical-rl"}}>Stage Left</div>

          {/* Set / props */}
          {props.map(p => (
            <div key={p.id} onMouseDown={(e) => startDrag(p.id, false, e)}
              style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,transform:"translate(-50%,-50%)",
                      padding:"4px 9px",borderRadius:4,fontSize:11,fontWeight:500,
                      background: p.kind==="set" ? "oklch(0.88 0.02 60)" : "var(--c-clay-soft)",
                      color: p.kind==="set" ? "var(--ink-2)" : "color-mix(in oklch, var(--c-clay) 50%, var(--ink))",
                      border:"1px solid " + (p.kind==="set" ? "oklch(0.78 0.01 60)" : "var(--c-clay)"),
                      cursor:"grab",userSelect:"none",
                      outline: selected===p.id ? "2px solid var(--accent)" : "none"}}>
              {p.label}
            </div>
          ))}

          {/* Actor tokens */}
          {Object.entries(positions).map(([id, pos]) => {
            const c = BkCAST.find(x => x.id === id);
            if (!c) return null;
            const sel = selected === id;
            return (
              <div key={id} onMouseDown={(e) => startDrag(id, true, e)}
                onClick={() => setSelected(id)}
                style={{position:"absolute",left:`${pos.x}%`,top:`${pos.y}%`,
                        transform:`translate(-50%,-50%) scale(${sel?1.1:1})`,
                        cursor:"grab",userSelect:"none",zIndex: sel ? 10 : 1,
                        transition:"transform .12s"}}>
                <div className="avatar" style={{
                  width:38,height:38,fontSize:13,fontWeight:600,
                  background:`var(--c-${c.color})`,
                  color:"white",
                  boxShadow: sel ? "0 0 0 3px var(--accent), 0 4px 12px rgba(0,0,0,.18)"
                                 : "0 2px 6px rgba(0,0,0,.18)",
                  border:"2px solid white"
                }}>{c.initials}</div>
                <div style={{position:"absolute",top:42,left:"50%",transform:"translateX(-50%)",
                             whiteSpace:"nowrap",fontSize:10.5,fontWeight:500,
                             color:"var(--ink)",
                             background:"rgba(255,255,255,.85)",backdropFilter:"blur(4px)",
                             padding:"1px 6px",borderRadius:3}}>
                  {c.name}
                </div>
              </div>
            );
          })}

          {/* Hint */}
          {Object.keys(positions).length === 0 && (
            <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",color:"var(--ink-4)",fontSize:13}}>
              Drag cast members from the left to set blocking
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="row" style={{gap:14,fontSize:11.5,color:"var(--ink-3)",padding:"0 4px"}}>
          <span className="row" style={{gap:6}}><span style={{width:10,height:10,borderRadius:"50%",background:"var(--c-clay)"}}/>Principal</span>
          <span className="row" style={{gap:6}}><span style={{width:10,height:10,borderRadius:3,background:"oklch(0.88 0.02 60)",border:"1px solid oklch(0.78 0.01 60)"}}/>Set</span>
          <span className="row" style={{gap:6}}><span style={{width:10,height:10,borderRadius:3,background:"var(--c-clay-soft)",border:"1px solid var(--c-clay)"}}/>Prop</span>
          <span className="row" style={{gap:6,marginLeft:"auto"}}><BkI.Info size={11}/>Click a token to inspect · drag to reposition</span>
        </div>
      </div>

      {/* Inspector */}
      <div className="card" style={{display:"flex",flexDirection:"column",minHeight:0}}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid var(--border)"}}>
          <h3 className="h-card">Inspector</h3>
        </div>
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:14}}>
          {selected ? <Inspector id={selected} positions={positions} props={props} cast={BkCAST}
                                  onRemove={remove}/>
                    : (
            <div style={{textAlign:"center",color:"var(--ink-3)",padding:"30px 0"}}>
              <BkI.Move size={26} stroke={1.5}/>
              <div style={{marginTop:8,fontSize:13,fontWeight:500,color:"var(--ink-2)"}}>Nothing selected</div>
              <div style={{fontSize:12,marginTop:4}}>Click a token to see details</div>
            </div>
          )}

          <div style={{borderTop:"1px solid var(--border)",paddingTop:14,marginTop:6}}>
            <div className="h-eyebrow" style={{marginBottom:8}}>Scene notes</div>
            <textarea className="field" placeholder="Director's notes for this scene…"
              defaultValue="Mabel enters DSR, drifts toward center for aria. Daughters in cluster SL — keep them out of Frederic's sight line until bar 16."
              style={{minHeight:90,fontSize:12.5}}/>
          </div>

          <div style={{display:"flex",gap:6}}>
            <button className="btn ghost" style={{flex:1,height:28,fontSize:12}}>
              <BkI.Download size={12}/><span>Export</span>
            </button>
            <button className="btn ghost" style={{flex:1,height:28,fontSize:12}}>
              <BkI.Send size={12}/><span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Inspector({ id, positions, props, cast, onRemove }) {
  const isProp = !!props.find(p => p.id === id);
  if (isProp) {
    const p = props.find(p => p.id === id);
    return (
      <div>
        <div className="h-eyebrow" style={{marginBottom:6}}>{p.kind}</div>
        <div style={{fontSize:16,fontWeight:600,marginBottom:10}}>{p.label}</div>
        <div className="muted mono" style={{fontSize:12}}>x: {p.x.toFixed(0)}%, y: {p.y.toFixed(0)}%</div>
      </div>
    );
  }
  const c = cast.find(x => x.id === id);
  const pos = positions[id];
  if (!c || !pos) return null;
  return (
    <div>
      <div className="row" style={{gap:10,marginBottom:12}}>
        <div className="avatar" style={{width:38,height:38,fontSize:13,background:`var(--c-${c.color})`}}>{c.initials}</div>
        <div>
          <div style={{fontSize:14,fontWeight:600}}>{c.name}</div>
          <div className="muted" style={{fontSize:12}}>{c.actor}</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6,fontSize:12}}>
        <div className="row-between"><span className="muted">Position</span><span className="mono">{pos.x.toFixed(0)}, {pos.y.toFixed(0)}</span></div>
        <div className="row-between"><span className="muted">Stage area</span>
          <span>{stageArea(pos.x, pos.y)}</span></div>
        <div className="row-between"><span className="muted">Type</span><span className="pill" data-c={c.color}>{c.type}</span></div>
      </div>
      <div style={{display:"flex",gap:6,marginTop:14}}>
        <button className="btn ghost" style={{flex:1,height:26,fontSize:12}}><BkI.Pin size={11}/><span>Lock</span></button>
        <button className="btn ghost" style={{flex:1,height:26,fontSize:12,color:"var(--accent)"}} onClick={() => onRemove(id)}><BkI.X size={11}/><span>Remove</span></button>
      </div>
    </div>
  );
}

function stageArea(x, y) {
  const v = y < 33 ? "Up" : y > 66 ? "Down" : "Center";
  const h = x < 33 ? "stage right" : x > 66 ? "stage left" : "center";
  return `${v} ${h}`;
}

window.TabBlocking = TabBlocking;
