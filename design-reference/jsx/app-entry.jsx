// App entrypoint — wires shell + tabs + tweaks.

const { Rail, ProductionHeader, NotificationsPopover } = window.Shell;
const { PRODUCTIONS } = window.DATA;
const { TabHome, TabCalendar, TabOverview, TabReports, TabNotes, TabDocuments, TabVideo, TabBlocking,
        QuickAddModal, NewProductionMenu, NewProductionOverlay, PeoplePage } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "warm",
  "dark": false,
  "density": "regular",
  "accent": "#c2562b"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = React.useState("overview");
  const [prod, setProd] = React.useState("pirates");
  const [view, setView] = React.useState("workspace"); // workspace | production | people
  const [notif, setNotif] = React.useState(false);

  // New-production flow state
  const [npMenuOpen, setNpMenuOpen] = React.useState(false);
  const [npMenuAnchor, setNpMenuAnchor] = React.useState(null);
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const [overlayOpen, setOverlayOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3200); };

  // Apply theme + density + dark to body
  React.useEffect(() => {
    document.body.dataset.theme = t.dark ? "dark" : t.theme;
    document.body.dataset.density = t.density;
    document.body.style.setProperty("--accent", t.accent);
    // Recompute soft from accent (just nudge lightness up & chroma down)
    document.body.style.setProperty("--accent-soft",
      `color-mix(in oklch, ${t.accent} 22%, var(--bg))`);
    document.body.style.setProperty("--accent-ink",
      `color-mix(in oklch, ${t.accent} 70%, var(--ink))`);
  }, [t]);

  const activeProd = PRODUCTIONS.find(p => p.id === prod) || PRODUCTIONS[0];

  return (
    <div className="app">
      <Rail activeProd={prod} onPickProd={(id) => { setProd(id); setView("production"); }}
            view={view} onNav={setView}
            onAddProduction={(anchor) => { setNpMenuAnchor(anchor); setNpMenuOpen(true); }}/>

      <NewProductionMenu open={npMenuOpen} anchor={npMenuAnchor}
        onClose={() => setNpMenuOpen(false)}
        onQuick={() => { setNpMenuOpen(false); setQuickAddOpen(true); }}
        onFull={() => { setNpMenuOpen(false); setOverlayOpen(true); }}/>

      <QuickAddModal open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onCreate={(p) => { setQuickAddOpen(false); showToast(`"${p.title}" created — ready to set up.`); }}
        onOpenFull={() => setOverlayOpen(true)}/>

      <NewProductionOverlay open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        onLaunch={(p) => { setOverlayOpen(false); showToast(`"${p.title || "Production"}" is live · invites sent.`); }}/>

      {toast && (
        <div className="app-toast">
          <I.Check size={14}/><span>{toast}</span>
        </div>
      )}


      <main className="main">
        {view === "people" && <div className="page" key="people"><PeoplePage/></div>}
        {view === "workspace" && (
          <div className="page" key="workspace">
            <TabHome onPickProd={(id) => { setProd(id); setView("production"); setTab("overview"); }}/>
          </div>
        )}
        {view === "calendar" && (
          <div className="page cal-page" key="calendar">
            <TabCalendar/>
          </div>
        )}
        {view === "production" && (
          <React.Fragment>
            <ProductionHeader prod={activeProd} tab={tab} setTab={setTab}
                              openNotif={() => setNotif(v => !v)} notifOpen={notif}/>
            {notif && <NotificationsPopover onClose={() => setNotif(false)} />}

            <div className="page" key={tab /* re-mount for fade-in animation */}>
              {tab === "overview"  && <TabOverview goTab={setTab}/>}
              {tab === "reports"   && <TabReports/>}
              {tab === "notes"     && <TabNotes/>}
              {tab === "documents" && <TabDocuments/>}
              {tab === "video"     && <TabVideo/>}
              {tab === "blocking"  && <TabBlocking/>}
            </div>
          </React.Fragment>
        )}
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakRadio label="Palette" value={t.theme}
            options={[{value:"warm",label:"Warm"},{value:"cool",label:"Cool"}]}
            onChange={v => setTweak("theme", v)} />
          <TweakToggle label="Dark mode" value={t.dark} onChange={v => setTweak("dark", v)} />
          <TweakColor label="Accent" value={t.accent}
            options={["#c2562b","#5b8aff","#3d8a5b","#a05cb8","#1f1f1f"]}
            onChange={v => setTweak("accent", v)} />
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio label="Density" value={t.density}
            options={[{value:"compact",label:"Compact"},{value:"regular",label:"Regular"},{value:"comfy",label:"Comfy"}]}
            onChange={v => setTweak("density", v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
