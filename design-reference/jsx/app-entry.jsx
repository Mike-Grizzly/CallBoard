// App entrypoint — wires shell + tabs + tweaks.

const { Rail, ProductionHeader, NotificationsPopover } = window.Shell;
const { PRODUCTIONS } = window.DATA;
const { TabOverview, TabReports, TabNotes, TabDocuments, TabVideo, TabBlocking } = window;

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
  const [notif, setNotif] = React.useState(false);

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
      <Rail activeProd={prod} onPickProd={setProd} />

      <main className="main">
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
