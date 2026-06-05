// Features page body — ported from features.html. Links rewired to Next routes
// (pricing.html → /pricing); set-piece images point at /marketing/setpieces/*.
export const FEATURES_HTML = `
  <section class="dh-hero">
    <div class="hero-glow"></div>
    <div class="wrap">
      <div class="dh-intro">
        <span class="eyebrow">The workspace</span>
        <h1 class="display">Your whole production, <em>at a glance.</em></h1>
        <p class="lede">Open ProScene and you already know where things stand — tonight's call, today's schedule, every show on your desk, and exactly what's waiting on you. One home screen the whole company runs from.</p>
        <div class="hero-actions">
          <a class="btn primary lg" href="#signup" data-noop>Start free <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>
          <a class="btn lg" href="#demo" data-noop>Book a demo</a>
        </div>
        <div class="dh-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Free for your first production · No card required</div>
      </div>

      <div class="dh-window">
        <div class="dh-bar">
          <div class="dh-dots"><i></i><i></i><i></i></div>
          <div class="dh-url"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg> app.proscene.live</div>
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
                <div class="dh-focal-title">Act II — Stumble Run</div>
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
                <div class="dh-tl-item" data-s="done"><span class="dh-tl-time">1:30</span><span class="dh-tl-node"></span><div><div class="dh-tl-what">Fight call — Act II</div><div class="dh-tl-sub">Studio A · w/ fight captain</div></div></div>
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
                <div class="dh-ment"><span class="dh-ment-av" style="background:#7d6fb0">AI</span><div style="min-width:0"><div class="dh-ment-head"><span class="dh-ment-from">Adaeze Ife</span><span class="dh-ment-role">Costumes</span><span class="dh-ment-time">1h</span></div><p class="dh-ment-snip"><span class="dh-tag">@Maya</span> bloomer fittings for Edith &amp; Kate — Friday 4–6 still good?</p></div></div>
                <div class="dh-ment"><span class="dh-ment-av" style="background:#4f7fb8">HV</span><div style="min-width:0"><div class="dh-ment-head"><span class="dh-ment-from">Helena Voss</span><span class="dh-ment-role">Music Dir.</span><span class="dh-ment-time">3h</span></div><p class="dh-ment-snip"><span class="dh-tag">@Maya</span> score v3 is posted — distribute to design?</p></div></div>
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

  <section class="section-tight" style="padding:clamp(28px,4vw,44px) 0 4px;text-align:center">
    <div class="wrap">
      <span class="eyebrow">One source of truth</span>
      <h2 class="title" style="margin-top:14px;font-size:clamp(26px,3.4vw,40px)">Every part of the prompt book, <em>connected.</em></h2>
      <p class="lede lede-narrow" style="margin:16px auto 0">ProScene isn't six tools stapled together. Calls, calendars, the script, blocking, and reports all share the same cast list, the same calendar, the same source of truth — so nothing falls out of sync.</p>
    </div>
  </section>

  <nav class="feature-nav" aria-label="Features">
    <div class="feature-nav-inner">
      <a href="#calls" class="active">Calls</a>
      <a href="#calendar">Calendar</a>
      <a href="#script">Script</a>
      <a href="#blocking">Blocking</a>
      <a href="#reports">Reports</a>
      <a href="#people">People</a>
      <a href="#mobile">Mobile</a>
    </div>
  </nav>

  <!-- CALLS -->
  <section class="section feat-block" id="calls">
    <div class="wrap">
      <div class="split reveal">
        <div>
          <span class="pill" data-c="accent"><span class="dot"></span>Calls</span>
          <h2 class="title" style="margin:16px 0 16px">Send the call. Watch the room <em>fill up.</em></h2>
          <p class="lede" style="margin-bottom:22px">Build a call from your calendar, choose who's needed, and send. Everyone confirms with a tap — and you see exactly who hasn't, without sending a single follow-up text.</p>
          <ul class="checklist">
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Who's-called logic by scene, role, or department</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Real-time confirmations and read receipts</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Auto-reminders the night before and morning of</li>
          </ul>
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
              <div class="cl-ph-body"><b>Tonight, 7:00 PM call</b><span>Act II — Stumble · Studio A</span></div>
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
      <div class="split flip reveal">
        <div>
          <span class="pill" data-c="dusk"><span class="dot"></span>Calendar</span>
          <h2 class="title" style="margin:16px 0 16px">One calendar the <em>whole company</em> trusts.</h2>
          <p class="lede" style="margin-bottom:22px">Rehearsals, music calls, fittings, photo calls, and performances in a single timeline. Change one and every personal schedule updates instantly — with conflict detection across the cast.</p>
          <ul class="checklist">
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Drag-to-reschedule with instant notify</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Personal calendars: each person sees their calls</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Subscribe from Google, Apple, or Outlook</li>
          </ul>
        </div>
        <div class="split-media">
          <div class="panel demo-cal" data-demo="calendar" data-phases="4" data-rest="3">
            <div class="panel-row panel-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg> This week · Studio A</div>
            <div class="panel-row"><span class="pill" data-c="accent"><span class="dot"></span>Mon</span><span class="lead"><b>Act I — Run</b><span>Full company</span></span><span class="panel-time">18:30</span></div>
            <div class="panel-row"><span class="pill" data-c="dusk"><span class="dot"></span>Tue</span><span class="lead"><b>Patter songs</b><span>Principals</span></span><span class="panel-time">19:00</span></div>
            <div class="panel-row"><span class="pill" data-c="amber"><span class="dot"></span>Wed</span><span class="lead"><b>Fittings</b><span>Ensemble A</span></span><span class="panel-time">17:00</span></div>
            <div class="panel-row cal-target"><span class="pill" data-c="sage"><span class="dot"></span>Thu</span><span class="lead"><b>Act II — Stumble</b><span>Full company</span></span><span class="cal-meta"><span class="cal-flag"><span class="cal-flag-bad">3 conflicts</span><span class="cal-flag-ok"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> clear</span></span><span class="panel-time cal-time"><span class="ct-old">19:00</span><span class="ct-new">18:00</span></span></span></div>
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
      <div class="split reveal">
        <div>
          <span class="pill" data-c="sage"><span class="dot"></span>Script</span>
          <h2 class="title" style="margin:16px 0 16px">The book, <em>live</em> and shared.</h2>
          <p class="lede" style="margin-bottom:22px">Upload the script and ProScene threads it through everything — calls reference scenes, blocking pins to lines, and notes attach to exactly the moment they're about. Line changes reach the whole company at once.</p>
          <ul class="checklist">
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Scene &amp; French-scene breakdown built in</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Line notes and cuts tracked by version</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Jump from any call straight to its pages</li>
          </ul>
        </div>
        <div class="split-media">
          <div class="panel">
            <div class="panel-row panel-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M19 3H8a2 2 0 0 0-2 2v14a2 2 0 0 1-2-2h13a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M10 8h7M10 12h7M10 16h4"/></svg> Act II, Scene 1 · p.42</div>
            <div class="demo-script" data-demo="script" data-phases="5" data-interval="1400" data-rest="4">
              <span class="sm-ch">Mabel</span>
              <span class="sm-tx sm-hl1">Stay, Frederic, stay!</span><span class="sm-caret sm-caret1"></span><span class="sm-cue sm-cue1">↪ cross DSL</span><br>
              They have no legal claim, no shadow of a claim—
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
      <div class="split flip reveal">
        <div>
          <span class="pill" data-c="clay"><span class="dot"></span>Blocking</span>
          <h2 class="title" style="margin:16px 0 16px">Blocking that <em>survives</em> the night.</h2>
          <p class="lede" style="margin-bottom:22px">Drop actors onto the ground plan, record the move, and pin it to the line. When the director changes a cross at 9pm, it's in the book before notes — legible, shareable, and never lost to shorthand.</p>
          <ul class="checklist">
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Ground-plan with draggable position tokens</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Moves pinned to the exact line of script</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Standard notation shorthand, expanded for everyone</li>
          </ul>
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
                <span class="cap0"><b>Top of scene</b>&nbsp;— company set, Pirate King upstage right.</span>
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
      <div class="split reveal">
        <div>
          <span class="pill" data-c="amber"><span class="dot"></span>Reports</span>
          <h2 class="title" style="margin:16px 0 16px">Daily reports, <em>done by curtain.</em></h2>
          <p class="lede" style="margin-bottom:22px">Tag a note to a department as the room runs. ProScene formats the rehearsal and performance reports and routes each note to the people who need it — out before the company's left the lobby.</p>
          <ul class="checklist">
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Rehearsal, performance &amp; production report templates</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Running time and break tracking</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Export to PDF or send straight to inboxes</li>
          </ul>
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
      <div class="split flip reveal">
        <div>
          <span class="pill" data-c="plum"><span class="dot"></span>People</span>
          <h2 class="title" style="margin:16px 0 16px">Your company, <em>with the right keys.</em></h2>
          <p class="lede" style="margin-bottom:22px">One contact sheet for cast, crew, designers, and front of house — with roles, emergency contacts, and conflicts. Permissions mean principals see calls, designers see notes, and no one sees more than they should.</p>
          <ul class="checklist">
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Role-based access for every department</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Emergency contacts &amp; conflict calendars</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Reuse your company across every show</li>
          </ul>
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

  <!-- MOBILE -->
  <section class="section night feat-block" id="mobile">
    <div class="wrap">
      <div class="section-head center reveal" style="text-align:center">
        <span class="eyebrow no-rule">Mobile</span>
        <h2 class="title" style="margin-top:16px">It all fits in a <em>pocket.</em></h2>
        <p class="lede" style="margin-left:auto;margin-right:auto">Everything above travels with you. The ProScene app puts tonight's call, the day's schedule, and the latest report a glance away — on stage, in the booth, or on the bus home.</p>
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
          <h3 style="font-family:var(--font-display);font-size:20px;font-weight:600;margin-bottom:8px;color:var(--night-ink)">Works offline</h3>
          <p style="color:var(--night-ink-2);font-size:15px">Dressing-room dead-zone? The call's already on the device.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="section">
    <div class="wrap">
      <div class="cta-band center reveal">
        <div class="cta-curtain"></div>
        <div style="position:relative">
          <h2 class="title" style="font-size:clamp(28px,4vw,46px)">See it on <em>your show.</em></h2>
          <p class="lede" style="margin:18px auto 30px;max-width:48ch">Spin up a production and feel the difference at your next rehearsal.</p>
          <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
            <a class="btn primary lg" href="#" data-noop>Start free</a>
            <a class="btn ghost lg" href="/pricing">See pricing</a>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
