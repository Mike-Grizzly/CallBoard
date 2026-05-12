// Documents tab — shared files.

const { I: DcI } = window;
const { DOCS, DOC_FOLDERS } = window.DATA;

const KIND_META = {
  pdf:   { I:"FilePdf",   c:"clay",  label:"PDF" },
  score: { I:"FileMusic", c:"plum",  label:"Score" },
  audio: { I:"FileMusic", c:"dusk",  label:"Audio" },
  img:   { I:"FileImg",   c:"sage",  label:"Image" },
  video: { I:"Film",      c:"amber", label:"Video" },
};

function TabDocuments() {
  const [folder, setFolder] = React.useState("All files");
  const [view, setView] = React.useState("list"); // list | grid
  const [sel, setSel] = React.useState(null);

  const visible = folder === "All files" ? DOCS : DOCS.filter(d => d.folder === folder);

  return (
    <div className="anim-in" style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:20,maxWidth:1280,margin:"0 auto"}}>
      {/* Folder rail */}
      <div>
        <div className="h-eyebrow" style={{marginBottom:10}}>Folders</div>
        <div style={{display:"flex",flexDirection:"column",gap:2}}>
          {DOC_FOLDERS.map(f => (
            <div key={f.name} onClick={() => setFolder(f.name)}
              style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",
                      borderRadius:6,cursor:"pointer",fontSize:13,
                      background: folder===f.name ? "var(--bg-elev)" : "transparent",
                      boxShadow: folder===f.name ? "var(--shadow-1)" : "none",
                      color: folder===f.name ? "var(--ink)" : "var(--ink-2)",
                      fontWeight: folder===f.name ? 500 : 400}}
              onMouseEnter={e => { if(folder!==f.name) e.currentTarget.style.background = "var(--bg-muted)"; }}
              onMouseLeave={e => { if(folder!==f.name) e.currentTarget.style.background = "transparent"; }}>
              <DcI.Folder size={14}/>
              <span style={{flex:1}}>{f.name}</span>
              <span className="muted" style={{fontSize:11.5}}>{f.count}</span>
            </div>
          ))}
        </div>
        <button className="btn ghost" style={{marginTop:10,height:28,padding:"0 10px",fontSize:12,width:"100%",justifyContent:"flex-start"}}>
          <DcI.Plus size={13}/><span>New folder</span>
        </button>

        <div className="h-eyebrow" style={{marginTop:24,marginBottom:10}}>Storage</div>
        <div style={{padding:"12px 14px",background:"var(--bg-sunken)",borderRadius:"var(--radius-s)"}}>
          <div className="row-between" style={{fontSize:12,marginBottom:6}}>
            <span style={{fontWeight:500}}>2.4 GB</span>
            <span className="muted">of 10 GB</span>
          </div>
          <div style={{height:4,background:"var(--bg)",borderRadius:999,overflow:"hidden"}}>
            <div style={{height:"100%",width:"24%",background:"var(--accent)"}}/>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{display:"flex",flexDirection:"column",gap:14,minWidth:0}}>
        <div className="row-between">
          <div>
            <h2 className="h-section">{folder}</h2>
            <div className="muted" style={{fontSize:12.5,marginTop:2}}>{visible.length} {visible.length===1?"file":"files"} · shared with The Pirates of Penzance team</div>
          </div>
          <div className="row" style={{gap:8}}>
            <div style={{display:"flex",border:"1px solid var(--border)",borderRadius:6,overflow:"hidden"}}>
              <button onClick={() => setView("list")} className="btn ghost btn-icon"
                style={{borderRadius:0,height:30,width:32,background: view==="list" ? "var(--bg-sunken)":"transparent"}}>
                <DcI.Hash size={14}/>
              </button>
              <button onClick={() => setView("grid")} className="btn ghost btn-icon"
                style={{borderRadius:0,height:30,width:32,background: view==="grid" ? "var(--bg-sunken)":"transparent"}}>
                <DcI.Layout size={14}/>
              </button>
            </div>
            <button className="btn"><DcI.Upload size={14}/><span>Upload</span></button>
            <button className="btn primary"><DcI.Plus size={14}/><span>New doc</span></button>
          </div>
        </div>

        {view === "list" ? (
          <div className="card" style={{overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"40px 1fr 130px 110px 130px 80px 40px",
                         padding:"10px 16px",borderBottom:"1px solid var(--border)",
                         fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:"var(--ink-4)"}}>
              <span></span><span>Name</span><span>Folder</span><span>Modified by</span><span>When</span><span>Shared</span><span></span>
            </div>
            {visible.map(d => {
              const k = KIND_META[d.kind];
              const Ico = DcI[k.I];
              return (
                <div key={d.id} onClick={() => setSel(d)}
                  style={{display:"grid",gridTemplateColumns:"40px 1fr 130px 110px 130px 80px 40px",
                          padding:"12px 16px",borderBottom:"1px solid var(--border)",alignItems:"center",fontSize:13,cursor:"pointer",
                          background: sel?.id===d.id ? "color-mix(in oklch, var(--accent-soft) 30%, transparent)" : "transparent"}}
                  onMouseEnter={e => { if(sel?.id!==d.id) e.currentTarget.style.background = "var(--bg-muted)"; }}
                  onMouseLeave={e => { if(sel?.id!==d.id) e.currentTarget.style.background = "transparent"; }}>
                  <div className="notif-ico" data-c={k.c} style={{width:28,height:28}}><Ico size={14}/></div>
                  <div style={{minWidth:0}}>
                    <div className="row" style={{gap:6}}>
                      <span className="truncate" style={{fontWeight:500}}>{d.name}</span>
                      {d.starred && <DcI.Star size={11} style={{color:"var(--c-amber)"}}/>}
                    </div>
                    <div className="muted" style={{fontSize:11.5}}>{d.size}</div>
                  </div>
                  <span className="pill">{d.folder}</span>
                  <span className="muted">{d.who}</span>
                  <span className="muted">{d.when}</span>
                  <span className="row" style={{gap:4,fontSize:12,color:"var(--ink-3)"}}>
                    <DcI.Users size={11}/>{d.shared}
                  </span>
                  <button className="btn ghost btn-icon" style={{height:28,width:28}}><DcI.Dots size={14}/></button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-4" style={{gap:14}}>
            {visible.map(d => {
              const k = KIND_META[d.kind];
              const Ico = DcI[k.I];
              return (
                <div key={d.id} onClick={() => setSel(d)} className="card"
                  style={{padding:0,overflow:"hidden",cursor:"pointer",
                          outline: sel?.id===d.id ? "2px solid var(--accent)" : "none"}}>
                  <div style={{height:120,background:`var(--c-${k.c}-soft)`,display:"grid",placeItems:"center",position:"relative"}}>
                    <Ico size={42} stroke={1.4}/>
                    {d.starred && <DcI.Star size={14} style={{position:"absolute",top:8,right:8,color:"var(--c-amber)"}}/>}
                  </div>
                  <div style={{padding:"10px 12px"}}>
                    <div className="truncate" style={{fontSize:13,fontWeight:500}}>{d.name}</div>
                    <div className="row-between" style={{marginTop:4}}>
                      <span className="muted" style={{fontSize:11}}>{d.size}</span>
                      <span className="muted" style={{fontSize:11}}>{d.when}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sel && (
          <div className="card card-pad anim-in" style={{position:"sticky",bottom:0}}>
            <div className="row-between">
              <div className="row" style={{gap:14}}>
                <div className="notif-ico" data-c={KIND_META[sel.kind].c} style={{width:40,height:40}}>
                  {(() => { const Ico = DcI[KIND_META[sel.kind].I]; return <Ico size={18}/>; })()}
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:600}}>{sel.name}</div>
                  <div className="muted" style={{fontSize:12,marginTop:2}}>
                    {KIND_META[sel.kind].label} · {sel.size} · uploaded by {sel.who} · {sel.when}
                  </div>
                </div>
              </div>
              <div className="row" style={{gap:6}}>
                <button className="btn"><DcI.Download size={14}/><span>Download</span></button>
                <button className="btn"><DcI.Pencil size={14}/><span>Edit</span></button>
                <button className="btn primary"><DcI.Send size={14}/><span>Share</span></button>
                <button className="btn ghost btn-icon" onClick={() => setSel(null)}><DcI.X size={14}/></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.TabDocuments = TabDocuments;
