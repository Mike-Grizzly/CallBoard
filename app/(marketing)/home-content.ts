// Home page body — ported verbatim from the original index.html, with
// inter-page links rewired to the new Next routes (features.html → /features,
// pricing.html → /pricing). Rendered as static markup by home/page.tsx.
// Content is trusted/authored (no user input), so it is safe to inject.
export const HOME_HTML = `
  <!-- HERO -->
  <section class="hero" data-screen-label="Hero">
    <div class="hero-glow"></div>
    <div class="wrap">
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">Built by stage managers</span>
          <h1 class="display">The paper call board, <em>reinvented.</em></h1>
          <p class="lede">Proscene keeps your whole production on the same page — calls, calendars, scripts, blocking, and reports. One hub for the stage manager, the cast, and the crew.</p>
          <div class="hero-actions">
            <a class="btn primary lg" href="/signup">Start free <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>
            <a class="btn lg" href="/contact?reason=demo">Book a demo</a>
          </div>
          <div class="hero-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            Free for your first production · No card required
          </div>
        </div>

        <div class="hero-media">
          <div class="window">
            <div class="window-bar">
              <div class="window-dots"><i></i><i></i><i></i></div>
              <div class="window-url"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>proscene.app/pirates-of-penzance</div>
            </div>
            <div class="mock">
              <div class="mock-card">
                <div class="mock-head">
                  <span class="mock-eyebrow"><span class="dot"></span> Next call</span>
                  <span class="mock-show"><span class="dot"></span> The Pirates of Penzance</span>
                </div>
                <div class="mock-body">
                  <div class="mock-when">Tonight · 7:00 PM – 10:30 PM</div>
                  <div class="mock-title">Act II — Stumble Run</div>
                  <div class="mock-meta">
                    <span>Studio A · Wellman Theatre</span>
                    <span class="pip"></span>
                    <span>Rehearsal 24 of 36</span>
                  </div>
                  <div class="mock-divide"></div>
                  <div class="mock-count">
                    <div>
                      <div class="label">Starts in</div>
                      <div class="mock-timer">04<small>h</small> 10<small>m</small> 59<small>s</small></div>
                    </div>
                    <div class="mock-confirm">
                      <div class="label">Call confirmed</div>
                      <div class="mock-avatars">
                        <span class="av" style="background:#c0563f">TM</span>
                        <span class="av" style="background:#7d6fb0">PA</span>
                        <span class="av" style="background:#4f7fb8">ME</span>
                        <span class="av" style="background:#6bbf7a">WH</span>
                        <span class="av" style="background:#caa24a">IH</span>
                        <span class="av" style="background:var(--bg-sunken);color:var(--ink-3)">+17</span>
                      </div>
                      <div class="mock-bar"><i></i></div>
                      <div style="font-size:11.5px;color:var(--ink-3);margin-top:6px">18 of 22 confirmed</div>
                    </div>
                  </div>
                  <div class="mock-actions">
                    <div class="mock-btn primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg> Send call</div>
                    <div class="mock-btn ghost"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg> View day</div>
                  </div>
                </div>
                <div class="mock-tabs">
                  <span class="mock-tab" data-on>Home</span>
                  <span class="mock-tab">Calendar</span>
                  <span class="mock-tab">Script</span>
                  <span class="mock-tab">Blocking</span>
                  <span class="mock-tab">Reports</span>
                  <span class="mock-tab">People</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- TRUST — add real customer logos here once we have them -->


  <!-- PROBLEM / SOLUTION -->
  <section class="section" data-screen-label="Why Proscene">
    <div class="wrap">
      <div class="section-head center reveal" style="text-align:center">
        <span class="eyebrow no-rule">The end of the group chat scramble</span>
        <h2 class="title" style="margin-top:16px">Sticky notes, spreadsheets, and three<br>different group chats — <em>retired.</em></h2>
        <p class="lede" style="margin-left:auto;margin-right:auto">Stage managers hold a production together with paper and willpower. Proscene gives every show a single source of truth, so a schedule change reaches all 40 people in seconds — not after the fourth follow-up text.</p>
      </div>
      <div class="grid grid-3" style="margin-top:56px">
        <div class="feature-card reveal">
          <div class="feature-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg></div>
          <h3>Calls that actually land</h3>
          <p>Send the call once. Cast and crew confirm with a tap, and you watch the room fill up in real time — no chasing replies across five threads.</p>
        </div>
        <div class="feature-card reveal">
          <div class="feature-ico" data-c="dusk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg></div>
          <h3>One calendar, no conflicts</h3>
          <p>Rehearsals, fittings, work calls, and performances live together. Change a time and every personal schedule updates at once.</p>
        </div>
        <div class="feature-card reveal">
          <div class="feature-ico" data-c="sage"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M19 3H8a2 2 0 0 0-2 2v14a2 2 0 0 1-2-2h13a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M10 8h7M10 12h7M10 16h4"/></svg></div>
          <h3>The book, in everyone's pocket</h3>
          <p>Script, blocking, and notes stay in sync. The whole company opens the same page — the prompt book finally lives somewhere other than your binder.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- FEATURE SPLIT 1 — Production calendar -->
  <section class="section" style="background:var(--bg-muted);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
    <div class="wrap">
      <div class="split reveal">
        <div>
          <span class="eyebrow">Production calendar</span>
          <h2 class="title" style="margin:16px 0 18px">From first read to <em>closing night.</em></h2>
          <p class="lede" style="margin-bottom:24px">Lay out the whole rehearsal period at a glance. Drag to reschedule, flag tech week, and let Proscene surface conflicts before they cost you a room.</p>
          <ul class="checklist">
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Block, scene, and character coverage in one view</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Conflict detection across the full company</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Export a clean rehearsal schedule in a click</li>
          </ul>
          <a class="btn-link" href="/features" style="margin-top:26px;display:inline-flex">See how scheduling works <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>
        </div>
        <div class="split-media">
          <div class="panel">
            <div class="panel-row" style="background:var(--bg-muted);font-weight:600;color:var(--ink)"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg> Week 4 · Apr 28 – May 4</div>
            <div class="panel-row"><span class="pill" data-c="accent"><span class="dot"></span>Mon</span><span class="lead"><b>Act I — Run</b><span>Studio A · Full company</span></span><span class="panel-time">18:30</span></div>
            <div class="panel-row"><span class="pill" data-c="dusk"><span class="dot"></span>Tue</span><span class="lead"><b>Music — Patter songs</b><span>Rehearsal Room 2 · Principals</span></span><span class="panel-time">19:00</span></div>
            <div class="panel-row"><span class="pill" data-c="amber"><span class="dot"></span>Wed</span><span class="lead"><b>Costume fittings</b><span>Wardrobe · Ensemble A</span></span><span class="panel-time">17:00</span></div>
            <div class="panel-row"><span class="pill" data-c="sage"><span class="dot"></span>Thu</span><span class="lead"><b>Act II — Stumble run</b><span>Studio A · Full company</span></span><span class="panel-time">19:00</span></div>
            <div class="panel-row" style="background:var(--accent-soft)"><span class="pill" data-c="clay"><span class="dot"></span>Fri</span><span class="lead"><b style="color:var(--accent-ink)">Conflict flagged</b><span>2 actors double-booked at 19:00</span></span><span class="panel-time">!</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FEATURE SPLIT 2 — Reports -->
  <section class="section">
    <div class="wrap">
      <div class="split flip reveal">
        <div>
          <span class="eyebrow">Rehearsal reports</span>
          <h2 class="title" style="margin:16px 0 18px">The report writes <em>itself.</em></h2>
          <p class="lede" style="margin-bottom:24px">Log notes as the room runs — for sets, lights, costumes, props. Proscene assembles the daily report and sends it to every department before you've packed up the table.</p>
          <ul class="checklist">
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Tag notes to departments as you go</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Auto-formatted daily &amp; performance reports</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Every department sees only what's theirs</li>
          </ul>
          <a class="btn-link" href="/features" style="margin-top:26px;display:inline-flex">Tour the reporting tools <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>
        </div>
        <div class="split-media">
          <div class="panel">
            <div class="panel-row" style="background:var(--bg-muted);font-weight:600;color:var(--ink)"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg> Rehearsal Report · #24</div>
            <div class="panel-row"><span class="pill" data-c="dusk">Scenic</span><span class="lead">Stair unit sticks on the SR turn — needs wax</span></div>
            <div class="panel-row"><span class="pill" data-c="amber">Lighting</span><span class="lead">Add a warm special DSC for Mabel's aria</span></div>
            <div class="panel-row"><span class="pill" data-c="plum">Costumes</span><span class="lead">Pirate King's sash too long, hemming tonight</span></div>
            <div class="panel-row"><span class="pill" data-c="sage">Props</span><span class="lead">Need 6 more practical lanterns by Thu</span></div>
            <div class="panel-row" style="background:var(--bg-muted)"><span class="lead muted" style="font-size:12.5px">Sent to 5 departments · 7:14 PM</span><span class="pill" data-c="sage"><span class="dot"></span>Delivered</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- HOW IT WORKS -->
  <section class="section" style="background:var(--bg-muted);border-top:1px solid var(--border)">
    <div class="wrap">
      <div class="section-head reveal">
        <span class="eyebrow">How it works</span>
        <h2 class="title" style="margin-top:16px">Up and running before <em>your first read-through.</em></h2>
      </div>
      <div class="steps" style="margin-top:48px">
        <div class="step reveal">
          <div class="step-num">1</div>
          <h3>Create the production</h3>
          <p>Name the show, set your venues, and drop in the rehearsal period. Import a cast list from a spreadsheet or add people as they're cast.</p>
        </div>
        <div class="step reveal">
          <div class="step-num">2</div>
          <h3>Invite the company</h3>
          <p>Everyone gets a link. Actors, crew, and designers join with the right access — principals see their calls, designers see their notes.</p>
        </div>
        <div class="step reveal">
          <div class="step-num">3</div>
          <h3>Run the room</h3>
          <p>Send calls, take blocking, log notes, and file reports — from the table, your laptop, or your phone in the wings.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- NIGHT / MOBILE -->
  <section class="section night" id="mobile" data-screen-label="Mobile">
    <div class="wrap">
      <div class="split reveal">
        <div>
          <span class="eyebrow">In the wings</span>
          <h2 class="title" style="margin:16px 0 18px">The whole company,<br>in their <em>pocket.</em></h2>
          <p class="lede" style="margin-bottom:26px">Proscene travels. Cast check tonight's call on the bus, designers read reports over coffee, and you run the deck from backstage. Push a change and everyone feels it buzz.</p>
          <ul class="checklist">
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Push notifications for new calls and changes</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Today screen built for a glance backstage</li>
            <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Works offline in the dressing room dead-zone</li>
          </ul>
        </div>
        <div class="split-media center">
          <div style="display:inline-block;background:var(--night-elev);border:1px solid var(--night-border);border-radius:34px;padding:12px;box-shadow:var(--shadow-4)">
            <div style="width:248px;border-radius:24px;overflow:hidden;background:var(--bg)">
              <div style="background:var(--accent);color:#fff;padding:18px 18px 22px">
                <div style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;opacity:.85;font-weight:600">Tonight · 7:00 PM</div>
                <div style="font-family:var(--font-display);font-size:22px;font-weight:500;margin-top:4px">Act II — Stumble Run</div>
                <div style="font-size:12px;opacity:.9;margin-top:6px">Studio A · You're called</div>
              </div>
              <div style="padding:14px 16px;text-align:left">
                <div style="font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-4);font-weight:600;margin-bottom:10px">Up next</div>
                <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)"><span class="pill" data-c="dusk" style="font-size:11px">5:00</span><span style="font-size:13px;color:var(--ink-2)">Costume fitting</span></div>
                <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)"><span class="pill" data-c="accent" style="font-size:11px">7:00</span><span style="font-size:13px;color:var(--ink-2)">Act II stumble</span></div>
                <div style="display:flex;align-items:center;gap:10px;padding:9px 0"><span class="pill" data-c="sage" style="font-size:11px">9:30</span><span style="font-size:13px;color:var(--ink-2)">Notes session</span></div>
                <div style="margin-top:14px;background:var(--accent);color:#fff;border-radius:9px;text-align:center;padding:11px;font-size:13px;font-weight:500">Confirm call ✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- TESTIMONIAL + STATS removed — add real quotes/metrics here once we have them -->


  <!-- PRICING TEASER -->
  <section class="section" style="background:var(--bg-muted);border-top:1px solid var(--border)">
    <div class="wrap">
      <div class="section-head center reveal" style="text-align:center">
        <span class="eyebrow no-rule">Simple, per-production pricing</span>
        <h2 class="title" style="margin-top:16px">Pay for the <em>shows you're running.</em></h2>
        <p class="lede" style="margin-left:auto;margin-right:auto">Start free, invite the whole company at no extra cost, and only pay when you're producing.</p>
      </div>
      <div class="ptease reveal" style="margin-top:48px">
        <div class="ptier">
          <div class="tname">Understudy</div>
          <div class="tprice">Free</div>
          <div class="tdesc">One active production. The essentials for a single show.</div>
        </div>
        <div class="ptier" data-feat>
          <span class="pill" data-c="accent" style="align-self:flex-start;margin-bottom:6px"><span class="dot"></span>Most popular</span>
          <div class="tname">Company</div>
          <div class="tprice">$29<small> / production</small></div>
          <div class="tdesc">Unlimited people, reports, and storage for your season.</div>
        </div>
        <div class="ptier">
          <div class="tname">Resident</div>
          <div class="tprice">Custom</div>
          <div class="tdesc">For theatres running many shows a year. SSO and support.</div>
        </div>
      </div>
      <div class="center" style="margin-top:32px">
        <a class="btn lg" href="/pricing">Compare plans <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>
      </div>
    </div>
  </section>

  <!-- FINAL CTA -->
  <section class="section">
    <div class="wrap">
      <div class="cta-band center reveal" id="signup">
        <div class="cta-curtain"></div>
        <div style="position:relative">
          <h2 class="title" style="font-size:clamp(28px,4vw,46px)">Your next production is <em>already late</em> to load in.</h2>
          <p class="lede" style="margin:18px auto 30px;max-width:52ch">Set up your show in five minutes. Invite the company in one. Run the room like you've used it for years.</p>
          <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
            <a class="btn primary lg" href="/signup">Start free</a>
            <a class="btn ghost lg" href="/contact?reason=demo">Book a demo</a>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
