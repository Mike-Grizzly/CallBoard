// Rehearsal video tab — library + player with timestamped notes.

const { I: VdI } = window;
const { VIDEOS } = window.DATA;

const VIDEO_NOTES = [
  { t: 32,    who:"Maya",     text:"Mabel entrance — director wants slower reveal", c:"plum"   },
  { t: 184,   who:"Eleanor",  text:"Pirates chorus blocking — tighten upstage line",   c:"dusk"   },
  { t: 412,   who:"Maya",     text:"Cutlass clatter at \"Hail, Poetry\" — dampen",    c:"clay"   },
  { t: 740,   who:"Helena",   text:"Tempo dragging in finale — q=72 going forward",   c:"plum"   },
  { t: 1208,  who:"Maya",     text:"Frederic high B — pitchy, work in voice tomorrow",c:"sage"   },
  { t: 2210,  who:"Adaeze",   text:"Daughter chorus skirts — too long for choreo",    c:"clay"   },
];

const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
const fmtH = (s) => {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return h ? `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}` : `${m}:${String(sec).padStart(2,"0")}`;
};

function TabVideo() {
  const [active, setActive] = React.useState(VIDEOS[0]);
  const [playing, setPlaying] = React.useState(false);
  const [t, setT] = React.useState(287);
  const total = 6128; // 1:42:08

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT(x => Math.min(total, x+1)), 1000);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="anim-in" style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20,maxWidth:1280,margin:"0 auto"}}>
      {/* Player */}
      <div style={{display:"flex",flexDirection:"column",gap:14,minWidth:0}}>
        <div style={{position:"relative",borderRadius:"var(--radius)",overflow:"hidden",
                     background:`linear-gradient(135deg, oklch(0.3 0.08 ${active.thumbHue}), oklch(0.18 0.06 ${active.thumbHue}))`,
                     aspectRatio:"16 / 9",boxShadow:"var(--shadow-2)"}}>
          {/* Stage placeholder */}
          <svg viewBox="0 0 800 450" style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.5}}>
            <defs>
              <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0)"/>
                <stop offset="100%" stopColor="rgba(255,255,255,.18)"/>
              </linearGradient>
            </defs>
            <path d="M 100 450 L 250 230 L 550 230 L 700 450 Z" fill="url(#floor)"/>
            <line x1="0" y1="230" x2="800" y2="230" stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
            {[...Array(7)].map((_,i) => (
              <circle key={i} cx={120 + i*90} cy={350} r="3" fill="rgba(255,255,255,.4)"/>
            ))}
          </svg>

          {/* Centered play */}
          <button onClick={() => setPlaying(!playing)}
            style={{position:"absolute",inset:0,display:"grid",placeItems:"center",
                    background:"transparent",border:0,cursor:"pointer"}}>
            <div style={{width:72,height:72,borderRadius:"50%",
                         background:"rgba(0,0,0,.4)",backdropFilter:"blur(10px)",
                         display:"grid",placeItems:"center",color:"white",
                         transition:"transform .18s",
                         transform: playing ? "scale(.94)" : "scale(1)"}}>
              {playing ? <VdI.Pause size={26}/> : <VdI.Play size={26}/>}
            </div>
          </button>

          {/* Top overlay */}
          <div style={{position:"absolute",top:14,left:16,right:16,display:"flex",justifyContent:"space-between",color:"white"}}>
            <div>
              <div style={{fontSize:11,opacity:.7,textTransform:"uppercase",letterSpacing:".08em"}}>Now playing</div>
              <div style={{fontSize:16,fontWeight:600,marginTop:2,fontFamily:"var(--font-display)"}}>{active.title}</div>
            </div>
            <span className="pill" style={{background:"rgba(0,0,0,.4)",color:"white",backdropFilter:"blur(6px)"}}>
              <span className="dot" style={{background:"var(--accent)"}}/> REC May 4
            </span>
          </div>

          {/* Timeline */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"16px 16px 14px",
                       background:"linear-gradient(to top, rgba(0,0,0,.7), transparent)"}}>
            <div className="row" style={{gap:10,color:"white",marginBottom:8}}>
              <button onClick={() => setPlaying(!playing)} className="btn ghost btn-icon" style={{color:"white",height:28,width:28}}>
                {playing ? <VdI.Pause size={14}/> : <VdI.Play size={14}/>}
              </button>
              <button className="btn ghost btn-icon" style={{color:"white",height:28,width:28}}><VdI.Back size={14}/></button>
              <button className="btn ghost btn-icon" style={{color:"white",height:28,width:28}}><VdI.Fwd size={14}/></button>
              <span className="mono" style={{fontSize:12,opacity:.9}}>{fmtH(t)}</span>
              <span style={{flex:1,position:"relative",height:6,background:"rgba(255,255,255,.18)",borderRadius:999,cursor:"pointer"}}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setT(Math.round((e.clientX - r.left) / r.width * total));
                }}>
                <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${(t/total)*100}%`,background:"var(--accent)",borderRadius:999}}/>
                {/* Note markers */}
                {VIDEO_NOTES.map((n,i) => (
                  <div key={i} title={n.text}
                    style={{position:"absolute",top:-3,left:`${(n.t/total)*100}%`,
                            width:2,height:12,background:`var(--c-${n.c})`,borderRadius:1}}/>
                ))}
                <div style={{position:"absolute",top:-4,left:`calc(${(t/total)*100}% - 7px)`,
                             width:14,height:14,borderRadius:"50%",background:"white",boxShadow:"0 1px 4px rgba(0,0,0,.4)"}}/>
              </span>
              <span className="mono" style={{fontSize:12,opacity:.7}}>{active.duration}</span>
              <button className="btn ghost btn-icon" style={{color:"white",height:28,width:28}}><VdI.Volume size={14}/></button>
              <button className="btn ghost btn-icon" style={{color:"white",height:28,width:28}}><VdI.Full size={14}/></button>
            </div>
          </div>
        </div>

        {/* Tools row */}
        <div className="row-between">
          <div className="row" style={{gap:8}}>
            <button className="btn"><VdI.Plus size={14}/><span>Add timestamp note @ {fmt(t)}</span></button>
            <button className="btn"><VdI.Send size={14}/><span>Share clip</span></button>
            <button className="btn ghost"><VdI.Download size={14}/><span>Download</span></button>
          </div>
          <div className="row" style={{gap:6}}>
            <span className="muted" style={{fontSize:12}}>Speed</span>
            <button className="btn ghost" style={{height:26,padding:"0 10px",fontSize:12,fontFamily:"var(--font-mono)"}}>1.0×</button>
          </div>
        </div>

        {/* Library */}
        <div>
          <div className="h-eyebrow" style={{marginBottom:10,marginTop:10}}>Library · 6 sessions</div>
          <div className="grid" style={{gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))",gap:12}}>
            {VIDEOS.map(v => (
              <div key={v.id} onClick={() => setActive(v)} className="card" style={{padding:0,overflow:"hidden",cursor:"pointer",
                  outline: active.id===v.id ? "2px solid var(--accent)" : "none"}}>
                <div style={{height:90,position:"relative",
                             background:`linear-gradient(135deg, oklch(0.5 0.1 ${v.thumbHue}), oklch(0.28 0.08 ${v.thumbHue}))`}}>
                  <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",color:"white",opacity:.85}}>
                    <VdI.Play size={22}/>
                  </div>
                  <span style={{position:"absolute",bottom:6,right:6,
                                background:"rgba(0,0,0,.6)",color:"white",fontSize:10.5,
                                fontFamily:"var(--font-mono)",padding:"2px 6px",borderRadius:4}}>{v.duration}</span>
                </div>
                <div style={{padding:"8px 10px"}}>
                  <div className="truncate" style={{fontSize:12.5,fontWeight:500}}>{v.title}</div>
                  <div className="row-between" style={{marginTop:2}}>
                    <span className="muted" style={{fontSize:11}}>{v.date}</span>
                    {v.notes > 0 && <span className="muted" style={{fontSize:11}}>{v.notes} notes</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes side panel */}
      <div className="card" style={{display:"flex",flexDirection:"column",minHeight:0,maxHeight:"calc(100vh - 220px)"}}>
        <div style={{padding:"14px 16px 12px",borderBottom:"1px solid var(--border)"}}>
          <div className="row-between">
            <h3 className="h-card">Timestamps</h3>
            <span className="muted" style={{fontSize:11.5}}>{VIDEO_NOTES.length} notes</span>
          </div>
        </div>
        <div className="scroll" style={{overflowY:"auto",padding:"6px 6px"}}>
          {VIDEO_NOTES.map((n,i) => (
            <div key={i} onClick={() => setT(n.t)}
              style={{padding:"10px 12px",borderRadius:6,cursor:"pointer",margin:"2px 4px",
                      background: Math.abs(t - n.t) < 5 ? "var(--bg-sunken)" : "transparent"}}
              onMouseEnter={e => { if(Math.abs(t-n.t)>=5) e.currentTarget.style.background = "var(--bg-muted)"; }}
              onMouseLeave={e => { if(Math.abs(t-n.t)>=5) e.currentTarget.style.background = "transparent"; }}>
              <div className="row" style={{gap:8,marginBottom:4}}>
                <span className="pill" data-c={n.c} style={{fontFamily:"var(--font-mono)"}}>{fmtH(n.t)}</span>
                <span className="muted" style={{fontSize:11.5}}>{n.who}</span>
              </div>
              <div style={{fontSize:13,lineHeight:1.45}}>{n.text}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 12px",borderTop:"1px solid var(--border)"}}>
          <div className="row" style={{gap:6}}>
            <input className="field" placeholder={`Note at ${fmt(t)}…`} style={{flex:1}}/>
            <button className="btn primary btn-icon"><VdI.Send size={14}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.TabVideo = TabVideo;
