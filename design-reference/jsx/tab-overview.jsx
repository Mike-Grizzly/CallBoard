// Overview tab — production dashboard.
// "Today's call" is the visual anchor: dark inky hero, oversized display
// typography, ambient gradient + spotlight motif, live status, primary CTA
// upgraded to a pill. The supporting cards stay quiet so the hero leads.

const { I: OvI } = window;
const { ACTIVE_REPORT, CAST: OvCAST, NOTIFICATIONS: OvNOTIFS } = window.DATA;

function TabOverview({ goTab }) {
  return (
    <div className="page-narrow anim-in">
      {/* ─── HERO: Today's call ────────────────────────────────────────── */}
      <section className="today-hero">
        {/* Ambient stage-light gradient */}
        <div className="today-hero-bg" aria-hidden="true">
          <svg viewBox="0 0 1200 420" preserveAspectRatio="none" style={{width:"100%",height:"100%"}}>
            <defs>
              <radialGradient id="spot1" cx="18%" cy="0%" r="55%">
                <stop offset="0%"  stopColor="rgba(255,180,140,.28)"/>
                <stop offset="100%" stopColor="rgba(255,180,140,0)"/>
              </radialGradient>
              <radialGradient id="spot2" cx="92%" cy="10%" r="50%">
                <stop offset="0%"  stopColor="rgba(220,90,60,.22)"/>
                <stop offset="100%" stopColor="rgba(220,90,60,0)"/>
              </radialGradient>
              <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="1.2" cy="1.2" r="1.2" fill="rgba(255,255,255,.05)"/>
              </pattern>
            </defs>
            <rect width="1200" height="420" fill="url(#dots)"/>
            <rect width="1200" height="420" fill="url(#spot1)"/>
            <rect width="1200" height="420" fill="url(#spot2)"/>
          </svg>
        </div>

        <div className="today-hero-content">
          {/* Top meta row */}
          <div className="today-meta-row">
            <span className="today-eyebrow">
              <span className="today-live"><span className="dot"/>Live · Today's call</span>
            </span>
            <span className="today-meta-sep">·</span>
            <span>Day 24 of 36</span>
            <span className="today-meta-sep">·</span>
            <span>19 days to opening</span>
          </div>

          {/* Main row: date / call time */}
          <div className="today-main">
            <div className="today-date">
              <div className="today-weekday">Monday</div>
              <h1 className="today-headline">May <em>4</em></h1>
            </div>

            <div className="today-time">
              <div className="today-eyebrow" style={{color:"rgba(255,255,255,.5)"}}>Call</div>
              <div className="today-clock">7:00 <span>PM</span></div>
              <div className="today-til">in 4h 12m</div>
            </div>
          </div>

          {/* Stat row */}
          <div className="today-stats">
            <Stat label="Working"     primary="Act II — Stumble run" sub="Pages 42–72" />
            <Stat label="Cast called" primary="18 of 22"             sub="Walter Ek excused" warn />
            <Stat label="Location"    primary="Studio A"             sub="Wellman Theatre" />
            <Stat label="Until end"   primary="3h 30m"               sub="ending 10:30 PM" />
          </div>

          {/* Action row */}
          <div className="today-actions">
            <button className="btn-hero primary" onClick={() => goTab("reports")}>
              <OvI.Clipboard size={15}/>
              <span>File tonight's report</span>
              <OvI.ChevRight size={14} stroke={2}/>
            </button>
            <button className="btn-hero" onClick={() => goTab("video")}>
              <OvI.Film size={14}/><span>Rehearsal video</span>
            </button>
            <button className="btn-hero" onClick={() => goTab("blocking")}>
              <OvI.Move size={14}/><span>Stage blocking</span>
            </button>
            <button className="btn-hero" onClick={() => goTab("notes")}>
              <OvI.Pencil size={14}/><span>My notes</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Supporting row ────────────────────────────────────────────── */}
      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:16, marginTop:16}}>
        <div className="card">
          <div className="card-pad" style={{paddingBottom:8}}>
            <div className="row-between">
              <h3 className="h-card">Recent activity</h3>
              <button className="btn ghost" style={{height:26,padding:"0 8px",fontSize:12}}>View all</button>
            </div>
          </div>
          <div style={{padding:"4px 0 12px"}}>
            {OvNOTIFS.slice(0,5).map(n => {
              const Ico = OvI[n.ico] || OvI.Info;
              return (
                <div key={n.id} style={{padding:"10px 20px",display:"grid",gridTemplateColumns:"28px 1fr auto",gap:12,alignItems:"center",borderTop:"1px solid var(--border)"}}>
                  <div className="notif-ico" data-c={n.c}><Ico size={14}/></div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500}}>{n.title}</div>
                    <div className="muted" style={{fontSize:12}}>{n.body}</div>
                  </div>
                  <span className="muted" style={{fontSize:11.5}}>{n.when}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card card-pad">
          <div className="row-between" style={{marginBottom:12}}>
            <h3 className="h-card">Principals</h3>
            <span className="muted" style={{fontSize:11.5}}>{OvCAST.length} of 22</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {OvCAST.slice(0,6).map(c => (
              <div key={c.id} className="row" style={{gap:10}}>
                <div className="avatar" style={{width:26,height:26,fontSize:11,background:`var(--c-${c.color})`}}>{c.initials}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500}} className="truncate">{c.name}</div>
                  <div className="muted" style={{fontSize:11.5}}>{c.actor}</div>
                </div>
                <span className="pill" data-c={c.color}>{c.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero styles, scoped via classes */}
      <style>{`
        .today-hero{
          position:relative;
          border-radius: var(--radius-l);
          overflow:hidden;
          background:
            radial-gradient(120% 80% at 0% 0%, oklch(0.32 0.05 30) 0%, oklch(0.18 0.02 60) 60%) ,
            linear-gradient(135deg, oklch(0.22 0.025 40), oklch(0.14 0.015 60));
          color: oklch(0.98 0.005 75);
          box-shadow:
            0 1px 0 rgba(255,255,255,.04) inset,
            0 30px 60px -20px rgba(40,15,5,.45),
            0 8px 24px -8px rgba(40,15,5,.3);
          isolation:isolate;
        }
        .today-hero-bg{
          position:absolute; inset:0; pointer-events:none; z-index:0;
        }
        .today-hero-content{
          position:relative; z-index:1;
          padding: 28px 32px 26px;
          display:flex; flex-direction:column; gap:22px;
        }
        .today-meta-row{
          display:flex; align-items:center; gap:10px;
          font-size:12px; color: rgba(255,255,255,.62);
          font-variant-numeric: tabular-nums;
        }
        .today-meta-sep{ color: rgba(255,255,255,.25); }
        .today-eyebrow{
          font-size:11px; font-weight:600;
          letter-spacing:.1em; text-transform:uppercase;
          color:rgba(255,255,255,.7);
        }
        .today-live{
          display:inline-flex; align-items:center; gap:8px;
          padding: 4px 10px 4px 8px;
          background: color-mix(in oklch, var(--accent) 30%, transparent);
          border: 1px solid color-mix(in oklch, var(--accent) 60%, transparent);
          border-radius: 999px;
          color: oklch(0.96 0.04 30);
          font-size: 10.5px;
        }
        .today-live .dot{
          width:7px; height:7px; border-radius:50%;
          background: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 25%, transparent);
          animation: pulse 2.4s ease-in-out infinite;
        }

        .today-main{
          display:flex; align-items:flex-end; justify-content:space-between;
          gap: 32px; flex-wrap: wrap;
        }
        .today-weekday{
          font-size:13px; letter-spacing:.06em; text-transform:uppercase;
          color: rgba(255,255,255,.55);
          margin-bottom:4px;
        }
        .today-headline{
          margin:0;
          font-family: var(--font-display);
          font-weight: 500;
          font-size: clamp(56px, 10vw, 96px);
          line-height: .9;
          letter-spacing: -.03em;
        }
        .today-headline em{
          font-style: italic;
          color: var(--accent);
          font-weight: 400;
        }
        .today-time{
          text-align:right;
          display:flex; flex-direction:column; gap:4px; align-items:flex-end;
        }
        .today-clock{
          font-family: var(--font-display);
          font-weight: 500;
          font-size: clamp(38px, 6vw, 56px);
          line-height: 1;
          letter-spacing: -.02em;
          font-variant-numeric: tabular-nums;
        }
        .today-clock span{
          font-size:.5em;
          color: rgba(255,255,255,.55);
          font-style: italic;
          font-weight: 400;
          margin-left: 4px;
        }
        .today-til{
          font-size: 12.5px;
          color: rgba(255,255,255,.55);
          font-variant-numeric: tabular-nums;
        }

        .today-stats{
          display:grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0;
          border-top: 1px solid rgba(255,255,255,.1);
          border-bottom: 1px solid rgba(255,255,255,.1);
          padding: 14px 0;
          margin: 4px -4px 0;
        }
        .today-stat{
          padding: 0 16px;
          border-left: 1px solid rgba(255,255,255,.08);
          display:flex; flex-direction:column; gap:4px;
        }
        .today-stat:first-child{ border-left:0; }
        .today-stat-label{
          font-size: 10.5px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase;
          color: rgba(255,255,255,.42);
        }
        .today-stat-primary{
          font-size: 15px; font-weight: 500;
          color: oklch(0.98 0.005 75);
          line-height: 1.3;
        }
        .today-stat-sub{
          font-size: 11.5px;
          color: rgba(255,255,255,.5);
        }
        .today-stat[data-warn="1"] .today-stat-primary{
          color: oklch(0.88 0.13 75);
        }

        .today-actions{
          display:flex; flex-wrap: wrap; gap: 8px;
        }
        .btn-hero{
          appearance:none;
          height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06);
          color: oklch(0.96 0.005 75);
          font: 500 13px/1 var(--font-ui);
          display:inline-flex; align-items:center; gap:8px;
          cursor: pointer;
          transition: background .14s, border-color .14s, transform .06s;
          backdrop-filter: blur(8px);
        }
        .btn-hero:hover{
          background: rgba(255,255,255,.1);
          border-color: rgba(255,255,255,.22);
        }
        .btn-hero:active{ transform: translateY(.5px); }
        .btn-hero.primary{
          background: var(--accent);
          color: white;
          border-color: var(--accent);
          padding-right: 10px;
          box-shadow: 0 6px 18px -6px var(--accent),
                      0 1px 0 rgba(255,255,255,.18) inset;
        }
        .btn-hero.primary:hover{
          background: color-mix(in oklch, var(--accent) 90%, white);
          border-color: color-mix(in oklch, var(--accent) 90%, white);
        }

        @media (max-width: 720px){
          .today-stats{ grid-template-columns: repeat(2, 1fr); gap: 14px 0; }
          .today-stat{ padding: 0 14px; }
          .today-stat:nth-child(3){ border-left: 0; }
        }
      `}</style>
    </div>
  );
}

function Stat({ label, primary, sub, warn }) {
  return (
    <div className="today-stat" data-warn={warn ? "1" : "0"}>
      <div className="today-stat-label">{label}</div>
      <div className="today-stat-primary">{primary}</div>
      <div className="today-stat-sub">{sub}</div>
    </div>
  );
}

window.TabOverview = TabOverview;
