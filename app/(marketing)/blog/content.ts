// Blog index page body, ported from blog.html. All post links point at the
// single available post for now (/blog/setup-your-first-production).
const POST = "/blog/setup-your-first-production";

export const BLOG_HTML = `
  <section class="page-hero">
    <div class="wrap">
      <span class="eyebrow">The Proscene blog</span>
      <h1 class="display" style="margin-top:18px;font-size:clamp(34px,5vw,58px)">Notes from the <em>prompt desk.</em></h1>
      <p class="lede lede-narrow" style="margin-top:18px">Walkthroughs, stage-management craft, and the occasional opinion about call times, written by people who've held the book.</p>
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
          <h2>Set up your first production in Proscene, a 10-minute walkthrough</h2>
          <p>From a blank screen to your first call going out. We build a real show step by step: venues, cast list, the rehearsal calendar, and sending a call the whole company confirms.</p>
          <span class="btn-link" style="display:inline-flex">Read the walkthrough <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></span>
          <div class="by" style="margin-top:14px">The Proscene team · May 28, 2026</div>
        </div>
      </a>
    </div>
  </section>

  <!-- NEWSLETTER -->
  <section class="section" style="padding-top:0">
    <div class="wrap-narrow">
      <div class="card card-pad center reveal" style="padding:clamp(32px,4vw,48px)">
        <span class="eyebrow no-rule" style="justify-content:center;margin-bottom:14px">The half-hour call</span>
        <h3 class="subtitle">A short letter for stage managers, twice a month.</h3>
        <p class="lede" style="margin:12px auto 24px;max-width:46ch">Craft, product updates, and the occasional war story. No spam, unsubscribe in a tap.</p>
        <form style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;max-width:440px;margin:0 auto" data-noop-form>
          <input type="email" placeholder="you@theatre.com" aria-label="Email" style="flex:1;min-width:220px;height:50px;border:1px solid var(--border-strong);border-radius:var(--radius);padding:0 16px;font-size:15px;font-family:inherit;background:var(--bg-elev)">
          <button class="btn primary" style="height:50px" type="submit">Subscribe</button>
        </form>
      </div>
    </div>
  </section>
`;
