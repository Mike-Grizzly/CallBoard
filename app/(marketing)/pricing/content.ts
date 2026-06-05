// Pricing page body — ported from pricing.html (links rewired to Next routes).
const TICK =
  '<span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>';
const CROSS =
  '<span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></span>';
const YES =
  '<td class="yes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></td>';

export const PRICING_HTML = `
  <section class="page-hero">
    <div class="wrap">
      <span class="eyebrow no-rule" style="justify-content:center">Pricing</span>
      <h1 class="display" style="margin-top:16px;font-size:clamp(36px,5.4vw,64px)">Pay for the <em>shows you run.</em></h1>
      <p class="lede" style="margin:18px auto 0;max-width:54ch">No per-seat fees, ever. Invite the entire company — cast, crew, designers, front of house — at no extra cost. You only pay per active production.</p>
      <div class="billing" role="group" aria-label="Billing period">
        <button data-period="production" data-on>Per production</button>
        <button data-period="annual">Annual <span class="save">save 20%</span></button>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:36px">
    <div class="wrap">
      <div class="tiers reveal">
        <!-- FREE -->
        <div class="tier">
          <div class="tier-name">Understudy</div>
          <div class="tier-desc">For your first show, or a small one-off production.</div>
          <div class="tier-price"><span class="amt">Free</span></div>
          <div class="tier-sub">Forever, one active show</div>
          <a class="btn" href="#" data-noop>Start free</a>
          <ul class="tier-list">
            <li>${TICK} 1 active production</li>
            <li>${TICK} Unlimited people on the show</li>
            <li>${TICK} Calls, calendar &amp; people</li>
            <li>${TICK} Mobile app for the company</li>
            <li class="off">${CROSS} Script, blocking &amp; reports</li>
          </ul>
        </div>
        <!-- COMPANY -->
        <div class="tier" data-feat>
          <span class="tier-flag">Most popular</span>
          <div class="tier-name">Company</div>
          <div class="tier-desc">Everything a production needs, from read-through to strike.</div>
          <div class="tier-price"><span class="amt" data-price data-production="$29" data-annual="$23">$29</span><span class="per" data-per>/ production</span></div>
          <div class="tier-sub" data-note data-production="One-time, per show" data-annual="Billed annually, per show">One-time, per show</div>
          <a class="btn primary" href="#" data-noop>Start free trial</a>
          <ul class="tier-list">
            <li>${TICK} Unlimited productions</li>
            <li>${TICK} Script, blocking &amp; ground plans</li>
            <li>${TICK} Auto rehearsal &amp; performance reports</li>
            <li>${TICK} Document &amp; video library, 50&nbsp;GB</li>
            <li>${TICK} PDF export &amp; calendar sync</li>
          </ul>
        </div>
        <!-- RESIDENT -->
        <div class="tier">
          <div class="tier-name">Resident</div>
          <div class="tier-desc">For theatres and programs running a full season.</div>
          <div class="tier-price"><span class="amt">Custom</span></div>
          <div class="tier-sub">Talk to us about your season</div>
          <a class="btn" href="#demo" data-noop>Book a demo</a>
          <ul class="tier-list">
            <li>${TICK} Everything in Company</li>
            <li>${TICK} Season &amp; venue management</li>
            <li>${TICK} SSO &amp; shared company directory</li>
            <li>${TICK} Unlimited storage</li>
            <li>${TICK} Priority support &amp; onboarding</li>
          </ul>
        </div>
      </div>
      <p class="center kicker" style="margin-top:26px">Students &amp; educators get Company free.
        <a class="btn-link" href="#" data-noop style="display:inline-flex;vertical-align:middle">Verify your school <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>
      </p>
    </div>
  </section>

  <!-- COMPARISON -->
  <section class="section" style="background:var(--bg-muted);border-top:1px solid var(--border)">
    <div class="wrap">
      <div class="section-head center reveal" style="text-align:center;margin-bottom:8px">
        <span class="eyebrow no-rule">Compare plans</span>
        <h2 class="title" style="margin-top:14px">Everything, side by <em>side.</em></h2>
      </div>
      <div class="compare-wrap reveal">
        <table class="compare">
          <thead>
            <tr><th>Feature</th><th>Understudy</th><th>Company</th><th>Resident</th></tr>
          </thead>
          <tbody>
            <tr class="grouphd"><td colspan="4">Running the room</td></tr>
            <tr><td>Active productions</td><td>1</td><td>Unlimited</td><td>Unlimited</td></tr>
            <tr><td>People per production</td><td>Unlimited</td><td>Unlimited</td><td>Unlimited</td></tr>
            <tr><td>Calls &amp; confirmations</td>${YES}${YES}${YES}</tr>
            <tr><td>Production calendar</td>${YES}${YES}${YES}</tr>
            <tr class="grouphd"><td colspan="4">The book</td></tr>
            <tr><td>Script &amp; scene breakdown</td><td class="no">—</td>${YES}${YES}</tr>
            <tr><td>Blocking &amp; ground plans</td><td class="no">—</td>${YES}${YES}</tr>
            <tr><td>Auto reports &amp; PDF export</td><td class="no">—</td>${YES}${YES}</tr>
            <tr><td>Storage</td><td>2 GB</td><td>50 GB</td><td>Unlimited</td></tr>
            <tr class="grouphd"><td colspan="4">For organizations</td></tr>
            <tr><td>Season &amp; venue management</td><td class="no">—</td><td class="no">—</td>${YES}</tr>
            <tr><td>SSO &amp; shared directory</td><td class="no">—</td><td class="no">—</td>${YES}</tr>
            <tr><td>Priority support &amp; onboarding</td><td class="no">—</td><td>Standard</td>${YES}</tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- PRICING FAQ -->
  <section class="section">
    <div class="wrap-narrow">
      <div class="section-head center reveal" style="text-align:center;margin:0 auto 36px">
        <span class="eyebrow no-rule">Billing questions</span>
        <h2 class="title" style="margin-top:14px">The fine print, <em>in plain English.</em></h2>
      </div>
      <div class="faq-mini reveal">
        <details class="qa"><summary>What counts as a "production"?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>One show, from pre-production through strike. Invite as many cast, crew, and designers as you like — there are never per-person fees. A production stays editable as an archive after you close.</p></details>
        <details class="qa"><summary>Do I pay for everyone in my company?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Never. ProScene is priced per production, not per seat. Whether your show has a cast of four or forty, the price is the same.</p></details>
        <details class="qa"><summary>Can I try Company before paying?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Yes — every new production starts with a 14-day Company trial. No card required. When it ends you can keep the show on the free Understudy plan or upgrade to unlock script, blocking, and reports.</p></details>
        <details class="qa"><summary>Is there really a free plan for schools?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Students and educators get the full Company plan free on verified school productions. Verify with a .edu address or a quick note from your department.</p></details>
        <details class="qa"><summary>What happens to my data if I cancel?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Your productions are yours. Export everything to PDF and CSV at any time, and archived shows stay readable on the free plan. We never delete a closed production without telling you first.</p></details>
      </div>
      <p class="center" style="margin-top:34px"><a class="btn-link" href="/faq" style="display:inline-flex">Read the full FAQ <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a></p>
    </div>
  </section>

  <!-- CTA -->
  <section class="section" style="padding-top:0">
    <div class="wrap">
      <div class="cta-band center reveal">
        <div class="cta-curtain"></div>
        <div style="position:relative">
          <h2 class="title" style="font-size:clamp(28px,4vw,46px)">Start free. Upgrade when <em>you load in.</em></h2>
          <p class="lede" style="margin:18px auto 30px;max-width:48ch">Your first production is on us — no card, no countdown clock.</p>
          <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
            <a class="btn primary lg" href="#" data-noop>Start free</a>
            <a class="btn ghost lg" href="#demo" data-noop>Book a demo</a>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
