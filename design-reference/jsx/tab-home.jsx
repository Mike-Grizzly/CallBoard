// Workspace Home — personal landing across all productions.
// Sections (in order):
//   1. Greeting + "Right now" strip — what's happening today across productions
//   2. Announcements — broadcasts (org-wide & production-wide), with scope
//   3. Productions browser — every production Maya is on
//   4. @Mentions — directed mentions across productions
//   5. Pinned — notes & documents Maya has pinned

const { I: HI } = window;
const { ME: H_ME, PRODUCTIONS: H_PRODS, CAST: H_CAST } = window.DATA;

// ─── Mock data (workspace-level) ────────────────────────────────────
const TODAY = { weekday: "Monday", date: "May 4", time: "4:48 PM" };

const RIGHT_NOW = [
  { prodId:"pirates",   when:"Tonight 7:00 PM",  what:"Act II Stumble run",  where:"Studio A · Wellman",   role:"Stage Manager",       called:"18 of 22", urgency:"hot" },
  { prodId:"mikado",    when:"Tomorrow 10 AM",   what:"Design presentation", where:"Studio B",              role:"Asst. Stage Manager", called:"6 of 6",   urgency:"warm" },
  { prodId:"ruddigore", when:"Closed",           what:"Archive — strike done",where:"—",                    role:"PA",                  called:"—",        urgency:"cold" },
];

const ANNOUNCEMENTS = [
  {
    id:"a1", scope:"org", scopeLabel:"All productions",
    from:{ name:"Patrice Boudreau", role:"Operations · Wellman", initials:"PB", color:"sand" },
    title:"Building-wide fire safety drill — Wed May 6, 10 AM",
    body:"Wellman Theatre will conduct a 20-minute evacuation drill. Pause rehearsals at 9:55. Assembly point: loading dock.",
    when:"2h ago", pinned:true, ack:14, total:38, c:"amber",
  },
  {
    id:"a2", scope:"prod", scopeLabel:"Pirates of Penzance",
    from:{ name:"Eleanor Bryce", role:"Director", initials:"EB", color:"clay" },
    title:"Sitzprobe rescheduled — Sat May 9, 1:00 PM",
    body:"Studio B confirmed. Score copies will be at the SM table by Friday EOD. Vocalists please arrive 30 min early.",
    when:"yesterday", pinned:false, ack:11, total:22, c:"dusk",
  },
  {
    id:"a3", scope:"org", scopeLabel:"All productions",
    from:{ name:"Maya Okafor", role:"Stage Manager", initials:"MO", color:"accent" },
    title:"Strike crew dinner — Sat May 11, 6:30 PM",
    body:"Joining at Riccardo's on 7th. RSVP on the company sheet by Friday. Producer's paying for the first round.",
    when:"2 days ago", pinned:false, ack:22, total:38, c:"sage",
  },
];

const MENTIONS = [
  { id:"m1", prod:"pirates", from:{name:"Eleanor Bryce", initials:"EB", color:"clay", role:"Director"},
    where:"Report R-11", whereIcon:"Clipboard",
    snippet:"@Maya can we revisit Mabel's entrance timing? Felt rushed at bar 47 — let's give her a beat before the chorus pickup.",
    when:"12m", unread:true },
  { id:"m2", prod:"pirates", from:{name:"Adaeze Ife", initials:"AI", color:"plum", role:"Costume Designer"},
    where:"Daughters chorus — diction (note)", whereIcon:"Pencil",
    snippet:"@Maya bloomer fittings for Edith & Kate need a confirmed slot — Friday 4–6 still good?",
    when:"1h", unread:true },
  { id:"m3", prod:"pirates", from:{name:"Helena Voss", initials:"HV", color:"dusk", role:"Music Director"},
    where:"Pirates_VocalScore_v3.pdf", whereIcon:"FileMusic",
    snippet:"@Maya score v3 is posted — can you distribute to the design team and flag Frederic's high B for the call?",
    when:"3h", unread:true },
  { id:"m4", prod:"mikado", from:{name:"Sergei Karavaev", initials:"SK", color:"sand", role:"Scenic Designer"},
    where:"Mikado · Design presentation", whereIcon:"Layout",
    snippet:"@Maya bringing the white model tomorrow — we'll need a 4x6 ft surface near the projector.",
    when:"5h", unread:false },
  { id:"m5", prod:"pirates", from:{name:"Renaud Tremblay", initials:"RT", color:"amber", role:"Lighting Designer"},
    where:"Cue Sheet — Lighting v2.pdf", whereIcon:"FilePdf",
    snippet:"@Maya re: cue 87 — director wants it trimmed by 2 counts. Adding the change in v3.",
    when:"yesterday", unread:false },
];

const PINS = [
  { id:"p1", kind:"doc",  ico:"FilePdf", title:"Wed call sheet — May 6",   meta:"Pirates · Admin",        when:"updated 12m" },
  { id:"p2", kind:"note", ico:"Pencil",  title:"Mabel's entrance — staging tweak", meta:"Pirates · Notes", when:"yesterday" },
  { id:"p3", kind:"doc",  ico:"FileMusic", title:"Score v3 — Act II",      meta:"Pirates · Score",        when:"yesterday" },
  { id:"p4", kind:"doc",  ico:"FilePdf", title:"Wellman ground plan",      meta:"Pirates · Set",          when:"1 wk ago" },
  { id:"p5", kind:"note", ico:"Pencil",  title:"Strike list — Pirates",    meta:"Pirates · Notes",        when:"2 days ago" },
  { id:"p6", kind:"doc",  ico:"FilePdf", title:"Company contact sheet",    meta:"Workspace · Admin",      when:"1 wk ago" },
];

const PROD_DETAILS = {
  pirates:   { dir:"Eleanor Bryce", opens:"Sat, May 23", principals:["TM","PA","MB","WE","IH"], next:"Tonight 7:00 PM", nextWhat:"Act II Stumble" },
  mikado:    { dir:"Jules Renforth", opens:"Jun 18",     principals:["NQ","SP","LR","JL"],       next:"Tomorrow 10 AM", nextWhat:"Design presentation" },
  ruddigore: { dir:"Eleanor Bryce", opens:"Closed Apr 12", principals:[],                          next:"—",              nextWhat:"Archive" },
};

// ─── Page ────────────────────────────────────────────────────────────
function TabHome({ onPickProd }) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Working late";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="page-narrow anim-in home">
      <HomeHero greeting={greeting} />
      <RightNow items={RIGHT_NOW} onPickProd={onPickProd} />
      <AnnouncementsBlock items={ANNOUNCEMENTS} />
      <ProductionsBrowser productions={H_PRODS} onPickProd={onPickProd} />
      <MentionsBlock items={MENTIONS} />
      <PinnedBlock items={PINS} />
      <HomeStyles />
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────
function HomeHero({ greeting }) {
  return (
    <section className="home-hero">
      <div className="home-hero-meta">
        <span className="home-hero-eyebrow">Workspace · {H_ME.role}</span>
        <span className="home-hero-sep">·</span>
        <span>{TODAY.weekday}, {TODAY.date}</span>
        <span className="home-hero-sep">·</span>
        <span className="mono">{TODAY.time}</span>
      </div>
      <h1 className="home-hero-title">
        {greeting}, <em>{H_ME.name.split(" ")[0]}</em>.
      </h1>
      <p className="home-hero-sub">
        Three productions on your desk · <b>3 new mentions</b> · <b>1 new announcement</b> · next call in <b>4h 12m</b>.
      </p>
    </section>
  );
}

// ─── Right Now strip ─────────────────────────────────────────────────
function RightNow({ items, onPickProd }) {
  return (
    <section className="home-section right-now">
      <SectionHead eyebrow="Right now" title="Across your productions" />
      <div className="right-now-grid">
        {items.map(it => {
          const prod = H_PRODS.find(p => p.id === it.prodId);
          return (
            <button key={it.prodId} className="rn-card" data-u={it.urgency}
                    onClick={() => onPickProd && onPickProd(it.prodId)}>
              <div className="rn-spine" style={{background: prod.color}} />
              <div className="rn-body">
                <div className="rn-prod">
                  <span className="rn-prod-name">{prod.title}</span>
                  <span className="rn-role">{it.role}</span>
                </div>
                <div className="rn-when">{it.when}</div>
                <div className="rn-what">{it.what}</div>
                <div className="rn-foot">
                  <span>{it.where}</span>
                  <span className="rn-pip" />
                  <span className="mono">{it.called}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Announcements ───────────────────────────────────────────────────
function AnnouncementsBlock({ items }) {
  const [filter, setFilter] = React.useState("all");
  const filtered = filter === "all" ? items : items.filter(a => a.scope === filter);
  return (
    <section className="home-section">
      <SectionHead
        eyebrow="Announcements"
        title="Broadcast to the company"
        right={
          <div className="seg">
            <button data-on={filter==="all"}    onClick={()=>setFilter("all")}>All</button>
            <button data-on={filter==="org"}    onClick={()=>setFilter("org")}>Workspace</button>
            <button data-on={filter==="prod"}   onClick={()=>setFilter("prod")}>Productions</button>
            <button className="seg-cta"><HI.Plus size={12}/>New</button>
          </div>
        }
      />
      <div className="ann-list">
        {filtered.map(a => (
          <article key={a.id} className="ann-card">
            <div className="ann-rail" data-c={a.c} />
            <div className="ann-main">
              <header className="ann-header">
                <div className="row" style={{gap:10}}>
                  <div className="avatar" style={{width:26,height:26,fontSize:11,
                    background: a.from.color === "accent" ? "var(--accent)" : `var(--c-${a.from.color})`}}>
                    {a.from.initials}
                  </div>
                  <div>
                    <div className="ann-from">{a.from.name} <span className="muted">· {a.from.role}</span></div>
                    <div className="ann-meta">
                      <span className="pill" data-c={a.scope==="org" ? "accent" : "dusk"}>
                        {a.scope==="org" ? <HI.Layers size={10}/> : <HI.Mask size={10}/>}
                        {a.scopeLabel}
                      </span>
                      <span className="muted">·</span>
                      <span className="muted">{a.when}</span>
                      {a.pinned && <><span className="muted">·</span><span className="muted ann-pinned"><HI.Pin size={11}/> Pinned</span></>}
                    </div>
                  </div>
                </div>
                <button className="btn ghost btn-icon" title="More"><HI.MoreV size={14}/></button>
              </header>
              <h3 className="ann-title">{a.title}</h3>
              <p className="ann-body">{a.body}</p>
              <footer className="ann-foot">
                <div className="ann-ack">
                  <div className="ann-ack-bar">
                    <div className="ann-ack-fill" style={{width: `${(a.ack/a.total)*100}%`}} />
                  </div>
                  <span className="mono">{a.ack}/{a.total} acknowledged</span>
                </div>
                <div className="row gap-sm">
                  <button className="btn ghost" style={{height:28,padding:"0 10px",fontSize:12}}>
                    <HI.Check size={12}/> Acknowledge
                  </button>
                  <button className="btn ghost" style={{height:28,padding:"0 10px",fontSize:12}}>
                    Reply
                  </button>
                </div>
              </footer>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── Productions browser ─────────────────────────────────────────────
function ProductionsBrowser({ productions, onPickProd }) {
  return (
    <section className="home-section">
      <SectionHead
        eyebrow="Productions"
        title="Your shows"
        right={
          <div className="row gap-sm">
            <button className="btn ghost" style={{height:28,padding:"0 10px",fontSize:12}}>
              <HI.Filter size={12}/> All roles
            </button>
            <button className="btn" style={{height:28,padding:"0 10px",fontSize:12}}>
              <HI.Plus size={12}/> New production
            </button>
          </div>
        }
      />
      <div className="prod-cards">
        {productions.map(p => {
          const d = PROD_DETAILS[p.id] || {};
          return (
            <article key={p.id} className="prod-card" data-status={p.status.toLowerCase()}
                     onClick={() => onPickProd && onPickProd(p.id)}>
              <div className="prod-card-head">
                <span className="prod-card-status">
                  <span className="prod-card-dot" style={{background:p.color}} />
                  {p.status}
                </span>
                {p.unread > 0 && <span className="prod-card-unread">{p.unread} new</span>}
              </div>
              <h3 className="prod-card-title">{p.title}</h3>
              <div className="prod-card-meta">
                <span>{p.venue}</span>
                <span className="rn-pip" />
                <span>{p.week}</span>
              </div>

              <div className="prod-card-people">
                {d.principals && d.principals.slice(0,4).map((init, i) => {
                  const c = H_CAST.find(x => x.initials === init);
                  return (
                    <div key={i} className="avatar prod-card-avatar"
                         style={{background: c ? `var(--c-${c.color})` : "var(--ink-4)"}}>{init}</div>
                  );
                })}
                {d.principals && d.principals.length > 4 && (
                  <div className="avatar prod-card-avatar prod-card-more">+{d.principals.length-4}</div>
                )}
                {(!d.principals || d.principals.length===0) && (
                  <span className="muted" style={{fontSize:11.5}}>No active cast</span>
                )}
              </div>

              <div className="prod-card-foot">
                <div>
                  <div className="prod-card-foot-label">My role</div>
                  <div className="prod-card-foot-val">{p.role}</div>
                </div>
                <div>
                  <div className="prod-card-foot-label">Opens</div>
                  <div className="prod-card-foot-val">{d.opens}</div>
                </div>
                <div>
                  <div className="prod-card-foot-label">Next</div>
                  <div className="prod-card-foot-val prod-card-next">{d.next}</div>
                </div>
              </div>
              <div className="prod-card-cta">
                Open hub <HI.ChevRight size={14} stroke={2}/>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ─── @Mentions ───────────────────────────────────────────────────────
function MentionsBlock({ items }) {
  const [tab, setTab] = React.useState("unread");
  const filtered = tab === "unread" ? items.filter(m => m.unread) : items;
  return (
    <section className="home-section">
      <SectionHead
        eyebrow="@Mentions"
        title="Things waiting on you"
        right={
          <div className="seg">
            <button data-on={tab==="unread"} onClick={()=>setTab("unread")}>
              Unread <span className="seg-count">{items.filter(m=>m.unread).length}</span>
            </button>
            <button data-on={tab==="all"} onClick={()=>setTab("all")}>All</button>
          </div>
        }
      />
      <div className="mentions-list">
        {filtered.map(m => {
          const Ico = HI[m.whereIcon] || HI.Info;
          const prod = H_PRODS.find(p => p.id === m.prod);
          return (
            <article key={m.id} className="mention" data-unread={m.unread ? "1":"0"}>
              <div className="avatar mention-avatar" style={{background: `var(--c-${m.from.color})`}}>
                {m.from.initials}
              </div>
              <div className="mention-body">
                <div className="mention-head">
                  <span className="mention-from">{m.from.name}</span>
                  <span className="muted">· {m.from.role}</span>
                </div>
                <p className="mention-snippet">
                  {m.snippet.split(/(@\w+)/).map((part, i) =>
                    part.startsWith("@")
                      ? <span key={i} className="mention-tag">{part}</span>
                      : <React.Fragment key={i}>{part}</React.Fragment>
                  )}
                </p>
                <div className="mention-foot">
                  <span className="mention-chip">
                    <span className="prod-dot" style={{background:prod.color, width:7, height:7}} />
                    {prod.title}
                  </span>
                  <span className="mention-chip">
                    <Ico size={11}/> {m.where}
                  </span>
                </div>
              </div>
              <div className="mention-side">
                <span className="muted mono" style={{fontSize:11}}>{m.when}</span>
                <button className="btn ghost" style={{height:26,padding:"0 8px",fontSize:11.5}}>Open</button>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div className="mention-empty">
            <HI.Check size={20}/>
            <div>You're caught up — no unread mentions.</div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Pinned ──────────────────────────────────────────────────────────
function PinnedBlock({ items }) {
  return (
    <section className="home-section pin-section">
      <SectionHead
        eyebrow="Pinned"
        title="Always at hand"
        right={
          <button className="btn ghost" style={{height:28,padding:"0 10px",fontSize:12}}>
            <HI.Pin size={12}/> Manage pins
          </button>
        }
      />
      <div className="pin-grid">
        {items.map(p => {
          const Ico = HI[p.ico] || HI.File;
          return (
            <button key={p.id} className="pin-card" data-kind={p.kind}>
              <div className="pin-icon"><Ico size={16}/></div>
              <div className="pin-body">
                <div className="pin-title truncate">{p.title}</div>
                <div className="pin-meta truncate">{p.meta}</div>
              </div>
              <div className="pin-when">{p.when}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Section header helper ───────────────────────────────────────────
function SectionHead({ eyebrow, title, right }) {
  return (
    <header className="home-section-head">
      <div>
        <div className="h-eyebrow">{eyebrow}</div>
        <h2 className="h-section">{title}</h2>
      </div>
      {right}
    </header>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
function HomeStyles() {
  return (
    <style>{`
      .home{ display:flex; flex-direction:column; gap:36px; padding-bottom:60px; }
      .home-section{ display:flex; flex-direction:column; gap:14px; }
      .home-section-head{
        display:flex; align-items:flex-end; justify-content:space-between;
        gap:16px; margin-bottom:2px;
      }
      .home-section-head .h-eyebrow{ margin-bottom:4px; }

      /* Hero */
      .home-hero{
        padding: 14px 0 6px;
        border-bottom: 1px solid var(--border);
      }
      .home-hero-meta{
        display:flex; align-items:center; gap:8px;
        font-size:12px; color: var(--ink-3);
        margin-bottom:10px;
      }
      .home-hero-eyebrow{ text-transform:uppercase; letter-spacing:.08em; font-weight:600; font-size:11px; color: var(--ink-4); }
      .home-hero-sep{ color: var(--ink-4); }
      .home-hero-title{
        margin:0 0 8px;
        font-family: var(--font-display);
        font-size: clamp(36px, 5vw, 54px);
        font-weight: 500;
        letter-spacing: -.022em;
        line-height: 1.02;
      }
      .home-hero-title em{ font-style: italic; color: var(--accent); font-weight: 400; }
      .home-hero-sub{
        margin: 0 0 16px;
        font-size: 14.5px; color: var(--ink-3);
      }
      .home-hero-sub b{ color: var(--ink); font-weight:500; }

      /* Right Now */
      .right-now-grid{
        display:grid;
        grid-template-columns: repeat(3, minmax(0,1fr));
        gap: 12px;
      }
      .rn-card{
        appearance:none; text-align:left; cursor:pointer;
        position:relative;
        background: var(--bg-elev);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 14px 16px 14px 22px;
        box-shadow: var(--shadow-1);
        display:flex; flex-direction:column; gap:6px;
        transition: border-color .14s, transform .08s, box-shadow .14s;
        font-family: inherit; color: inherit;
      }
      .rn-card:hover{ border-color: var(--border-strong); transform: translateY(-1px); box-shadow: var(--shadow-2); }
      .rn-card[data-u="cold"]{ opacity: .7; }
      .rn-spine{
        position:absolute; left:0; top:14px; bottom:14px;
        width:3px; border-radius: 0 2px 2px 0;
      }
      .rn-card[data-u="hot"] .rn-spine{ box-shadow: 0 0 0 2px color-mix(in oklch, var(--accent) 20%, transparent); }
      .rn-prod{
        display:flex; align-items:center; justify-content:space-between; gap:8px;
        margin-bottom: 2px;
      }
      .rn-prod-name{ font-size:11.5px; font-weight:500; color: var(--ink-3); letter-spacing:.01em; }
      .rn-role{ font-size:10.5px; color: var(--ink-4); }
      .rn-when{
        font-size: 12px; font-weight:600; color: var(--ink-3);
        letter-spacing: .04em; text-transform: uppercase;
      }
      .rn-card[data-u="hot"] .rn-when{ color: var(--accent-ink); }
      .rn-what{
        font-family: var(--font-display);
        font-size: 22px; font-weight: 500;
        letter-spacing: -.012em; line-height: 1.2;
        color: var(--ink);
      }
      .rn-foot{
        display:flex; align-items:center; gap:8px;
        font-size: 12px; color: var(--ink-3);
        margin-top:2px;
      }
      .rn-pip{
        width:3px; height:3px; border-radius:50%;
        background: var(--ink-4); display:inline-block; flex-shrink:0;
      }

      /* Segmented control */
      .seg{
        display:inline-flex; align-items:center; gap:2px;
        background: var(--bg-sunken);
        padding: 3px;
        border-radius: 999px;
        border: 1px solid var(--border);
      }
      .seg button{
        appearance:none; background: none; border:0;
        padding: 4px 10px; height: 24px;
        font: 500 12px var(--font-ui);
        color: var(--ink-3); cursor: pointer;
        border-radius: 999px;
        display:inline-flex; align-items:center; gap:5px;
        transition: background .12s, color .12s;
      }
      .seg button:hover{ color: var(--ink); }
      .seg button[data-on="true"]{
        background: var(--bg-elev); color: var(--ink);
        box-shadow: var(--shadow-1);
      }
      .seg-count{
        font-size: 10.5px; font-variant-numeric: tabular-nums;
        background: var(--accent); color: white;
        border-radius: 999px; padding: 0 5px; min-width: 16px;
        display:inline-grid; place-items:center; height: 15px;
      }
      .seg-cta{ color: var(--ink) !important; }

      /* Announcements */
      .ann-list{ display:flex; flex-direction:column; gap: 10px; }
      .ann-card{
        display:flex; gap:0;
        background: var(--bg-elev);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow-1);
        overflow:hidden;
      }
      .ann-rail{
        width: 4px; flex-shrink:0;
        background: var(--ink-4);
      }
      .ann-rail[data-c="amber"]{ background: var(--c-amber); }
      .ann-rail[data-c="sage"] { background: var(--c-sage); }
      .ann-rail[data-c="dusk"] { background: var(--c-dusk); }
      .ann-rail[data-c="clay"] { background: var(--c-clay); }
      .ann-main{ flex:1; padding: 14px 18px 14px 16px; display:flex; flex-direction:column; gap:8px; }
      .ann-header{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
      .ann-from{ font-size: 13px; font-weight: 500; color: var(--ink); }
      .ann-meta{
        display:flex; align-items:center; gap:6px;
        font-size: 11.5px; color: var(--ink-4);
        margin-top: 2px; flex-wrap:wrap;
      }
      .ann-meta .pill{ height:18px; font-size: 10.5px; }
      .ann-meta .pill svg{ width:10px; height:10px; }
      .ann-pinned{ display:inline-flex; align-items:center; gap:3px; }
      .ann-title{
        margin: 2px 0 0;
        font-family: var(--font-display);
        font-size: 19px; font-weight: 500;
        letter-spacing: -.012em; line-height: 1.25;
        color: var(--ink);
      }
      .ann-body{
        margin: 0;
        font-size: 13.5px; color: var(--ink-2);
        line-height: 1.55;
        text-wrap: pretty;
      }
      .ann-foot{
        display:flex; align-items:center; justify-content:space-between; gap:12px;
        margin-top: 4px;
      }
      .ann-ack{ display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
      .ann-ack-bar{
        flex:1; max-width: 180px; height: 4px;
        background: var(--bg-sunken);
        border-radius: 999px; overflow:hidden;
      }
      .ann-ack-fill{
        height:100%;
        background: var(--c-sage);
        border-radius: inherit;
      }
      .ann-ack .mono{ font-size: 11px; color: var(--ink-3); }

      /* Productions */
      .prod-cards{
        display:grid;
        grid-template-columns: repeat(3, minmax(0,1fr));
        gap: 14px;
      }
      .prod-card{
        position:relative;
        background: var(--bg-elev);
        border: 1px solid var(--border);
        border-radius: var(--radius-l);
        padding: 18px 18px 16px;
        box-shadow: var(--shadow-1);
        cursor:pointer;
        display:flex; flex-direction:column; gap:12px;
        transition: border-color .14s, transform .08s, box-shadow .14s;
        text-align:left; appearance:none;
        font-family: inherit; color: inherit;
      }
      .prod-card:hover{
        border-color: var(--border-strong);
        transform: translateY(-2px);
        box-shadow: var(--shadow-2);
      }
      .prod-card[data-status="archived"]{ opacity: .65; }
      .prod-card[data-status="archived"]:hover{ opacity: .8; }
      .prod-card-head{
        display:flex; align-items:center; justify-content:space-between; gap:8px;
      }
      .prod-card-status{
        display:inline-flex; align-items:center; gap:6px;
        font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
        color: var(--ink-3);
      }
      .prod-card-dot{
        width: 8px; height: 8px; border-radius: 50%;
      }
      .prod-card-unread{
        font-size: 10.5px; font-weight: 600;
        background: var(--accent); color: white;
        padding: 2px 8px; border-radius: 999px;
        letter-spacing: .02em;
      }
      .prod-card-title{
        margin:0;
        font-family: var(--font-display);
        font-size: 22px; font-weight: 500;
        letter-spacing: -.018em; line-height: 1.15;
        color: var(--ink);
      }
      .prod-card-meta{
        display:flex; align-items:center; gap:8px;
        font-size: 12px; color: var(--ink-3);
      }
      .prod-card-people{
        display:flex; align-items:center; gap: -6px;
        min-height: 26px;
      }
      .prod-card-avatar{
        width: 26px; height: 26px; font-size: 10.5px;
        border: 2px solid var(--bg-elev);
        margin-left: -6px;
      }
      .prod-card-avatar:first-child{ margin-left: 0; }
      .prod-card-more{
        background: var(--bg-sunken) !important;
        color: var(--ink-3) !important;
      }
      .prod-card-foot{
        display:grid;
        grid-template-columns: repeat(3, minmax(0,1fr));
        gap: 8px;
        padding-top: 12px;
        border-top: 1px dashed var(--border);
      }
      .prod-card-foot-label{
        font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
        color: var(--ink-4);
      }
      .prod-card-foot-val{
        font-size: 12.5px; color: var(--ink); font-weight: 500;
        margin-top: 2px;
      }
      .prod-card-next{ color: var(--accent-ink); }
      .prod-card-cta{
        position:absolute; top: 16px; right: 16px;
        display:flex; align-items:center; gap: 3px;
        font-size: 11.5px; font-weight: 500; color: var(--ink-3);
        opacity: 0; transition: opacity .14s, color .14s;
      }
      .prod-card:hover .prod-card-cta{ opacity:1; color: var(--accent); }

      /* Mentions */
      .mentions-list{
        background: var(--bg-elev);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow-1);
        overflow: hidden;
      }
      .mention{
        display:grid;
        grid-template-columns: 32px 1fr auto;
        gap: 12px;
        padding: 14px 18px;
        border-top: 1px solid var(--border);
        position: relative;
      }
      .mention:first-child{ border-top: 0; }
      .mention[data-unread="1"]{ background: color-mix(in oklch, var(--accent-soft) 35%, var(--bg-elev)); }
      .mention[data-unread="1"]::before{
        content:"";
        position:absolute; left:6px; top:22px;
        width: 4px; height: 4px; border-radius: 50%;
        background: var(--accent);
      }
      .mention-avatar{ width: 32px; height: 32px; font-size: 12px; }
      .mention-body{ min-width: 0; }
      .mention-head{
        display:flex; align-items:baseline; gap: 4px;
        font-size: 13px;
      }
      .mention-from{ font-weight: 500; color: var(--ink); }
      .mention-snippet{
        margin: 4px 0 8px;
        font-size: 13.5px; color: var(--ink-2);
        line-height: 1.5;
        text-wrap: pretty;
      }
      .mention-tag{
        color: var(--accent-ink);
        background: var(--accent-soft);
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 500;
      }
      .mention-foot{
        display:flex; align-items:center; gap: 8px;
        flex-wrap: wrap;
      }
      .mention-chip{
        display:inline-flex; align-items:center; gap: 5px;
        font-size: 11.5px; color: var(--ink-3);
        padding: 2px 8px;
        background: var(--bg-sunken);
        border-radius: 999px;
      }
      .mention-side{
        display:flex; flex-direction:column; align-items:flex-end;
        gap: 6px; padding-top: 1px;
      }
      .mention-empty{
        padding: 36px 18px;
        text-align:center;
        color: var(--ink-3);
        display:flex; flex-direction:column; align-items:center; gap: 10px;
      }
      .mention-empty svg{ color: var(--c-sage); }

      /* Pinned */
      .pin-grid{
        display:grid;
        grid-template-columns: repeat(3, minmax(0,1fr));
        gap: 10px;
      }
      .pin-card{
        appearance:none; text-align:left; cursor:pointer;
        background: var(--bg-elev);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 12px 14px;
        display:grid;
        grid-template-columns: 32px 1fr auto;
        gap: 12px; align-items:center;
        font-family: inherit; color: inherit;
        transition: border-color .12s, background .12s;
      }
      .pin-card:hover{
        border-color: var(--border-strong);
        background: var(--bg-muted);
      }
      .pin-icon{
        width: 32px; height: 32px; border-radius: 8px;
        background: var(--bg-sunken);
        display:grid; place-items:center;
        color: var(--ink-3);
      }
      .pin-card[data-kind="note"] .pin-icon{ background: var(--accent-soft); color: var(--accent-ink); }
      .pin-title{ font-size: 13px; font-weight: 500; color: var(--ink); margin-bottom: 2px; }
      .pin-meta{ font-size: 11.5px; color: var(--ink-3); }
      .pin-when{ font-size: 11px; color: var(--ink-4); white-space: nowrap; }

      /* Responsive */
      @media (max-width: 980px){
        .right-now-grid, .prod-cards, .pin-grid{
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 680px){
        .right-now-grid, .prod-cards, .pin-grid{
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}

window.TabHome = TabHome;
