// Quick Add modal — a 10-second path to create a production.
// Just title + opening date. Lands you on the dashboard immediately;
// everything else can be filled in from production settings.

const { I: QaI } = window;

function QuickAddModal({ open, onClose, onCreate, onOpenFull }) {
  const [title, setTitle] = React.useState("");
  const [opening, setOpening] = React.useState("");
  const titleRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setTitle(""); setOpening("");
      setTimeout(() => titleRef.current?.focus(), 80);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && title.trim() && (e.metaKey || e.ctrlKey)) submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, title, opening]);

  if (!open) return null;

  const submit = () => {
    if (!title.trim()) return;
    onCreate({ title: title.trim(), opening });
  };

  return (
    <div className="qa-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="qa-modal anim-in-pop" role="dialog" aria-modal="true">
        <div className="qa-header">
          <div>
            <div className="h-eyebrow" style={{fontSize:10.5,letterSpacing:".08em",textTransform:"uppercase",color:"var(--ink-4)",fontWeight:600}}>Quick add</div>
            <div style={{fontFamily:"var(--font-display)",fontSize:22,fontWeight:500,marginTop:2,letterSpacing:"-.01em"}}>New production</div>
          </div>
          <button className="btn ghost btn-icon" onClick={onClose} title="Close (Esc)">
            <QaI.X size={14}/>
          </button>
        </div>

        <div className="qa-body">
          <div className="qa-field">
            <label className="qa-label">Title</label>
            <input ref={titleRef} className="qa-input lg" value={title}
                   placeholder="The Pirates of Penzance"
                   onChange={e => setTitle(e.target.value)}/>
          </div>
          <div className="qa-field">
            <label className="qa-label">Opening night <span style={{color:"var(--ink-4)",fontWeight:400}}>· optional</span></label>
            <input className="qa-input" type="date" value={opening}
                   onChange={e => setOpening(e.target.value)}/>
            <div className="qa-hint">You can add cast, departments, calendar, and team from production settings any time.</div>
          </div>
        </div>

        <div className="qa-footer">
          <button className="qa-btn ghost" onClick={() => { onClose(); onOpenFull(); }}>
            <QaI.Layers size={13}/><span>Full setup instead</span>
          </button>
          <div style={{flex:1}}/>
          <button className="qa-btn" onClick={onClose}>Cancel</button>
          <button className="qa-btn primary" onClick={submit} disabled={!title.trim()}
                  style={{opacity: title.trim() ? 1 : .4}}>
            <span>Create</span>
            <QaI.ChevRight size={13}/>
          </button>
        </div>
      </div>

      <style>{`
        .qa-backdrop{
          position: fixed; inset: 0; z-index: 250;
          background: color-mix(in oklch, var(--ink) 35%, transparent);
          backdrop-filter: blur(3px);
          display: grid; place-items: center;
          padding: 24px;
          animation: qa-fade .14s ease-out;
        }
        @keyframes qa-fade { from { opacity:0; } to { opacity:1; } }
        .qa-modal{
          width: min(460px, 100%);
          background: var(--bg-elev);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 30px 80px -20px rgba(40,15,5,.35),
                      0 8px 24px -8px rgba(40,15,5,.25);
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .anim-in-pop{ animation: qa-pop .2s cubic-bezier(.2,.9,.3,1.2); }
        @keyframes qa-pop {
          from { opacity:0; transform: translateY(8px) scale(.97); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        .qa-header{
          display:flex; align-items:flex-start; justify-content:space-between;
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--border);
        }
        .qa-body{
          padding: 18px 20px 8px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .qa-field{ display:flex; flex-direction:column; gap:6px; }
        .qa-label{
          font-size: 11.5px; letter-spacing:.05em; text-transform:uppercase;
          color: var(--ink-3); font-weight: 600;
        }
        .qa-input{
          appearance: none; width: 100%;
          height: 40px; padding: 0 12px;
          border: 1px solid var(--border-strong);
          border-radius: 8px;
          background: var(--bg-elev);
          font: 14px var(--font-ui); color: var(--ink);
          outline: none;
          transition: border-color .12s, box-shadow .12s;
        }
        .qa-input.lg{ height: 46px; font-size: 17px; font-family: var(--font-display); font-weight: 500; }
        .qa-input:focus{ border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
        .qa-hint{ font-size: 12px; color: var(--ink-4); margin-top: 2px; line-height:1.45; }
        .qa-footer{
          display: flex; align-items: center; gap: 8px;
          padding: 12px 14px;
          border-top: 1px solid var(--border);
          background: var(--bg-sunken);
        }
        .qa-btn{
          appearance: none;
          border: 1px solid var(--border-strong);
          background: var(--bg-elev);
          color: var(--ink);
          height: 34px; padding: 0 12px;
          border-radius: 7px;
          font: 500 13px var(--font-ui);
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px;
          transition: background .1s, border-color .1s;
        }
        .qa-btn:hover{ background: var(--bg-muted); }
        .qa-btn.ghost{ border-color: transparent; background: transparent; color: var(--ink-3); }
        .qa-btn.ghost:hover{ background: var(--bg-muted); color: var(--ink); }
        .qa-btn.primary{
          background: var(--accent); color: white; border-color: var(--accent);
          box-shadow: 0 1px 0 rgba(255,255,255,.18) inset, 0 1px 2px rgba(120,30,15,.25);
        }
        .qa-btn.primary:hover{ background: color-mix(in oklch, var(--accent) 90%, black); }
      `}</style>
    </div>
  );
}

// Small dropdown popover that appears next to the rail's "+" button.
// Two entry points: Quick add (small modal) vs Full setup (overlay).
function NewProductionMenu({ open, onClose, onQuick, onFull, anchor }) {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  // Re-measure anchor every time the menu opens (and on resize/scroll while open).
  React.useEffect(() => {
    if (!open || !anchor) return;
    const measure = () => {
      const r = anchor.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, anchor]);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target) && (!anchor || !anchor.contains(e.target))) onClose();
    };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open, onClose, anchor]);

  if (!open) return null;
  return (
    <div ref={ref} className="np-menu anim-in-pop" style={{ top: pos.top, left: pos.left }}>
      <div className="np-menu-h">Start a new production</div>
      <button className="np-menu-item" onClick={onQuick}>
        <div className="np-menu-ico" data-c="accent"><QaI.Bolt size={15}/></div>
        <div>
          <b>Quick add</b>
          <span>Title + opening date. Fill in the rest later.</span>
        </div>
      </button>
      <button className="np-menu-item" onClick={onFull}>
        <div className="np-menu-ico"><QaI.Layers size={15}/></div>
        <div>
          <b>Full setup</b>
          <span>Departments, roles, cast, calendar — guided 6-step wizard.</span>
        </div>
      </button>
      <style>{`
        .np-menu{
          position: fixed;
          width: 320px;
          background: var(--bg-elev);
          border: 1px solid var(--border-strong);
          border-radius: 12px;
          box-shadow: 0 18px 48px -10px rgba(40,15,5,.28), 0 6px 16px -4px rgba(40,15,5,.18);
          padding: 6px;
          z-index: 180;
        }
        .np-menu-h{
          padding: 8px 10px 6px;
          font-size: 10.5px; letter-spacing: .07em; text-transform: uppercase;
          color: var(--ink-4); font-weight: 600;
        }
        .np-menu-item{
          appearance: none; border: 0;
          width: 100%;
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 10px;
          background: transparent;
          color: var(--ink);
          text-align: left;
          border-radius: 8px;
          cursor: pointer;
          transition: background .1s;
        }
        .np-menu-item:hover{ background: var(--bg-muted); }
        .np-menu-item b{ display:block; font-size:13.5px; font-weight:600; line-height:1.2; }
        .np-menu-item span{ display:block; font-size:12px; color: var(--ink-3); margin-top:2px; line-height:1.4; }
        .np-menu-ico{
          width: 30px; height: 30px; border-radius: 8px;
          display: grid; place-items: center;
          background: var(--bg-sunken);
          color: var(--ink-2);
          flex-shrink: 0;
        }
        .np-menu-ico[data-c="accent"]{
          background: var(--accent-soft);
          color: var(--accent-ink);
        }
      `}</style>
    </div>
  );
}

// Full-screen overlay wrapper for the wizard
function NewProductionOverlay({ open, onClose, onLaunch }) {
  if (!open) return null;
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div className="np-overlay anim-in-overlay">
      {window.NewProduction
        ? <window.NewProduction mode="overlay" onClose={onClose} onLaunch={onLaunch}/>
        : <div style={{padding:40}}>Loading…</div>}
      <style>{`
        .np-overlay{
          position: fixed; inset: 0;
          background: var(--bg);
          z-index: 240;
          display: flex; flex-direction: column;
          overflow: auto;
        }
        .anim-in-overlay{ animation: np-rise .26s cubic-bezier(.2,.9,.3,1); }
        @keyframes np-rise {
          from { opacity:0; transform: translateY(12px); }
          to   { opacity:1; transform: translateY(0); }
        }
        /* Overlay top bar treatment */
        .np-overlay .topbar.overlay{
          display: flex; align-items: center; gap: 14px;
          padding: 16px 28px;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
        }
        .np-overlay .back-link{
          appearance: none; border: 0; background: transparent;
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--ink-3);
          font: 500 13px var(--font-ui);
          cursor: pointer;
          padding: 6px 10px 6px 4px;
          border-radius: 6px;
          transition: color .1s, background .1s;
        }
        .np-overlay .back-link:hover{ color: var(--ink); background: var(--bg-muted); }
      `}</style>
    </div>
  );
}

window.QuickAddModal = QuickAddModal;
window.NewProductionMenu = NewProductionMenu;
window.NewProductionOverlay = NewProductionOverlay;
