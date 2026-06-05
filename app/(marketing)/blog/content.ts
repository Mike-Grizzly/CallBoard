// Blog index page body — ported from blog.html. All post links point at the
// single available post for now (/blog/setup-your-first-production).
const POST = "/blog/setup-your-first-production";

export const BLOG_HTML = `
  <section class="page-hero">
    <div class="wrap">
      <span class="eyebrow">The ProScene blog</span>
      <h1 class="display" style="margin-top:18px;font-size:clamp(34px,5vw,58px)">Notes from the <em>prompt desk.</em></h1>
      <p class="lede lede-narrow" style="margin-top:18px">Walkthroughs, stage-management craft, and the occasional opinion about call times — written by people who've held the book.</p>
      <div class="blog-tabs">
        <button class="blog-tab" data-on>All</button>
        <button class="blog-tab">Walkthroughs</button>
        <button class="blog-tab">SM craft</button>
        <button class="blog-tab">Product</button>
        <button class="blog-tab">Company stories</button>
      </div>
    </div>
  </section>

  <!-- FEATURED -->
  <section class="section-tight">
    <div class="wrap">
      <a class="feat-post reveal" href="${POST}">
        <div class="ph" data-accent data-label="hero / setup-walkthrough.jpg"></div>
        <div class="body">
          <div class="meta">
            <span class="pill" data-c="accent">Walkthrough</span>
            <span class="read">8 min read</span>
          </div>
          <h2>Set up your first production in ProScene — a 10-minute walkthrough</h2>
          <p>From a blank screen to your first call going out. We build a real show step by step: venues, cast list, the rehearsal calendar, and sending a call the whole company confirms.</p>
          <span class="btn-link" style="display:inline-flex">Read the walkthrough <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></span>
          <div class="by" style="margin-top:14px">Maya Okafor · Head of Community · May 28, 2026</div>
        </div>
      </a>
    </div>
  </section>

  <!-- GRID -->
  <section class="section" style="padding-top:8px">
    <div class="wrap">
      <div class="posts reveal">
        <a class="post" href="${POST}">
          <div class="ph" data-label="reports-feature.jpg"></div>
          <div class="body">
            <div class="meta"><span class="pill" data-c="amber">Walkthrough</span><span class="read">6 min</span></div>
            <h3>Daily reports that send themselves</h3>
            <p>Tag notes by department as the room runs, and let ProScene format and route the report before you've packed up.</p>
            <div class="by">Devon Cole · May 21, 2026</div>
          </div>
        </a>

        <a class="post" href="${POST}">
          <div class="ph" data-label="blocking-guide.jpg"></div>
          <div class="body">
            <div class="meta"><span class="pill" data-c="clay">SM craft</span><span class="read">9 min</span></div>
            <h3>Blocking notation that anyone can read back</h3>
            <p>A field guide to recording moves so your shorthand survives the night — and makes sense to the swing six weeks later.</p>
            <div class="by">Jordan Liu · May 14, 2026</div>
          </div>
        </a>

        <a class="post" href="${POST}">
          <div class="ph" data-label="conflict-detection.jpg"></div>
          <div class="body">
            <div class="meta"><span class="pill" data-c="dusk">Product</span><span class="read">4 min</span></div>
            <h3>New: conflict detection across your whole company</h3>
            <p>ProScene now flags double-bookings before you schedule them. Here's how it reads the cast's availability.</p>
            <div class="by">The ProScene team · May 7, 2026</div>
          </div>
        </a>

        <a class="post" href="${POST}">
          <div class="ph" data-label="cast-list-import.jpg"></div>
          <div class="body">
            <div class="meta"><span class="pill" data-c="accent">Walkthrough</span><span class="read">5 min</span></div>
            <h3>Import a cast list in under a minute</h3>
            <p>Paste from a spreadsheet, map the columns, and you've got a full company with roles, contacts, and conflicts.</p>
            <div class="by">Maya Okafor · Apr 30, 2026</div>
          </div>
        </a>

        <a class="post" href="${POST}">
          <div class="ph" data-label="school-story.jpg"></div>
          <div class="body">
            <div class="meta"><span class="pill" data-c="sage">Company story</span><span class="read">7 min</span></div>
            <h3>How Hart House ran a 38-student musical without a single missed call</h3>
            <p>A high-school theatre program swapped three group chats for one ProScene — and the director got her voice back.</p>
            <div class="by">Rachel Pruitt · Apr 23, 2026</div>
          </div>
        </a>

        <a class="post" href="${POST}">
          <div class="ph" data-label="tech-week.jpg"></div>
          <div class="body">
            <div class="meta"><span class="pill" data-c="clay">SM craft</span><span class="read">11 min</span></div>
            <h3>Surviving tech week: a stage manager's checklist</h3>
            <p>The calls, the cue-to-cue, the running times — what to track, when to call breaks, and how to keep everyone fed and sane.</p>
            <div class="by">Aisha Khan · Apr 16, 2026</div>
          </div>
        </a>
      </div>
    </div>
  </section>

  <!-- NEWSLETTER -->
  <section class="section" style="padding-top:0">
    <div class="wrap-narrow">
      <div class="card card-pad center reveal" style="padding:clamp(32px,4vw,48px)">
        <span class="eyebrow no-rule" style="justify-content:center;margin-bottom:14px">The half-hour call</span>
        <h3 class="subtitle">A short letter for stage managers, twice a month.</h3>
        <p class="lede" style="margin:12px auto 24px;max-width:46ch">Craft, product updates, and the occasional war story. No spam — unsubscribe in a tap.</p>
        <form style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;max-width:440px;margin:0 auto" data-noop-form>
          <input type="email" placeholder="you@theatre.com" aria-label="Email" style="flex:1;min-width:220px;height:50px;border:1px solid var(--border-strong);border-radius:var(--radius);padding:0 16px;font-size:15px;font-family:inherit;background:var(--bg-elev)">
          <button class="btn primary" style="height:50px" type="submit">Subscribe</button>
        </form>
      </div>
    </div>
  </section>
`;
