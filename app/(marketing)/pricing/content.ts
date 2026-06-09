// Pricing page body — split into fragments so the tier cards can be rendered
// from Sanity (SanityTiers) when present, with this static version as fallback.
//
// Model: the ORGANIZATION subscribes; participants (cast/crew/designers) are
// always free. Tiers differ only by how many productions you can run at once —
// every paid tier includes the full toolset. New orgs get a 60-day free trial
// that starts with their first production.
const TICK =
  '<span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>';
const YES =
  '<td class="yes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></td>';

export const PRICING_HERO_HTML = `
  <section class="page-hero">
    <div class="wrap">
      <span class="eyebrow no-rule" style="justify-content:center">Pricing</span>
      <h1 class="display" style="margin-top:16px;font-size:clamp(36px,5.4vw,64px)">Pay for the shows you run. <em>Never for the people in them.</em></h1>
      <p class="lede" style="margin:18px auto 0;max-width:56ch">Your whole company — cast, crew, designers, stage management, front of house — works in Proscene at no per-seat cost, on every plan. You only pay per active production.</p>
      <div class="billing" role="group" aria-label="Billing period">
        <button data-period="annual" data-on>Annual <span class="save">save ~20%</span></button>
        <button data-period="monthly">Monthly</button>
      </div>
    </div>
  </section>
`;

export const PRICING_TIERS_HTML = `
  <section class="section" style="padding-top:36px">
    <div class="wrap">
      <div class="tiers reveal">
        <div class="tier">
          <div class="tier-name">Season</div>
          <div class="tier-desc">For companies that run one show at a time.</div>
          <div class="tier-price"><span class="amt" data-price data-annual="$249" data-monthly="$25">$249</span><span class="per" data-per>/ yr</span></div>
          <div class="tier-sub" data-note data-annual="Billed yearly" data-monthly="Billed monthly">Billed yearly</div>
          <a class="btn primary" href="/signup">Start 60-day free trial</a>
          <ul class="tier-list">
            <li>${TICK} 1 active production</li>
            <li>${TICK} Unlimited cast &amp; crew</li>
            <li>${TICK} Reports, calls, scripts, blocking</li>
            <li>${TICK} Document &amp; media library</li>
            <li>${TICK} Mobile app for the whole company</li>
          </ul>
        </div>
        <div class="tier" data-feat>
          <span class="tier-flag">Most popular</span>
          <div class="tier-name">Repertory</div>
          <div class="tier-desc">For busy and multi-stage companies juggling several shows.</div>
          <div class="tier-price"><span class="amt" data-price data-annual="$499" data-monthly="$49">$499</span><span class="per" data-per>/ yr</span></div>
          <div class="tier-sub" data-note data-annual="Billed yearly" data-monthly="Billed monthly">Billed yearly</div>
          <a class="btn primary" href="/signup">Start 60-day free trial</a>
          <ul class="tier-list">
            <li>${TICK} Up to 3 productions at once</li>
            <li>${TICK} Everything in Season</li>
            <li>${TICK} Unlimited cast &amp; crew</li>
            <li>${TICK} The complete production toolset</li>
            <li>${TICK} Email support</li>
          </ul>
        </div>
        <div class="tier">
          <div class="tier-name">Company</div>
          <div class="tier-desc">For theatres and programs running a full season.</div>
          <div class="tier-price"><span class="amt" data-price data-annual="$799" data-monthly="$79">$799</span><span class="per" data-per>/ yr</span></div>
          <div class="tier-sub" data-note data-annual="Billed yearly" data-monthly="Billed monthly">Billed yearly</div>
          <a class="btn" href="/signup">Start 60-day free trial</a>
          <ul class="tier-list">
            <li>${TICK} Unlimited productions</li>
            <li>${TICK} Everything in Repertory</li>
            <li>${TICK} Unlimited cast &amp; crew</li>
            <li>${TICK} Custom branding</li>
            <li>${TICK} Priority support</li>
          </ul>
        </div>
      </div>
      <p class="center kicker" style="margin-top:26px">Performers, crew, and stage managers never pay — only the company that runs the show subscribes.</p>
    </div>
  </section>
`;

export const PRICING_EDU_HTML = `
  <section class="section" style="padding-top:0">
    <div class="wrap-narrow">
      <div class="edu-band reveal" style="text-align:center;border:1px solid var(--border);border-radius:18px;padding:34px 28px;background:var(--bg-muted)">
        <span class="eyebrow no-rule" style="justify-content:center">Schools &amp; universities</span>
        <h2 class="title" style="margin-top:12px;font-size:clamp(24px,3.4vw,36px)">Special pricing for <em>education.</em></h2>
        <p class="lede" style="margin:14px auto 0;max-width:52ch">Drama departments, university theatre programs, and educators get a discounted plan for the school year. Tell us a little about your program and we'll get you set up.</p>
        <p style="margin:22px 0 0"><a class="btn primary" href="/contact?reason=school">Get education pricing</a></p>
        <p class="muted" style="font-size:13px;margin-top:14px">We verify quickly by hand — a department email or your program's website is plenty. No paperwork.</p>
      </div>
    </div>
  </section>
`;

export const PRICING_REST_HTML = `
  <section class="section" style="background:var(--bg-muted);border-top:1px solid var(--border)">
    <div class="wrap">
      <div class="section-head center reveal" style="text-align:center;margin-bottom:8px">
        <span class="eyebrow no-rule">Compare plans</span>
        <h2 class="title" style="margin-top:14px">Everything, side by <em>side.</em></h2>
      </div>
      <div class="compare-wrap reveal">
        <table class="compare">
          <thead>
            <tr><th>Feature</th><th>Season</th><th>Repertory</th><th>Company</th></tr>
          </thead>
          <tbody>
            <tr class="grouphd"><td colspan="4">The essentials</td></tr>
            <tr><td>Active productions at once</td><td>1</td><td>3</td><td>Unlimited</td></tr>
            <tr><td>Cast, crew &amp; designers</td><td>Unlimited</td><td>Unlimited</td><td>Unlimited</td></tr>
            <tr><td>Calls, calendar &amp; confirmations</td>${YES}${YES}${YES}</tr>
            <tr class="grouphd"><td colspan="4">The book</td></tr>
            <tr><td>Script &amp; scene breakdown</td>${YES}${YES}${YES}</tr>
            <tr><td>Blocking &amp; ground plans</td>${YES}${YES}${YES}</tr>
            <tr><td>Auto reports &amp; PDF export</td>${YES}${YES}${YES}</tr>
            <tr><td>Document &amp; media library</td>${YES}${YES}${YES}</tr>
            <tr class="grouphd"><td colspan="4">For organizations</td></tr>
            <tr><td>Custom branding</td><td class="no">—</td><td class="no">—</td>${YES}</tr>
            <tr><td>Support</td><td>Email</td><td>Email</td><td>Priority</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap-narrow">
      <div class="section-head center reveal" style="text-align:center;margin:0 auto 36px">
        <span class="eyebrow no-rule">Billing questions</span>
        <h2 class="title" style="margin-top:14px">The fine print, <em>in plain English.</em></h2>
      </div>
      <div class="faq-mini reveal">
        <details class="qa"><summary>Do I pay for everyone in my company?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Never. Only the organization running the show subscribes. Every performer, crew member, designer, and stage manager you invite works in Proscene for free — whether your show has a cast of four or forty.</p></details>
        <details class="qa"><summary>How does the free trial work?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Your 60-day free trial starts when you create your first production — not the day you sign up — so the clock never runs out before you've really begun. No card required. Subscribe any time to keep going.</p></details>
        <details class="qa"><summary>What happens when the trial ends?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>So we never pull the rug out mid-tech, your day-to-day stays on: you keep sending rehearsal reports, announcements, and call schedules for a grace period to finish your run. The script and blocking tools pause until you subscribe, and you can always view and export everything you've made.</p></details>
        <details class="qa"><summary>Can I be a participant without paying?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Absolutely. Sign up as a participant and you'll join the productions you're invited to with no cost and no company to set up. If you ever decide to run your own show, you can create a workspace any time.</p></details>
        <details class="qa"><summary>Is there pricing for schools?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Yes — drama departments and university programs get discounted education pricing for the school year. <a href="/contact?reason=school">Reach out</a> and we'll verify your program by hand and get you set up.</p></details>
        <details class="qa"><summary>What happens to my data if I cancel?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Your productions are yours. Export everything to PDF and CSV at any time, and closed shows stay readable. We never remove uploaded files without warning you well in advance, with time to download them first.</p></details>
      </div>
      <p class="center" style="margin-top:34px"><a class="btn-link" href="/faq" style="display:inline-flex">Read the full FAQ <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a></p>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="wrap">
      <div class="cta-band center reveal">
        <div class="cta-curtain"></div>
        <div style="position:relative">
          <h2 class="title" style="font-size:clamp(28px,4vw,46px)">Start free. Subscribe when <em>you load in.</em></h2>
          <p class="lede" style="margin:18px auto 30px;max-width:48ch">Your first production is free for 60 days — no card, and the clock only starts when you do.</p>
          <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
            <a class="btn primary lg" href="/signup">Start free</a>
            <a class="btn ghost lg" href="/contact?reason=demo">Book a demo</a>
          </div>
        </div>
      </div>
    </div>
  </section>
`;

// Full static page (fallback when Sanity has no pricing tiers).
export const PRICING_HTML =
  PRICING_HERO_HTML + PRICING_TIERS_HTML + PRICING_EDU_HTML + PRICING_REST_HTML;
