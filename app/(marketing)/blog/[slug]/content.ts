// Blog post body — ported from blogpost.html (links rewired to Next routes).
const POST = "/blog/setup-your-first-production";

export const BLOGPOST_HTML = `
  <article>
    <header class="art-hero">
      <div class="wrap-narrow">
        <a class="art-back" href="/blog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg> Back to the blog</a>
        <div class="art-meta">
          <span class="pill" data-c="accent">Walkthrough</span>
          <span class="read mono" style="color:var(--ink-4)">8 min read</span>
        </div>
        <h1 class="art-title">Set up your first production in ProScene</h1>
        <p class="art-lede">A blank screen to your first call going out, step by step. We'll build a real show — <em>The Pirates of Penzance</em> — and have the whole company confirmed by the end.</p>
        <div class="art-byline">
          <span class="av">MO</span>
          <div><b>Maya Okafor</b><span>Head of Community · May 28, 2026</span></div>
        </div>
      </div>
      <div class="wrap">
        <div class="ph art-cover" data-accent data-label="cover / new-production.jpg" style="background:repeating-linear-gradient(135deg, var(--accent-soft) 0 12px, color-mix(in oklch,var(--accent-soft) 70%,var(--bg)) 12px 24px)"></div>
      </div>
    </header>

    <div class="section">
      <div class="art-body">
        <p>If you've stage-managed before, you know the first week is mostly logistics: a cast list, a calendar, a venue, and a hundred small details you'll spend the run keeping straight. The promise of ProScene is that you do this <strong>once</strong> — and then it works for you every night after. Here's the whole setup, start to finish.</p>

        <div class="callout"><b>Before you start:</b> have your cast list handy (a spreadsheet is perfect) and know your rehearsal dates and venue. That's everything you need.</div>

        <h2><span class="step">Step one</span>Create the production</h2>
        <p>From your workspace, hit <strong>New production</strong>. Name the show, set the company it belongs to, and pick your dates — first rehearsal through closing night. ProScene uses these to build the spine of your calendar, so don't worry about being precise yet; you can move anything later.</p>
        <p>Add your venues while you're here. Most shows have a couple — a rehearsal studio and the theatre itself. Naming them now means every call you send later just references the right room.</p>

        <div class="panel">
          <div class="panel-row panel-head">New production</div>
          <div class="panel-row"><span class="lead"><b>The Pirates of Penzance</b><span style="font-size:12px;color:var(--ink-4)">Gilbert &amp; Sullivan · Comic opera</span></span><span class="pill" data-c="accent">Spring season</span></div>
          <div class="panel-row"><span class="lead">Rehearsals begin</span><span class="mono" style="font-size:12px;color:var(--ink-3)">Apr 7 → Jun 1</span></div>
          <div class="panel-row"><span class="lead">Venues</span><span class="mono" style="font-size:12px;color:var(--ink-3)">Studio A · Wellman Theatre</span></div>
        </div>

        <h2><span class="step">Step two</span>Bring in your company</h2>
        <p>This is the part people dread and shouldn't. Instead of typing 22 actors by hand, paste your cast list straight from a spreadsheet. ProScene reads the columns and maps them — name, role, email, phone, emergency contact — and you confirm the matches in one pass.</p>
        <ul>
          <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Paste from Sheets, Excel, or Numbers — or upload a CSV</li>
          <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Set each person's role: principal, ensemble, crew, design, FOH</li>
          <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Reuse a company you've built before in one click</li>
        </ul>
        <p>Everyone you add gets an invite. They tap one link, and they're in — seeing exactly what their role should see and nothing more.</p>

        <div class="pull">"The first time I imported a cast list and watched 22 people appear in ten seconds, I genuinely laughed out loud at my desk."</div>

        <h2><span class="step">Step three</span>Build the rehearsal calendar</h2>
        <p>Now the part that earns its keep. Lay out your rehearsal period — block by block, scene by scene. Drag to reschedule, mark tech week, and as you go, ProScene quietly checks the cast's availability and flags conflicts <em>before</em> they cost you a room.</p>
        <div class="ph" data-label="screenshot / production-calendar.jpg"></div>
        <p>You don't have to plan the whole period in one sitting. Most stage managers rough in the shape — read-throughs, music calls, blocking weeks, runs, tech — and fill in detail a week at a time. The calendar is the single source everyone reads from, so a change you make here reaches all 22 phones at once.</p>

        <h2><span class="step">Step four</span>Send your first call</h2>
        <p>Pick a rehearsal, choose who's needed — by scene, by role, or hand-picked — and send. That's it. The call lands on everyone's device, they confirm with a tap, and you watch the room fill up in real time.</p>
        <div class="panel">
          <div class="panel-row panel-head">Tonight · Act II Stumble Run · 7:00 PM</div>
          <div class="panel-row"><span class="lead"><b>Tom Mercer</b> · Pirate King</span><span class="pill" data-c="sage"><span class="dot"></span>Confirmed</span></div>
          <div class="panel-row"><span class="lead"><b>Priya Anand</b> · Mabel</span><span class="pill" data-c="sage"><span class="dot"></span>Confirmed</span></div>
          <div class="panel-row"><span class="lead"><b>Marcus Ellroy</b> · Sergeant</span><span class="pill" data-c="amber"><span class="dot"></span>Seen</span></div>
        </div>
        <p>No more "did everyone get that?" The night before and the morning of, ProScene nudges anyone who hasn't confirmed — so you're not the human reminder service anymore.</p>

        <div class="callout"><b>That's the whole setup.</b> From here, you layer in the script, take blocking, and file reports as you rehearse — but the show is already running on ProScene, and you did it in about ten minutes.</div>

        <p>The point isn't the software. It's the hour you get back every night, and the quiet certainty that the whole company knows where to be. Build the show once. Let it carry you to closing.</p>
      </div>

      <div class="art-foot">
        <span class="kicker">Written by Maya Okafor · Head of Community</span>
        <div style="display:flex;gap:10px">
          <a class="btn sm" href="#" data-noop>Share</a>
          <a class="btn primary sm" href="#" data-noop>Start your production</a>
        </div>
      </div>

      <div class="wrap-narrow" style="margin-top:48px">
        <h3 class="subtitle" style="margin-bottom:4px">Keep reading</h3>
        <div class="more">
          <a href="${POST}">
            <div class="ph" data-label="reports.jpg"></div>
            <div class="b"><h4>Daily reports that send themselves</h4><span>Walkthrough · 6 min</span></div>
          </a>
          <a href="${POST}">
            <div class="ph" data-label="tech-week.jpg"></div>
            <div class="b"><h4>Surviving tech week: a checklist</h4><span>SM craft · 11 min</span></div>
          </a>
        </div>
      </div>
    </div>
  </article>

  <!-- CTA -->
  <section class="section" style="padding-top:0">
    <div class="wrap">
      <div class="cta-band center reveal">
        <div class="cta-curtain"></div>
        <div style="position:relative">
          <h2 class="title" style="font-size:clamp(28px,4vw,46px)">Ready to set up <em>your show?</em></h2>
          <p class="lede" style="margin:18px auto 30px;max-width:46ch">Ten minutes from now, your company could be confirming their first call.</p>
          <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
            <a class="btn primary lg" href="#" data-noop>Start free</a>
            <a class="btn ghost lg" href="/features">Tour the features</a>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
