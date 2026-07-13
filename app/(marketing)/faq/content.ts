// FAQ page body, ported from faq.html.
const PL =
  '<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const qa = (q: string, a: string) =>
  `<details class="qa"><summary>${q}${PL}</summary><p>${a}</p></details>`;

export const FAQ_HTML = `
  <section class="page-hero">
    <div class="wrap">
      <span class="eyebrow no-rule" style="justify-content:center">Help</span>
      <h1 class="display" style="margin-top:16px;font-size:clamp(36px,5.4vw,62px)">Questions, <em>answered.</em></h1>
      <p class="lede" style="margin:18px auto 0;max-width:50ch">Everything stage managers ask before their first show. Can't find it? <a href="/contact" style="color:var(--accent-ink);font-weight:500">Talk to a human →</a></p>
      <div class="faq-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input type="text" id="faqq" placeholder="Search questions…" aria-label="Search FAQ">
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:8px">
    <div class="wrap">
      <div class="faq-layout">
        <aside class="faq-side" aria-label="FAQ categories">
          <a href="#getting-started" class="active">Getting started <span class="n">4</span></a>
          <a href="#company">The company <span class="n">4</span></a>
          <a href="#features">Features <span class="n">4</span></a>
          <a href="#billing">Billing <span class="n">4</span></a>
          <a href="#data">Data &amp; privacy <span class="n">3</span></a>
        </aside>

        <div class="faq-main">
          <p class="no-results" id="noresults">No questions match that search. Try a different word, or <a href="/contact" style="color:var(--accent-ink)">ask us directly</a>.</p>

          <div class="faq-group" id="getting-started">
            <h2>Getting started</h2>
            <p class="gsub">From a blank screen to your first call.</p>
            ${qa(
              "How long does it take to set up a production?",
              "About five minutes. Name the show, add your venues and rehearsal dates, then import or type your cast list. You can start sending calls the same afternoon and fill in the script and reports later."
            )}
            ${qa(
              "Do I need to install anything?",
              "No. Proscene runs in any browser, and the company installs the mobile app from the App Store or Google Play. Nothing to maintain, nothing to update."
            )}
            ${qa(
              "Can I import a cast list from a spreadsheet?",
              "Yes. Paste from a spreadsheet or upload a CSV and Proscene maps the columns: names, roles, email, phone, and emergency contacts. Reuse the same company on your next show."
            )}
            ${qa(
              "What if my actors aren't tech people?",
              "They tap one link to join and see exactly one thing: tonight's call and this week's schedule. There's nothing to learn. Confirming a call is a single button, and reminders arrive by text and push."
            )}
          </div>

          <div class="faq-group" id="company">
            <h2>The company</h2>
            <p class="gsub">Cast, crew, designers, and who sees what.</p>
            ${qa(
              "Can different people see different things?",
              "Yes, access is role-based. Principals see their calls and the script; designers see the reports tagged to their department; crew see the run sheet. The stage management team sees it all."
            )}
            ${qa(
              "Is there a limit on company size?",
              "No limit, and no per-person cost. A four-hander and a forty-strong opera chorus are priced exactly the same."
            )}
            ${qa(
              "Can guest directors or designers join just one show?",
              "Absolutely. Add anyone to a single production with the access they need, and remove them when the show closes. Your workspace keeps a shared company directory across all your shows."
            )}
            ${qa(
              "How do emergency contacts work?",
              "Each person can store an emergency contact that's visible only to stage management. It's right there on the contact sheet when you need it, no scrambling through old emails."
            )}
          </div>

          <div class="faq-group" id="features">
            <h2>Features</h2>
            <p class="gsub">Calls, script, blocking, and reports.</p>
            ${qa(
              "Can I send a call to only part of the company?",
              "Yes. Call by scene, by role, by department, or hand-pick people. Proscene works out who's needed for the scenes you're working and only calls them."
            )}
            ${qa(
              "What file types can I upload for the script?",
              "PDF and Word documents. Proscene detects scenes and characters automatically, and you can adjust the breakdown by hand. Line changes are versioned so the company always has the current pages."
            )}
            ${qa(
              "Does blocking use standard notation?",
              "It supports the shorthand you already use, and expands it into plain language for anyone reading the book later. Moves pin to the exact line, so a cross is never floating in the margin."
            )}
            ${qa(
              "Can I export reports as PDF?",
              "Every report exports to a clean, printable PDF, and can be emailed straight from Proscene to the right departments. Running times and breaks are tracked automatically."
            )}
          </div>

          <div class="faq-group" id="billing">
            <h2>Billing</h2>
            <p class="gsub">Plans, trials, and how we charge.</p>
            ${qa(
              "How does pricing work?",
              "The organization subscribes, never the people in it. Plans differ only by how many productions you can run at once: Season (1), Repertory (3), or Company (unlimited). Every paid plan includes the full toolset, and cast, crew, designers, and stage management are always free, no matter how many you invite."
            )}
            ${qa(
              "Is there a free trial?",
              "Yes, 60 days, no card required. The clock starts when you open your first production, not the day you sign up, so it never runs out before you've begun."
            )}
            ${qa(
              "I'm a freelance designer or choreographer. Do I need a company plan?",
              "No. Proscene Studio is a personal subscription, Script and Blocking only, billed to you instead of a theatre, for your own prep between gigs. And if a company invites you to their show, you already have their full suite there for free. It's coming soon; sign up to be notified on the <a href=\"/pricing\" style=\"color:var(--accent-ink)\">pricing page</a>."
            )}
            ${qa(
              "Is there a discount for schools or non-profits?",
              "Yes, schools, drama departments, university programs, and non-profit theatre companies get discounted, hand-verified pricing on the Company plan. It isn't free, but it's a meaningful break. <a href=\"/contact?reason=school\" style=\"color:var(--accent-ink)\">Reach out</a> with your organization's details and we'll get you set up."
            )}
          </div>

          <div class="faq-group" id="data">
            <h2>Data &amp; privacy</h2>
            <p class="gsub">Your show, your information.</p>
            ${qa(
              "Who owns the data in my productions?",
              "You do. We never sell data or use it to train anything. Export your full production: schedule, reports, contacts, to PDF and CSV whenever you like."
            )}
            ${qa(
              "Is the company's contact info kept private?",
              "Phone numbers and emergency contacts are visible only to stage management and the people you designate. The cast can't browse each other's personal details."
            )}
            ${qa(
              "What happens to a show after it closes?",
              "It becomes a read-only archive you can revisit, export, or reopen for a remount. We never delete a closed production without telling you first."
            )}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CONTACT CTA -->
  <section class="section" style="padding-top:0">
    <div class="wrap-narrow">
      <div class="card card-pad center reveal" style="padding:clamp(32px,4vw,48px)">
        <h3 class="subtitle">Still have a question?</h3>
        <p class="lede" style="margin:12px auto 24px;max-width:46ch">Our team are former stage managers. Ask us anything, we read every message and answer in hours, not days.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <a class="btn primary" href="/contact">Message support</a>
          <a class="btn" href="/contact?reason=demo">Book a walkthrough</a>
        </div>
      </div>
    </div>
  </section>
`;
