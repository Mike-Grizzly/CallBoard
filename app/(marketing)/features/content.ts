// Features page body, ported from handoff features.html. Links rewired to Next
// routes (pricing.html -> /pricing, placeholders -> # with data-noop); set-piece
// images point at /marketing/setpieces/*. Brand is "Proscene"; no em-dashes.
// The audience segment is set on the [data-page="features"] container (see
// FeaturesInteractions); CSS reads [data-page="features"][data-segment="..."].
export const FEATURES_HTML = `
  <section class="dh-hero">
    <div class="hero-glow"></div>
    <div class="wrap">
      <div class="dh-intro">
        <span class="eyebrow">The workspace</span>
        <h1 class="display">Your whole production, <em>at a glance.</em></h1>
        <p class="lede">Open Proscene and you already know where things stand: tonight's call, today's schedule, every show on your desk, and exactly what's waiting on you. One home screen the whole company runs from.</p>
        <div class="hero-actions">
          <a class="btn primary lg" href="/signup">Start free <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>
          <a class="btn lg" href="/contact?reason=demo">Book a demo</a>
        </div>
        <div class="dh-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Free for your first production · No card required</div>
      </div>

      <div class="dh-window">
        <div class="dh-bar">
          <div class="dh-dots"><i></i><i></i><i></i></div>
          <div class="dh-url"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg> proscene.app</div>
        </div>
        <div class="dh-body">
          <div class="dh-greet">
            <div>
              <div class="dh-greet-eye">Workspace · Production Stage Manager <span class="sep">·</span> Monday, May 4</div>
              <div class="dh-greet-h">Good evening, <em>Maya</em>.</div>
            </div>
            <div class="dh-chips">
              <div class="dh-chip" data-t="accent"><span class="dh-chip-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/></svg></span><div><b>3</b><span>mentions</span></div></div>
              <div class="dh-chip" data-t="amber"><span class="dh-chip-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg></span><div><b>1</b><span>announcement</span></div></div>
              <div class="dh-chip"><span class="dh-chip-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/></svg></span><div><b>3</b><span>active shows</span></div></div>
            </div>
          </div>

          <div class="dh-bento">
            <article class="dh-tile dh-focal">
              <div class="dh-focal-top">
                <span class="dh-live"><span class="dh-live-dot"></span> Next call</span>
                <span class="dh-focal-prod"><span class="dh-prod-dot" style="background:var(--accent)"></span> The Pirates of Penzance</span>
              </div>
              <div class="dh-focal-body">
                <div class="dh-focal-when">Tonight · 7:00 – 10:30 PM</div>
                <div class="dh-focal-title">Act II, Stumble Run</div>
                <div class="dh-focal-where"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg><span>Studio A</span><span class="pip"></span><span>Wellman Theatre</span><span class="pip"></span><span>Rehearsal 24 of 36</span></div>
              </div>
              <div class="dh-focal-mid">
                <div>
                  <div class="dh-count-lbl">Starts in</div>
                  <div class="dh-count-val">04<span class="u">h</span>12<span class="u">m</span>08<span class="u">s</span></div>
                </div>
                <div class="dh-divider"></div>
                <div class="dh-called">
                  <div class="dh-stack">
                    <span class="dh-av" style="background:#c0563f">TM</span>
                    <span class="dh-av" style="background:#7d6fb0">PA</span>
                    <span class="dh-av" style="background:#4f7fb8">MB</span>
                    <span class="dh-av" style="background:#6bbf7a">WE</span>
                    <span class="dh-av" style="background:#caa24a">IH</span>
                    <span class="dh-av more">+13</span>
                    <span class="dh-called-txt"><b>18 of 22</b> confirmed</span>
                  </div>
                  <div class="dh-bar-track"><div class="dh-bar-fill" style="width:82%"></div></div>
                </div>
              </div>
              <div class="dh-focal-cta">
                <div class="dh-act primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h4"/></svg> Open call sheet</div>
                <div class="dh-act ghost"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h9l5 5v13H5z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg> Tonight's pages</div>
              </div>
            </article>

            <aside class="dh-tile dh-today">
              <div class="dh-tl-head"><span class="dh-tl-title">Today</span><span class="dh-tl-date">May 4</span></div>
              <div class="dh-tl-list">
                <div class="dh-tl-item" data-s="done"><span class="dh-tl-time">10:00</span><span class="dh-tl-node"></span><div><div class="dh-tl-what">Production meeting</div><div class="dh-tl-sub">SM office · design + producer</div></div></div>
                <div class="dh-tl-item" data-s="done"><span class="dh-tl-time">1:30</span><span class="dh-tl-node"></span><div><div class="dh-tl-what">Fight call, Act II</div><div class="dh-tl-sub">Studio A · w/ fight captain</div></div></div>
                <div class="dh-tl-item" data-s="now"><span class="dh-tl-time">4:45</span><span class="dh-tl-node"></span><div><div class="dh-tl-what">Costume fitting <span class="dh-tl-now">NOW</span></div><div class="dh-tl-sub">Wardrobe · Edith &amp; Kate</div></div></div>
                <div class="dh-tl-item" data-s="up"><span class="dh-tl-time">6:30</span><span class="dh-tl-node"></span><div><div class="dh-tl-what">Cast call / warm-ups</div><div class="dh-tl-sub">Studio A · house opens 6:15</div></div></div>
                <div class="dh-tl-item" data-s="up"><span class="dh-tl-time">7:00</span><span class="dh-tl-node"></span><div><div class="dh-tl-what">Act II Stumble Run</div><div class="dh-tl-sub">Top to finale · est. 3h 15m</div></div></div>
              </div>
              <div class="dh-tl-foot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg> <span><b>5 more</b> this week</span></div>
            </aside>

            <aside class="dh-tile dh-wait">
              <div class="dh-wait-head"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/></svg></span><h4>Waiting on you</h4><span class="cnt">3</span></div>
              <div class="dh-wait-list">
                <div class="dh-ment"><span class="dh-ment-av" style="background:#c0563f">EB</span><div style="min-width:0"><div class="dh-ment-head"><span class="dh-ment-from">Eleanor Bryce</span><span class="dh-ment-role">Director</span><span class="dh-ment-time">12m</span></div><p class="dh-ment-snip"><span class="dh-tag">@Maya</span> can we revisit Mabel's entrance timing? Felt rushed at bar 47.</p></div></div>
                <div class="dh-ment"><span class="dh-ment-av" style="background:#7d6fb0">AI</span><div style="min-width:0"><div class="dh-ment-head"><span class="dh-ment-from">Adaeze Ife</span><span class="dh-ment-role">Costumes</span><span class="dh-ment-time">1h</span></div><p class="dh-ment-snip"><span class="dh-tag">@Maya</span> bloomer fittings for Edith &amp; Kate, Friday 4 to 6 still good?</p></div></div>
                <div class="dh-ment"><span class="dh-ment-av" style="background:#4f7fb8">HV</span><div style="min-width:0"><div class="dh-ment-head"><span class="dh-ment-from">Helena Voss</span><span class="dh-ment-role">Music Dir.</span><span class="dh-ment-time">3h</span></div><p class="dh-ment-snip"><span class="dh-tag">@Maya</span> score v3 is posted, distribute to design?</p></div></div>
              </div>
            </aside>
          </div>

          <div class="dh-shows">
            <div class="dh-show"><span class="dh-show-band" style="background:var(--accent)"></span><div class="dh-show-main"><div class="dh-show-title">The Pirates of Penzance</div><div class="dh-show-meta">Wellman Theatre · PSM</div></div><span class="dh-show-prog">Wk 4/6</span></div>
            <div class="dh-show"><span class="dh-show-band" style="background:var(--c-dusk)"></span><div class="dh-show-main"><div class="dh-show-title">The Mikado</div><div class="dh-show-meta">Studio B · PSM</div></div><span class="dh-show-prog">Wk 1/8</span></div>
            <div class="dh-show"><span class="dh-show-band" style="background:var(--c-sage)"></span><div class="dh-show-main"><div class="dh-show-title">Ruddigore</div><div class="dh-show-meta">Closed Apr 12</div></div><span class="dh-show-prog">Closed</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- AI SCRIPT SETUP, marquee feature -->
  <section class="section ai-feature">
    <div class="ai-glow"></div>
    <div class="wrap">
      <div class="ai-grid reveal">
        <div>
          <span class="ai-eyebrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg> AI Script Setup</span>
          <h2 class="title" style="margin:16px 0 16px">Upload the script. Start with the show already <em>built.</em></h2>
          <p class="lede">Drop in the PDF, even a photocopied one, and Claude reads it cover to cover, then proposes your cast list, act-and-scene breakdown, and a bookmark for every scene and musical number. You review, tweak, and approve. Nothing touches your production until you say so.</p>
          <ul class="checklist">
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Cast, scenes, and bookmarks proposed from the real script</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Scanned or photographed scripts read too, page by page</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Refine in plain English: "songs are misnumbered after p.30"</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Parse once, then everyone in the company opens the same script — each with their own private markup</li>
          </ul>
          <div class="ai-note">
            <span class="pill" data-c="plum"><span class="dot"></span>Beta soon</span>
            <span>Per-role line highlighting: each actor sees their own lines lit up.</span>
          </div>
        </div>

        <!-- mock review panel -->
        <div class="ai-panel reveal">
          <div class="ai-p-head">
            <span class="ai-p-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg> AI Script Setup</span>
            <span class="ai-quota"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg> 4 of 5 analyses left</span>
          </div>
          <div class="ai-p-sub"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg> Pirates_of_Penzance.pdf · 112 pages</div>

          <div class="ai-block">
            <div class="ai-block-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7"/></svg><b>Cast &amp; characters</b><span class="cnt">7</span></div>
            <div class="ai-rows">
              <div class="ai-row"><span class="nm">Mabel</span><span class="ai-type principal">Principal</span></div>
              <div class="ai-row"><span class="nm">Frederic</span><span class="ai-type principal">Principal</span></div>
              <div class="ai-row"><span class="nm">The Pirate King</span><span class="ai-type principal">Principal</span></div>
              <div class="ai-row"><span class="nm">Ruth</span><span class="ai-type supporting">Supporting</span></div>
              <div class="ai-more">+3 more: Major-General Stanley, Sergeant, Ensemble</div>
            </div>
          </div>

          <div class="ai-block">
            <div class="ai-block-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h8M3 12h8M3 19h8M15 5h6M15 12h6M15 19h6"/></svg><b>Scene breakdown</b><span class="cnt">2</span></div>
            <div class="ai-rows">
              <div class="ai-row"><span class="ai-pg">I · 1</span><span class="nm">A rocky seashore, Cornwall</span></div>
              <div class="ai-row"><span class="ai-pg">II · 1</span><span class="nm">A ruined chapel by moonlight</span></div>
            </div>
          </div>

          <div class="ai-block">
            <div class="ai-block-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg><b>Bookmarks · musical numbers</b></div>
            <div class="ai-rows">
              <div class="ai-row"><span class="ai-pg">p.31</span><span class="ai-kind song"></span><span class="nm">No. 5, Poor Wand'ring One</span></div>
              <div class="ai-row"><span class="ai-pg">p.68</span><span class="ai-kind song"></span><span class="nm">No. 12, With Cat-like Tread</span></div>
            </div>
          </div>

          <div class="ai-actions">
            <span class="ai-btn apply"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Apply to production</span>
            <span class="ai-btn ghost">Discard</span>
            <span class="ai-token">Reused a verified breakdown, no AI tokens used.</span>
          </div>
        </div>
      </div>

      <!-- the flow -->
      <div class="ai-steps reveal">
        <div class="ai-step">
          <div class="sn">1</div>
          <h4>Upload</h4>
          <p>Any script PDF: typeset, exported, or scanned from the photocopier.</p>
        </div>
        <div class="ai-step">
          <div class="sn">2</div>
          <h4>Review</h4>
          <p>Edit the proposed cast, scenes, and bookmarks. Not quite right? Tell it what to fix and re-run.</p>
        </div>
        <div class="ai-step">
          <div class="sn">3</div>
          <h4>Apply</h4>
          <p>One tap populates the production and seeds bookmarks for the whole company.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section-tight" style="padding:clamp(28px,4vw,44px) 0 4px;text-align:center">
    <div class="wrap">
      <span class="eyebrow">One source of truth</span>
      <h2 class="title" style="margin-top:14px;font-size:clamp(26px,3.4vw,40px)">Every part of the prompt book, <em>connected.</em></h2>
      <p class="lede lede-narrow" style="margin:16px auto 0">Proscene isn't six tools stapled together. Calls, calendars, the script, blocking, and reports all share the same cast list and the same calendar, so whether you're in the cast, on a crew, or on the creative team, you're working from the same source of truth. Pick your view below.</p>
    </div>
  </section>

  <!-- AUDIENCE TOGGLE + CONTEXTUAL JUMP NAV -->
  <div class="feature-bar">
    <div class="feature-bar-inner">
      <div class="aud-toggle" role="tablist" aria-label="Choose your view">
        <button class="aud-seg" id="tab-cast" role="tab" type="button" data-seg="cast" aria-controls="feat-panels" aria-selected="true" tabindex="0">For Cast &amp; Crew</button>
        <button class="aud-seg" id="tab-creative" role="tab" type="button" data-seg="creative" aria-controls="feat-panels" aria-selected="false" tabindex="-1">For Creative Teams</button>
        <span class="aud-thumb" aria-hidden="true"></span>
      </div>
      <nav class="feature-jump" aria-label="Jump to a tool">
        <a href="#sm" data-aud="cast">Command center</a>
        <a href="#calls" data-aud="both">Calls</a>
        <a href="#calendar" data-aud="both">Calendar</a>
        <a href="#script" data-aud="both">Script</a>
        <a href="#blocking" data-aud="both">Blocking</a>
        <a href="#reports" data-aud="both">Reports</a>
        <a href="#people" data-aud="both">People</a>
        <a href="#mobile" data-aud="both">Mobile</a>
      </nav>
    </div>
  </div>

  <div id="feat-panels" role="region" aria-label="Features by audience">

  <!-- STAGE MANAGEMENT, Cast & Crew only, leads the view -->
  <section class="section feat-block" id="sm" data-aud="cast">
    <div class="wrap">
      <div class="split reveal">
        <div>
          <div class="aud-copy" data-seg="cast">
            <span class="pill" data-c="accent"><span class="dot"></span>Stage Management</span>
            <h2 class="title" style="margin:16px 0 16px">Run the whole room from <em>one</em> command center.</h2>
            <p class="lede" style="margin-bottom:22px">Proscene was born at the SM's table. Send calls, take blocking, log notes, and file the report from a single home screen, with the live call confirmations that keep a show on its feet.</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> One command center: calls, calendar, script, blocking, reports</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Live call confirmations and read receipts as the room runs</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> File the daily report before the company's left the lobby</li>
            </ul>
          </div>
        </div>
        <div class="split-media">
          <div class="panel">
            <div class="panel-row panel-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h4"/></svg> Command center · Pirates · Wk 4</div>
            <div class="panel-row"><span class="pill" data-c="accent"><span class="dot"></span>Calls</span><span class="lead"><b>Tonight's call sent</b><span>Act II Stumble · 22 called</span></span><span class="pill" data-c="sage"><span class="dot"></span>18/22 in</span></div>
            <div class="panel-row"><span class="pill" data-c="dusk"><span class="dot"></span>Cal</span><span class="lead"><b>Thu music call · 18:00</b><span>Principals called · confirmations in</span></span><span class="pill" data-c="sage"><span class="dot"></span>20/22</span></div>
            <div class="panel-row"><span class="pill" data-c="amber"><span class="dot"></span>Rpt</span><span class="lead"><b>Rehearsal Report #24</b><span>Routed to 5 departments</span></span><span class="pill" data-c="sage"><span class="dot"></span>Sent</span></div>
            <div class="panel-row"><span class="pill" data-c="clay"><span class="dot"></span>Blk</span><span class="lead"><b>Blocking saved</b><span>Act II Sc. 1 · pinned to p.42</span></span><span class="panel-time">9:48</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CALLS -->
  <section class="section feat-block" id="calls">
    <div class="wrap">
      <div class="split flip reveal">
        <div>
          <div class="aud-copy" data-seg="cast">
            <span class="pill" data-c="accent"><span class="dot"></span>Calls</span>
            <h2 class="title" style="margin:16px 0 16px">Never wonder if you're <em>called.</em></h2>
            <p class="lede" style="margin-bottom:22px">See exactly when you're needed, confirm in a tap, and get a nudge before call. No group-text scramble, no "wait, am I in this scene?"</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Your calls only, by scene, role, and department</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Confirm with one tap, from anywhere</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Reminders the night before and morning of</li>
            </ul>
          </div>
          <div class="aud-copy" data-seg="creative">
            <span class="pill" data-c="accent"><span class="dot"></span>Calls</span>
            <h2 class="title" style="margin:16px 0 16px">Call exactly who you <em>need.</em></h2>
            <p class="lede" style="margin-bottom:22px">Build a call from the calendar, pick the scenes, roles, or departments, and send. Watch confirmations land in real time, without a single follow-up text.</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Who's-called logic by scene, role, or department</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Real-time confirmations and read receipts</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Auto-reminders go out for you</li>
            </ul>
          </div>
        </div>
        <div class="split-media">
          <div class="panel demo-calls" data-demo="calls" data-phases="4" data-interval="1700" data-rest="3">
            <div class="panel-row panel-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg> Tonight's call · Act II Stumble<span class="cl-count"><span class="cl-num"><i>18</i><i>19</i></span>/22 confirmed</span></div>
            <div class="panel-row"><span class="cl-av" style="background:#c0563f">TM</span><span class="lead"><b>Tom Mercer</b><span>Pirate King</span></span><span class="pill" data-c="sage"><span class="dot"></span>Confirmed</span></div>
            <div class="panel-row"><span class="cl-av" style="background:#7d6fb0">PA</span><span class="lead"><b>Priya Anand</b><span>Mabel</span></span><span class="pill" data-c="sage"><span class="dot"></span>Confirmed</span></div>
            <div class="panel-row"><span class="cl-av" style="background:#4f7fb8">ME</span><span class="lead"><b>Marcus Ellroy</b><span>Sergeant</span></span><span class="pill" data-c="amber"><span class="dot"></span>Seen</span></div>
            <div class="panel-row"><span class="cl-av will">WH</span><span class="lead"><b>Will Hart</b><span>Ensemble</span></span><span class="cl-status"><span class="pill pill-noreply">No reply</span><span class="pill pill-confirmed" data-c="sage"><span class="dot"></span>Confirmed</span></span></div>
            <div class="cl-phone">
              <div class="cl-ph-top"><span class="pdot"></span> Will Hart's phone · 6:12 PM</div>
              <div class="cl-ph-body"><b>Tonight, 7:00 PM call</b><span>Act II, Stumble · Studio A</span></div>
              <button class="cl-ack" type="button" aria-hidden="true" tabindex="-1"><span class="lbl lbl-go">Acknowledge call</span><span class="lbl lbl-done"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Confirmed for 7:00 PM</span></button>
            </div>
            <span class="demo-cursor"></span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CALENDAR -->
  <section class="section feat-block" id="calendar" style="background:var(--bg-muted);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
    <div class="wrap">
      <div class="split reveal">
        <div>
          <div class="aud-copy" data-seg="cast">
            <span class="pill" data-c="dusk"><span class="dot"></span>Calendar</span>
            <h2 class="title" style="margin:16px 0 16px">Know exactly when you're <em>called.</em></h2>
            <p class="lede" style="margin-bottom:22px">Your personal calendar shows only your calls, rehearsals, fittings, and performances, on the phone you already use. Something moves, and it's the current time you see — never last week's.</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> A personal calendar of just your calls</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Month, week, day, and agenda views</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> One-tap confirm so your SM knows you've seen it</li>
            </ul>
          </div>
          <div class="aud-copy" data-seg="creative">
            <span class="pill" data-c="dusk"><span class="dot"></span>Calendar</span>
            <h2 class="title" style="margin:16px 0 16px">Plan around the <em>whole company.</em></h2>
            <p class="lede" style="margin-bottom:22px">Lay out rehearsals, music calls, fittings, and performances for the whole company in one timeline, colour-coded by show so overlapping productions stay legible.</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Every production's calls in a single timeline</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Call by scene, role, or department — Proscene works out who's needed</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Generate a recurring schedule, skipping known clashes</li>
            </ul>
          </div>
        </div>
        <div class="split-media">
          <div class="panel demo-cal" data-demo="calendar" data-phases="4" data-rest="3">
            <div class="panel-row panel-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg> This week · Studio A</div>
            <div class="panel-row"><span class="pill" data-c="accent"><span class="dot"></span>Mon</span><span class="lead"><b>Act I, Run</b><span>Full company</span></span><span class="panel-time">18:30</span></div>
            <div class="panel-row"><span class="pill" data-c="dusk"><span class="dot"></span>Tue</span><span class="lead"><b>Patter songs</b><span>Principals</span></span><span class="panel-time">19:00</span></div>
            <div class="panel-row"><span class="pill" data-c="amber"><span class="dot"></span>Wed</span><span class="lead"><b>Fittings</b><span>Ensemble A</span></span><span class="panel-time">17:00</span></div>
            <div class="panel-row cal-target"><span class="pill" data-c="sage"><span class="dot"></span>Thu</span><span class="lead"><b>Act II, Stumble</b><span>Full company</span></span><span class="cal-meta"><span class="cal-flag"><span class="cal-flag-bad">clash check</span><span class="cal-flag-ok"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> clear</span></span><span class="panel-time cal-time"><span class="ct-old">19:00</span><span class="ct-new">18:00</span></span></span></div>
            <div class="cal-toast"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg> <span><b>22 company calendars</b> updated · just now</span></div>
            <span class="demo-cursor"></span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SCRIPT -->
  <section class="section feat-block" id="script">
    <div class="wrap">
      <div class="split flip reveal">
        <div>
          <div class="aud-copy" data-seg="cast">
            <span class="pill" data-c="sage"><span class="dot"></span>Script</span>
            <h2 class="title" style="margin:16px 0 16px">Always on the <em>current</em> page.</h2>
            <p class="lede" style="margin-bottom:22px">Open the latest script with your blocking and line notes already on it, never a stale PDF from three versions ago. Jump straight from tonight's call to the pages you're running.</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Always the current draft, never a stale PDF</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Your blocking and cues pinned to the line</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Jump from any call straight to its pages</li>
            </ul>
          </div>
          <div class="aud-copy" data-seg="creative">
            <span class="pill" data-c="sage"><span class="dot"></span>Script</span>
            <h2 class="title" style="margin:16px 0 16px">The book, <em>live</em> and shared.</h2>
            <p class="lede" style="margin-bottom:22px">Upload the script and Proscene threads it through everything: blocking pins to lines, notes attach to the moment they're about, and a line change reaches the whole company at once.</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Scene &amp; French-scene breakdown built in</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Line notes and cuts tracked by version</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Changes reach the whole company at once</li>
            </ul>
          </div>
        </div>
        <div class="split-media">
          <div class="panel">
            <div class="panel-row panel-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M19 3H8a2 2 0 0 0-2 2v14a2 2 0 0 1-2-2h13a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M10 8h7M10 12h7M10 16h4"/></svg> Act II, Scene 1 · p.42</div>
            <div class="demo-script" data-demo="script" data-phases="5" data-interval="1400" data-rest="4">
              <span class="sm-ch">Mabel</span>
              <span class="sm-tx sm-hl1">Stay, Frederic, stay!</span><span class="sm-caret sm-caret1"></span><span class="sm-cue sm-cue1">↪ cross DSL</span><br>
              They have no legal claim, no shadow of a claim,
              <span class="sm-ch">Pirate King</span>
              <span class="sm-tx sm-hl2">We have proof.</span><span class="sm-caret sm-caret2"></span><span class="sm-cue note sm-cue2">✎ hold for laugh</span><br>
              You were born in leap-year, and so I'm afraid you'll have to wait…
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- BLOCKING -->
  <section class="section feat-block" id="blocking" style="background:var(--bg-muted);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
    <div class="wrap">
      <div class="split reveal">
        <div>
          <div class="aud-copy" data-seg="cast">
            <span class="pill" data-c="clay"><span class="dot"></span>Blocking</span>
            <h2 class="title" style="margin:16px 0 16px">Your blocking, <em>never</em> lost.</h2>
            <p class="lede" style="margin-bottom:22px">Every move the director gives you is recorded on the ground plan and pinned to the line, legible the next morning, not buried in your own shorthand.</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> See your moves on the ground plan</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Each move pinned to the exact line</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Clear notation everyone can read</li>
            </ul>
          </div>
          <div class="aud-copy" data-seg="creative">
            <span class="pill" data-c="clay"><span class="dot"></span>Blocking</span>
            <h2 class="title" style="margin:16px 0 16px">Stage it once, and <em>keep</em> it.</h2>
            <p class="lede" style="margin-bottom:22px">Drop actors onto the ground plan, record the cross, and pin it to the script. Change a move at 9pm and it's in the book before notes, shareable straight to design.</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Ground-plan with draggable position tokens</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Moves pinned to the exact line of script</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Share staging with design and crew</li>
            </ul>
          </div>
        </div>
        <div class="split-media">
          <div class="panel demo-block" data-demo="blocking" data-phases="3" data-interval="2600" data-rest="2" style="padding:18px">
            <div class="bp-stage">
              <span class="bp-label us">UPSTAGE</span>
              <span class="bp-label ds">DOWNSTAGE</span>
              <img class="bp-scn rug" src="/marketing/setpieces/rug.svg" alt="" style="left:50%;top:54%;width:128px">
              <img class="bp-scn" src="/marketing/setpieces/table-round.svg" alt="" style="left:50%;top:54%;width:60px">
              <img class="bp-scn" src="/marketing/setpieces/throne.svg" alt="" style="left:30%;top:17%;width:30px">
              <img class="bp-scn" src="/marketing/setpieces/tree.svg" alt="" style="left:80%;top:16%;width:52px">
              <img class="bp-scn" src="/marketing/setpieces/bench.svg" alt="" style="left:16%;top:72%;width:56px">
              <svg class="bp-trails" viewBox="0 0 100 62" preserveAspectRatio="none"><path class="trail trail-1" pathLength="100" d="M22 17 Q 34 31 47 35"/><path class="trail trail-2" pathLength="100" d="M56 37 Q 40 44 28 38"/></svg>
              <span class="bp-tok pk">PK</span>
              <span class="bp-tok mb">MB</span>
              <span class="bp-tok sg">SG</span>
            </div>
            <div class="bp-foot">
              <div class="bp-beats"><span class="bp-beat">1</span><span class="bp-beat">2</span><span class="bp-beat">3</span></div>
              <div class="bp-cap">
                <span class="cap0"><b>Top of scene</b>&nbsp;: company set, Pirate King upstage right.</span>
                <span class="cap1"><b>PK</b>&nbsp;crosses DSL to Mabel on "We have proof."</span>
                <span class="cap2"><b>Sergeant</b>&nbsp;takes centre; Mabel breaks stage-left.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- REPORTS -->
  <section class="section feat-block" id="reports">
    <div class="wrap">
      <div class="split flip reveal">
        <div>
          <div class="aud-copy" data-seg="cast">
            <span class="pill" data-c="amber"><span class="dot"></span>Reports</span>
            <h2 class="title" style="margin:16px 0 16px">Every note reaches the <em>right</em> hands.</h2>
            <p class="lede" style="margin-bottom:22px">Department notes route straight to the people who own them, scenic to scenic, wardrobe to wardrobe, so nothing's buried in a thread and nobody wades through what isn't theirs.</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> See only the notes that are yours</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Running times and breaks tracked for you</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> In your inbox before you leave the lobby</li>
            </ul>
          </div>
          <div class="aud-copy" data-seg="creative">
            <span class="pill" data-c="amber"><span class="dot"></span>Reports</span>
            <h2 class="title" style="margin:16px 0 16px">Daily reports, <em>done by curtain.</em></h2>
            <p class="lede" style="margin-bottom:22px">Tag a note to a department as the room runs. Proscene formats the rehearsal and performance reports and routes each note to the people who need it, out before the company's left the lobby.</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Rehearsal, performance &amp; production templates</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Running time and break tracking</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Distributed straight to the right departments' inboxes</li>
            </ul>
          </div>
        </div>
        <div class="split-media">
          <div class="panel demo-report" data-demo="reports" data-phases="5" data-rest="4">
            <div class="panel-row panel-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg> Rehearsal Report · #24</div>
            <div class="panel-row rp-note rp-1"><span class="pill" data-c="dusk">Scenic</span><span class="lead">Stair unit sticks on the SR turn</span></div>
            <div class="panel-row rp-note rp-2"><span class="pill" data-c="amber">Lighting</span><span class="lead">Warm special DSC for Mabel's aria</span></div>
            <div class="panel-row rp-note rp-3"><span class="pill" data-c="plum">Costumes</span><span class="lead">Pirate King's sash too long</span></div>
            <div class="panel-row rp-send" style="background:var(--bg-muted)"><span class="lead muted" style="font-size:12.5px">Sent to 5 departments · 7:14 PM</span><span class="pill" data-c="sage"><span class="dot"></span>Delivered</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PEOPLE -->
  <section class="section feat-block" id="people" style="background:var(--bg-muted);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
    <div class="wrap">
      <div class="split reveal">
        <div>
          <div class="aud-copy" data-seg="cast">
            <span class="pill" data-c="plum"><span class="dot"></span>People</span>
            <h2 class="title" style="margin:16px 0 16px">The whole company, <em>one</em> contact sheet.</h2>
            <p class="lede" style="margin-bottom:22px">Cast, crew, designers, and front of house in a single directory, with roles and emergency contacts, so you always know who's who and how to reach them.</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> One directory for the entire company</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Roles and emergency contacts on file</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> The same company, ready for every show</li>
            </ul>
          </div>
          <div class="aud-copy" data-seg="creative">
            <span class="pill" data-c="plum"><span class="dot"></span>People</span>
            <h2 class="title" style="margin:16px 0 16px">Your company, <em>with the right keys.</em></h2>
            <p class="lede" style="margin-bottom:22px">One contact sheet with permissions that fit each role, principals see calls, designers see notes, and no one sees more than they should.</p>
            <ul class="checklist">
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Role-based access for every department</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Emergency contacts, visible only to stage management</li>
              <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Reuse your company across every show</li>
            </ul>
          </div>
        </div>
        <div class="split-media">
          <div class="panel">
            <div class="panel-row panel-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7"/></svg> Company · 22 people</div>
            <div class="panel-row"><span style="width:26px;height:26px;border-radius:50%;background:#c0563f;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:600">TM</span><span class="lead"><b>Tom Mercer</b><span>Principal · Pirate King</span></span><span class="pill" data-c="accent">Cast</span></div>
            <div class="panel-row"><span style="width:26px;height:26px;border-radius:50%;background:#6bbf7a;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:600">JL</span><span class="lead"><b>Jess Lin</b><span>Lighting Designer</span></span><span class="pill" data-c="amber">Design</span></div>
            <div class="panel-row"><span style="width:26px;height:26px;border-radius:50%;background:#4f7fb8;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:600">DR</span><span class="lead"><b>Dana Roy</b><span>Deck Crew</span></span><span class="pill" data-c="dusk">Crew</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- MOBILE (shared across both segments) -->
  <section class="section night feat-block" id="mobile">
    <div class="wrap">
      <div class="section-head center reveal" style="text-align:center">
        <span class="eyebrow no-rule">Mobile</span>
        <h2 class="title" style="margin-top:16px">It all fits in a <em>pocket.</em></h2>
        <p class="lede" style="margin-left:auto;margin-right:auto">Everything above travels with you. The Proscene app puts tonight's call, the day's schedule, and the latest report a glance away, for cast, crew, and creative team alike, on stage, in the booth, or on the bus home.</p>
      </div>
      <div class="grid grid-3 reveal" style="margin-top:48px">
        <div class="night-card card-pad">
          <div class="feature-ico" style="background:color-mix(in oklch,var(--accent) 26%,var(--night));color:color-mix(in oklch,var(--accent) 70%,white)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/></svg></div>
          <h3 style="font-family:var(--font-display);font-size:20px;font-weight:600;margin-bottom:8px;color:var(--night-ink)">Push notifications</h3>
          <p style="color:var(--night-ink-2);font-size:15px">New calls and changes buzz the whole company the moment you hit send.</p>
        </div>
        <div class="night-card card-pad">
          <div class="feature-ico" style="background:color-mix(in oklch,var(--accent) 26%,var(--night));color:color-mix(in oklch,var(--accent) 70%,white)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg></div>
          <h3 style="font-family:var(--font-display);font-size:20px;font-weight:600;margin-bottom:8px;color:var(--night-ink)">A Today screen</h3>
          <p style="color:var(--night-ink-2);font-size:15px">Built for a backstage glance: where to be, when, and who's called.</p>
        </div>
        <div class="night-card card-pad">
          <div class="feature-ico" style="background:color-mix(in oklch,var(--accent) 26%,var(--night));color:color-mix(in oklch,var(--accent) 70%,white)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 9 16l10-9"/><circle cx="12" cy="12" r="10"/></svg></div>
          <h3 style="font-family:var(--font-display);font-size:20px;font-weight:600;margin-bottom:8px;color:var(--night-ink)">Installs like an app</h3>
          <p style="color:var(--night-ink-2);font-size:15px">Add Proscene to your home screen and it opens full-screen, no App Store trip required.</p>
        </div>
      </div>
    </div>
  </section>

  </div><!-- /#feat-panels -->

  <!-- CTA -->
  <section class="section">
    <div class="wrap">
      <div class="cta-band center reveal">
        <div class="cta-curtain"></div>
        <div style="position:relative">
          <h2 class="title" style="font-size:clamp(28px,4vw,46px)">See it on <em>your show.</em></h2>
          <p class="lede" style="margin:18px auto 30px;max-width:48ch">Spin up a production and feel the difference at your next rehearsal.</p>
          <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
            <a class="btn primary lg" href="/signup">Start free</a>
            <a class="btn ghost lg" href="/pricing">See pricing</a>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
