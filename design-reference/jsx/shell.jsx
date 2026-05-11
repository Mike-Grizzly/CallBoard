// App shell: left rail + topbar + tabs + notifications popover.

const { I } = window;
const { ME, PRODUCTIONS, TABS, NOTIFICATIONS } = window.DATA;

function Rail({ activeProd, onPickProd }) {
  return (
    <aside className="rail">
      <div className="rail-brand">
        <div className="rail-mark">C</div>
        <div className="rail-name">Call<em>Board</em></div>
      </div>

      <div className="rail-section">
        <div className="rail-section-h"><span>Workspace</span></div>
        <div className="rail-item" data-active="1">
          <I.Home /><span>Home</span>
        </div>
        <div className="rail-item">
          <I.Bell /><span>Inbox</span><span className="badge">3</span>
        </div>
        <div className="rail-item">
          <I.Calendar /><span>Calendar</span>
        </div>
        <div className="rail-item">
          <I.Users /><span>People</span>
        </div>
      </div>

      <div className="rail-section">
        <div className="rail-section-h">
          <span>Productions</span>
          <button title="New production"><I.Plus size={14} /></button>
        </div>
        {PRODUCTIONS.map(p => (
          <div key={p.id} className="prod-item" data-active={p.id === activeProd ? "1" : "0"}
               onClick={() => onPickProd(p.id)}>
            <span className="prod-dot" style={{background:p.color}} />
            <span className="truncate">{p.title}</span>
            <span className="prod-meta">{p.unread > 0 ? p.unread : ""}</span>
          </div>
        ))}
      </div>

      <div className="rail-section">
        <div className="rail-section-h"><span>Pinned</span></div>
        <div className="rail-item"><I.Pin /><span>Wed call sheet</span></div>
        <div className="rail-item"><I.Pin /><span>Score v3 — Act II</span></div>
      </div>

      <div className="rail-foot">
        <div className="avatar">{ME.initials}</div>
        <div className="rail-foot-meta">
          <b>{ME.name}</b><span>{ME.role}</span>
        </div>
        <button title="Settings"><I.Settings size={15} /></button>
      </div>
    </aside>
  );
}

function ProductionHeader({ prod, tab, setTab, openNotif, notifOpen }) {
  return (
    <header className="topbar">
      <div className="crumbs">
        <a href="#">Productions</a>
        <span className="sep">/</span>
        <span className="now">{prod.title}</span>
      </div>

      <div className="topbar-row">
        <div>
          <h1 className="show-title">The Pirates of <em>Penzance</em></h1>
          <div className="show-sub">
            <span className="show-status"><span className="dot" />In rehearsal · {prod.week}</span>
            <span className="pip" />
            <span>Wellman Theatre</span>
            <span className="pip" />
            <span>Opens Sat, May 23</span>
            <span className="pip" />
            <span>Dir. <b style={{color:"var(--ink-2)",fontWeight:500}}>Eleanor Bryce</b></span>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="btn ghost btn-icon" title="Search"><I.Search /></button>
          <button className={"btn ghost btn-icon icon-badge"} title="Notifications"
                  onClick={openNotif}>
            <I.Bell />
          </button>
          <button className="btn"><I.Users size={14} /><span>Cast & Crew</span></button>
          <button className="btn primary"><I.Plus size={14} /><span>New report</span></button>
        </div>
      </div>

      <nav className="tabs">
        {TABS.map(t => {
          const Ico = I[t.icon];
          return (
            <button key={t.id} className="tab" data-active={tab === t.id ? "1" : "0"}
                    onClick={() => setTab(t.id)}>
              <Ico />
              <span>{t.label}</span>
              {t.count != null && <span className="count">{t.count}</span>}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

function NotificationsPopover({ onClose }) {
  // Close on outside click
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  return (
    <div className="notif-pop" ref={ref}>
      <div className="notif-h">
        <b style={{fontSize:14,fontWeight:600}}>Notifications</b>
        <button className="btn ghost" style={{height:26,padding:"0 8px",fontSize:12}}
                onClick={onClose}>Mark all read</button>
      </div>
      <div className="notif-list scroll">
        {NOTIFICATIONS.map(n => {
          const Ico = I[n.ico] || I.Info;
          return (
            <div className="notif" key={n.id} data-unread={n.unread ? "1":"0"}>
              <div className="notif-ico" data-c={n.c}><Ico size={14} /></div>
              <div>
                <b>{n.title}</b>
                <span>{n.body}</span>
              </div>
              <span className="when">{n.when}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.Shell = { Rail, ProductionHeader, NotificationsPopover };
