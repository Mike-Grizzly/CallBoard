// Pricing page body, split into fragments so the COMPANIES tier cards can be
// rendered from Sanity (SanityTiers) when present, with the static version as
// fallback.
//
// Model: the ORGANIZATION subscribes; participants (cast, crew, designers) are
// always free. Company plans differ only by how many productions you can run at
// once. A separate "Proscene Studio" set of personal plans serves
// freelance designers and choreographers and is billed to the individual.
//
// Two controls live in the hero:
//   1) Audience segmented control. Sets data-aud on the [data-page="pricing"]
//      container, which swaps the [data-aud-panel] panels via CSS.
//   2) Billing toggle. Rewrites prices/period/sub-labels from the
//      data-amt-monthly / data-amt-annual / data-per / data-sub-* attributes.
const TICK =
  '<span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>';
const YES =
  '<td class="yes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></td>';
const NO = '<td class="no">&ndash;</td>';

export const PRICING_HERO_HTML = `
  <section class="page-hero">
    <div class="wrap">
      <span class="eyebrow no-rule" style="justify-content:center">Pricing</span>
      <h1 class="display" style="margin-top:16px;font-size:clamp(36px,5.4vw,64px)">Pay for the shows <em>you run.</em></h1>
      <p class="lede" style="margin:18px auto 0;max-width:56ch">Never for the people in them. Whether you're a company running a season or a designer touring between them, your collaborators are always free.</p>
      <div class="controls">
        <div class="aud-toggle" role="tablist" aria-label="Who's paying?">
          <button class="aud-seg" id="tab-designers" role="tab" type="button" data-aud="designers" aria-controls="pricing-panels" aria-selected="false" tabindex="-1">For individuals</button>
          <button class="aud-seg" id="tab-companies" role="tab" type="button" data-aud="companies" aria-controls="pricing-panels" aria-selected="true" tabindex="0">For companies</button>
          <span class="aud-thumb" aria-hidden="true"></span>
        </div>
        <div class="billing" role="group" aria-label="Billing period">
          <button data-period="monthly" data-on>Monthly</button>
          <button data-period="annual">Annual <span class="save">save ~20%</span></button>
        </div>
      </div>
    </div>
  </section>
`;

// Lead-in line that sits above the COMPANIES tiers. Kept separate so it can wrap
// the Sanity-driven tiers when present.
export const PRICING_COMPANIES_LEAD_HTML = `
      <div class="panel-lead">
        <span class="eyebrow no-rule">For companies &amp; theatres</span>
        <h2>Plans differ only by how many shows you run <em>at once.</em></h2>
        <p>Every paid plan includes the entire toolset and unlimited cast, crew, and creative team. New organizations get a 60-day free trial, no card, and the clock starts at your first production, not signup.</p>
      </div>
`;

// Everything in the COMPANIES panel that sits BELOW the tier cards. Shared by
// both the static and Sanity-driven renderings.
export const PRICING_COMPANIES_REST_HTML = `
      <div class="free-banner">
        <div class="fb-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <div class="fb-body">
          <b>Participants are always free.</b>
          <p>Anyone you invite to a show, actors, crew, designers, stage managers, works free, with no plan and no card. There are never per-seat fees on any tier.</p>
        </div>
        <a class="btn-link" href="/help/get-started/invite-your-company" style="display:inline-flex">How invites work <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>
      </div>

      <div class="includes">
        <div class="includes-head">
          <span class="lbl">Every paid plan includes</span>
          <h3>The whole toolset, <em>no add-ons, no upsells.</em></h3>
        </div>
        <div class="inc-grid">
          <div>${TICK} Script &amp; scene breakdown</div>
          <div>${TICK} Blocking &amp; ground plans</div>
          <div>${TICK} Auto reports &amp; PDF export</div>
          <div>${TICK} Calls, calendar &amp; confirmations</div>
          <div>${TICK} Document &amp; media library</div>
          <div>${TICK} AI script setup &amp; mobile app</div>
        </div>
      </div>

      <div class="compare-wrap">
        <table class="compare">
          <thead>
            <tr><th>Plan</th><th>Participant</th><th>Season</th><th data-feat>Repertory</th><th>Company</th></tr>
          </thead>
          <tbody>
            <tr class="grouphd"><td colspan="5">What you pay</td></tr>
            <tr><td>Billed to</td><td>Free</td><td>The org</td><td>The org</td><td>The org</td></tr>
            <tr><td>Active productions at once</td><td>1 (all-time)</td><td>1</td><td>3</td><td>Unlimited</td></tr>
            <tr><td>People per production</td><td>Unlimited</td><td>Unlimited</td><td>Unlimited</td><td>Unlimited</td></tr>
            <tr><td>Storage</td><td>5 GB</td><td>100 GB</td><td>250 GB</td><td>500 GB</td></tr>
            <tr class="grouphd"><td colspan="5">The toolset</td></tr>
            <tr><td>Calls, calendar &amp; confirmations</td>${YES}${YES}${YES}${YES}</tr>
            <tr><td>Script &amp; AI script setup</td>${NO}${YES}${YES}${YES}</tr>
            <tr><td>Blocking &amp; ground plans</td>${NO}${YES}${YES}${YES}</tr>
            <tr><td>Auto reports &amp; PDF export</td>${NO}${YES}${YES}${YES}</tr>
            <tr><td>Document &amp; media library</td>${NO}${YES}${YES}${YES}</tr>
            <tr><td>Mobile app</td>${YES}${YES}${YES}${YES}</tr>
            <tr class="grouphd"><td colspan="5">Company &amp; support</td></tr>
            <tr><td>Custom branding</td>${NO}${NO}${NO}${YES}</tr>
            <tr><td>Support</td>${NO}<td>Standard</td><td>Email</td><td>Priority</td></tr>
          </tbody>
        </table>
      </div>

      <div class="edu-band">
        <div class="edu-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5"/></svg></div>
        <div class="edu-body">
          <span class="edu-eyebrow">Schools &amp; non-profits</span>
          <h3>A school or non-profit? <em>You pay less.</em></h3>
          <p>Drama departments, student productions, and non-profit theatre companies get discounted, hand-verified pricing on the Company plan. Tell us about your organization and we'll get you set up.</p>
        </div>
        <a class="btn primary lg" href="/contact?reason=school" style="display:inline-flex;flex-shrink:0">Get special pricing <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>
      </div>
`;

// Static COMPANIES tier cards (fallback when Sanity has no pricing tiers).
const PRICING_COMPANIES_TIERS_HTML = `
      <div class="tiers">
        <div class="tier">
          <div class="tier-name">Season</div>
          <div class="tier-desc">For one show at a time, a single company, in production.</div>
          <div class="tier-price">
            <span class="amt" data-amt-monthly="$25" data-amt-annual="$249">$25</span>
            <span class="per" data-per>/ month</span>
          </div>
          <div class="tier-sub" data-sub-monthly="Billed monthly" data-sub-annual="$25/mo, billed annually">Billed monthly</div>
          <a class="btn" href="/signup">Start 60-day trial</a>
          <div class="tier-cap"><b>1</b> active production &middot; 100&nbsp;GB</div>
          <ul class="tier-list">
            <li>${TICK} The complete toolset</li>
            <li>${TICK} Unlimited cast &amp; crew</li>
            <li>${TICK} Mobile app for the company</li>
          </ul>
        </div>
        <div class="tier" data-feat>
          <span class="tier-flag">Most popular</span>
          <div class="tier-name">Repertory</div>
          <div class="tier-desc">For companies juggling a few productions in parallel.</div>
          <div class="tier-price">
            <span class="amt" data-amt-monthly="$49" data-amt-annual="$499">$49</span>
            <span class="per" data-per>/ month</span>
          </div>
          <div class="tier-sub" data-sub-monthly="Billed monthly" data-sub-annual="$49/mo, billed annually">Billed monthly</div>
          <a class="btn primary" href="/signup">Start 60-day trial</a>
          <div class="tier-cap"><b>3</b> active productions &middot; 250&nbsp;GB</div>
          <ul class="tier-list">
            <li>${TICK} Everything in Season</li>
            <li>${TICK} Run three shows side by side</li>
            <li>${TICK} Email support</li>
          </ul>
        </div>
        <div class="tier">
          <div class="tier-name">Company</div>
          <div class="tier-desc">For theatres and programs running a whole season at once.</div>
          <div class="tier-price">
            <span class="amt" data-amt-monthly="$79" data-amt-annual="$799">$79</span>
            <span class="per" data-per>/ month</span>
          </div>
          <div class="tier-sub" data-sub-monthly="Billed monthly" data-sub-annual="$79/mo, billed annually">Billed monthly</div>
          <a class="btn" href="/signup">Start 60-day trial</a>
          <div class="tier-cap"><b>Unlimited</b> productions &middot; 500&nbsp;GB</div>
          <ul class="tier-list">
            <li>${TICK} Everything in Repertory</li>
            <li>${TICK} Custom branding</li>
            <li>${TICK} Priority support</li>
          </ul>
        </div>
      </div>
`;

// COMPANIES panel pieces, so page.tsx can inject the Sanity-driven <SanityTiers>
// between the lead-in and the rest. These are self-contained HTML fragments
// (no unclosed tags), each rendered into its own dangerouslySetInnerHTML wrapper;
// page.tsx supplies the surrounding <section>/<div class="wrap">.
export const PRICING_COMPANIES_OPEN_HTML = PRICING_COMPANIES_LEAD_HTML;
export const PRICING_COMPANIES_CLOSE_HTML = PRICING_COMPANIES_REST_HTML;

// Full static COMPANIES panel (used when Sanity has no tiers).
export const PRICING_COMPANIES_HTML = `
  <section class="section aud-panel" data-aud-panel="companies" style="padding-top:clamp(20px,3vw,30px)">
    <div class="wrap">
${PRICING_COMPANIES_LEAD_HTML}${PRICING_COMPANIES_TIERS_HTML}${PRICING_COMPANIES_REST_HTML}
    </div>
  </section>
`;

// INDIVIDUALS panel (Proscene Studio). Static; tier CTAs link to the designer
// signup funnel (/signup?account=designer&plan=…).
export const PRICING_INDIVIDUALS_HTML = `
  <section class="section aud-panel" data-aud-panel="designers" style="padding-top:clamp(20px,3vw,30px)">
    <div class="wrap">
      <div class="panel-lead">
        <span class="badge-new"><span class="dot"></span>New</span>
        <span class="eyebrow no-rule">Proscene Studio</span>
        <h2>A private studio that <em>tours with you.</em></h2>
        <p>For the freelance lighting, set, sound, or projection designer or choreographer who hops between companies. Your own script, your own ground plan, your own workspace, billed to you, not a theatre. Monthly works great for gig work, switch the toggle above.</p>
      </div>

      <div class="tiers">
        <div class="tier">
          <div class="tier-name">Single Tool</div>
          <div class="tier-desc">Pick one, Script or Blocking, for the way you work.</div>
          <div class="tier-price">
            <span class="amt" data-amt-monthly="$5.99" data-amt-annual="$59">$5.99</span>
            <span class="per" data-per>/ month</span>
          </div>
          <div class="tier-sub" data-sub-monthly="Billed monthly" data-sub-annual="$5.99/mo, billed annually">Billed monthly</div>
          <a class="btn" href="/signup?account=designer&amp;plan=single_tool">Get started</a>
          <div class="tier-cap"><b>1</b> production &middot; swap &amp; replace</div>
          <ul class="tier-list">
            <li>${TICK} Script <span class="em">or</span> Blocking</li>
            <li>${TICK} Your uploaded script + AI parse</li>
            <li>${TICK} One private ground plan</li>
          </ul>
        </div>
        <div class="tier" data-feat>
          <span class="tier-flag">Best value</span>
          <div class="tier-name">Studio</div>
          <div class="tier-desc">Both tools together, script and blocking, side by side.</div>
          <div class="tier-price">
            <span class="amt" data-amt-monthly="$9.99" data-amt-annual="$99">$9.99</span>
            <span class="per" data-per>/ month</span>
          </div>
          <div class="tier-sub" data-sub-monthly="Billed monthly" data-sub-annual="$9.99/mo, billed annually">Billed monthly</div>
          <a class="btn primary" href="/signup?account=designer&amp;plan=studio">Get started</a>
          <div class="tier-cap"><b>1</b> production &middot; swap &amp; replace</div>
          <ul class="tier-list">
            <li>${TICK} Script <span class="em">+</span> Blocking</li>
            <li>${TICK} Your uploaded script + AI parse</li>
            <li>${TICK} Both views, pinned together</li>
          </ul>
        </div>
        <div class="tier">
          <div class="tier-name">Studio Pro</div>
          <div class="tier-desc">Stop swapping, keep all your shows open at once.</div>
          <div class="tier-price">
            <span class="amt" data-amt-monthly="$14.99" data-amt-annual="$149">$14.99</span>
            <span class="per" data-per>/ month</span>
          </div>
          <div class="tier-sub" data-sub-monthly="Billed monthly" data-sub-annual="$14.99/mo, billed annually">Billed monthly</div>
          <a class="btn" href="/signup?account=designer&amp;plan=studio_pro">Get started</a>
          <div class="tier-cap"><b>Unlimited</b> shows, all at once</div>
          <ul class="tier-list">
            <li>${TICK} Script <span class="em">+</span> Blocking</li>
            <li>${TICK} Your uploaded script + AI parse</li>
            <li>${TICK} Every show running in parallel</li>
          </ul>
        </div>
      </div>

      <div class="d-notes">
        <div class="d-note">
          <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1-6.3-4.6L5.7 21l2.3-7.1-6-4.5h7.6z"/></svg></div>
          <div>
            <b>Solo prep, not a team workspace.</b>
            <p>Studio is just for you, Script and Blocking only. Calls, scheduling, reports, the document center, and sharing live on the company plans. Need those for a team? That's an org plan.</p>
          </div>
        </div>
        <div class="d-note">
          <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
          <div>
            <b>Org invites stay free.</b>
            <p>Invited to a show by a company on a paid plan? You already have their full suite there, free. Studio is only for your own private prep between gigs, the two never collide.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
`;

// Shared tail: pricing FAQ + closing CTA. Same for both renderings.
export const PRICING_REST_HTML = `
  <section class="section" style="background:var(--bg-muted);border-top:1px solid var(--border)">
    <div class="wrap-narrow">
      <div class="section-head center reveal" style="text-align:center;margin:0 auto 36px">
        <span class="eyebrow no-rule">Billing questions</span>
        <h2 class="title" style="margin-top:14px">The fine print, <em>in plain English.</em></h2>
      </div>
      <div class="faq-mini reveal">
        <details class="qa"><summary>Do I pay for everyone in my company?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Never. The organization subscribes; cast, crew, designers, and stage management are always free on every plan. Whether your show has a company of four or forty, the price is the same. Plans differ only by how many productions you can run at once.</p></details>
        <details class="qa"><summary>How does the free trial work?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>New organizations get a 60-day free trial, no card required. The clock doesn't start at signup, it starts when you open your first production, so you can set things up on your own schedule.</p></details>
        <details class="qa"><summary>What's the difference between monthly and annual?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Annual is roughly ten months for the price of twelve, about 20% off. Both give you the identical toolset; annual just costs less per month. You can switch between them at any time.</p></details>
        <details class="qa"><summary>What is Proscene Studio, and is it different from a plan?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Studio is a personal subscription for freelance designers and choreographers, Script and Blocking only, billed to you instead of a theatre. It's for your own private prep between gigs. When a company invites you to their show, you already get their full suite there for free; Studio doesn't change that. Switch to the "For individuals" view above to pick a plan.</p></details>
        <details class="qa"><summary>Do schools or non-profits get a discount?<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary><p>Yes. Schools, drama departments, and non-profit theatre companies get discounted, hand-verified pricing on the Company plan. Reach out and we'll get your organization set up.</p></details>
      </div>
      <p class="center" style="margin-top:34px"><a class="btn-link" href="/faq" style="display:inline-flex">Read the full FAQ <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a></p>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="cta-band center reveal">
        <div class="cta-curtain"></div>
        <div style="position:relative">
          <h2 class="title" style="font-size:clamp(28px,4vw,46px)">Start free. Pay when <em>you load in.</em></h2>
          <p class="lede" style="margin:18px auto 30px;max-width:48ch">Sixty days on us, no card, and the clock only starts at your first production.</p>
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
  PRICING_HERO_HTML +
  `<div id="pricing-panels">` +
  PRICING_COMPANIES_HTML +
  PRICING_INDIVIDUALS_HTML +
  `</div>` +
  PRICING_REST_HTML;
