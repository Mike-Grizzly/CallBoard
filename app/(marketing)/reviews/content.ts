// Reviews page body — ported from reviews.html (links rewired to Next routes).
const STAR =
  '<svg viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>';
const STARS5 = `<div class="stars">${STAR.repeat(5)}</div>`;

export const REVIEWS_HTML = `
  <section class="page-hero">
    <div class="wrap">
      <span class="eyebrow no-rule" style="justify-content:center">Loved by stage managers</span>
      <h1 class="display" style="margin-top:16px;font-size:clamp(36px,5.4vw,62px)">From the people<br>holding the <em>book.</em></h1>
      <div class="hero-rating">
        <span class="stars">${STAR.repeat(5)}</span>
        <b>4.9 / 5</b>
        <span>from 600+ productions</span>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:8px">
    <div class="wrap">
      <div class="masonry reveal">
        <div class="rev feat">
          ${STARS5}
          <p>"I sent one call and <em>22 confirmations came back</em> before I'd left the building. ProScene gave me back the hour I used to spend chasing replies every single night."</p>
          <div class="who"><span class="av" style="background:linear-gradient(135deg,var(--c-clay),var(--accent))">MO</span><div><b>Maya Okafor</b><span>PSM · Wellman Theatre</span></div></div>
        </div>

        <div class="rev">
          ${STARS5}
          <p>The reports write themselves now. I tag a note to lighting mid-run and it's in their inbox before we strike the table. My ASMs think I'm a wizard.</p>
          <div class="who"><span class="av" style="background:#4f7fb8">DC</span><div><b>Devon Cole</b><span>SM · Riverside Opera</span></div></div>
        </div>

        <div class="rev">
          ${STARS5}
          <p>Our cast is 38 high-schoolers. <em>Not one missed call</em> all run. Parents could see the schedule too. This is the first year I didn't lose my voice to reminders.</p>
          <div class="who"><span class="av" style="background:#6bbf7a">RP</span><div><b>Rachel Pruitt</b><span>Theatre Director · Hart House School</span></div></div>
        </div>

        <div class="rev">
          ${STARS5}
          <p>The blocking pinned to the script is the feature I didn't know I needed. When the director changed a cross at 10pm it was just… in the book. Legibly.</p>
          <div class="who"><span class="av" style="background:#7d6fb0">JL</span><div><b>Jordan Liu</b><span>ASM · Northtown Rep</span></div></div>
        </div>

        <div class="rev">
          ${STARS5}
          <p>We run five productions a season on Resident. Having one company directory and SSO across all of them saved our production office an actual headache.</p>
          <div class="who"><span class="av" style="background:#c0563f">SB</span><div><b>Simone Boyd</b><span>Production Manager · The Gaslight</span></div></div>
        </div>

        <div class="rev">
          ${STARS5}
          <p>I'm not a "tech person" and I had calls going out in fifteen minutes. The fact that it looks like a theatre tool and not a spreadsheet matters more than I expected.</p>
          <div class="who"><span class="av" style="background:#caa24a">FN</span><div><b>Frank Nwosu</b><span>SM · Community Players</span></div></div>
        </div>

        <div class="rev">
          ${STARS5}
          <p>The conflict detection caught a double-booking I would absolutely have missed during tech. <em>Saved me a very awkward phone call.</em></p>
          <div class="who"><span class="av" style="background:#4f7fb8">AK</span><div><b>Aisha Khan</b><span>PSM · Lyric Stage</span></div></div>
        </div>

        <div class="rev">
          ${STARS5}
          <p>Touring with the show meant a different theatre every week. ProScene kept the whole company oriented — venues, call times, everything — in one place.</p>
          <div class="who"><span class="av" style="background:#6bbf7a">TG</span><div><b>Teo Garza</b><span>Touring SM · Roadshow Co.</span></div></div>
        </div>

        <div class="rev">
          ${STARS5}
          <p>Honestly the thing I love most is the daily report landing in my designers' inboxes automatically. No more "did you get my notes?" the next morning.</p>
          <div class="who"><span class="av" style="background:#7d6fb0">EV</span><div><b>Elena Vargas</b><span>SM · Meridian Dance</span></div></div>
        </div>
      </div>
    </div>
  </section>

  <!-- LOGO STRIP -->
  <section class="section-tight" style="background:var(--bg-muted);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
    <div class="wrap center">
      <p class="trust-label" style="margin-bottom:24px">Productions run on ProScene at</p>
      <div class="logos-strip reveal">
        <span class="trust-logo">Wellman Theatre</span>
        <span class="trust-logo">Riverside Opera</span>
        <span class="trust-logo">Hart House</span>
        <span class="trust-logo">The Gaslight</span>
        <span class="trust-logo">Northtown Rep</span>
        <span class="trust-logo">Lyric Stage</span>
        <span class="trust-logo">Meridian Dance</span>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="section">
    <div class="wrap">
      <div class="cta-band center reveal">
        <div class="cta-curtain"></div>
        <div style="position:relative">
          <h2 class="title" style="font-size:clamp(28px,4vw,46px)">Join the companies who <em>stopped chasing replies.</em></h2>
          <p class="lede" style="margin:18px auto 30px;max-width:48ch">Start free on your next show and see why stage managers don't go back.</p>
          <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
            <a class="btn primary lg" href="#" data-noop>Start free</a>
            <a class="btn ghost lg" href="/features">Tour the features</a>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
