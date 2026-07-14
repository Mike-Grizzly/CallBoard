// FAQ page body, ported from faq.html.
//
// M9: the page is built from a single `FAQ_CATEGORIES` data array so the
// sidebar counts are *derived* (`items.length`) instead of hand-typed — they
// can no longer drift from the rendered questions. The Sanity path
// (`sanity-faq.tsx`) already renders the identical `faq-*` layout with derived
// counts, so both CMS states now match.
const PL =
  '<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

export type FaqPair = { q: string; a: string };
export type FaqCategory = {
  /** #anchor id used by the sidebar link and the group section. */
  id: string;
  /** Sidebar + group heading. May contain HTML entities. */
  title: string;
  /** Short group subtitle. */
  subtitle: string;
  items: FaqPair[];
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "getting-started",
    title: "Getting started",
    subtitle: "From a blank screen to your first call.",
    items: [
      {
        q: "How long does it take to set up a production?",
        a: "About five minutes. Name the show, add your venues and rehearsal dates, then import or type your cast list. You can start sending calls the same afternoon and fill in the script and reports later.",
      },
      {
        q: "Do I need to install anything?",
        a: "No. Proscene runs in any browser. On a phone, add it to your home screen (Share → Add to Home Screen) and it launches full-screen like an app — no App Store download, nothing to maintain or update. Dedicated iOS and Android apps are on the roadmap.",
      },
      {
        q: "Can I import a cast list from a spreadsheet?",
        a: "Yes. Paste from a spreadsheet or upload a CSV and Proscene maps the columns: names, roles, email, phone, and emergency contacts. Reuse the same company on your next show.",
      },
      {
        q: "What if my actors aren't tech people?",
        a: "They tap one link to join and see exactly one thing: tonight's call and this week's schedule. There's nothing to learn. Confirming a call is a single button, and push notifications reach them the moment an announcement or an @mention is meant for them.",
      },
    ],
  },
  {
    id: "company",
    title: "The company",
    subtitle: "Cast, crew, designers, and who sees what.",
    items: [
      {
        q: "Can different people see different things?",
        a: "Yes, access is role-based. Principals see their calls and the script; designers see the reports tagged to their department; crew see the run sheet. The stage management team sees it all.",
      },
      {
        q: "Is there a limit on company size?",
        a: "No limit, and no per-person cost. A four-hander and a forty-strong opera chorus are priced exactly the same.",
      },
      {
        q: "Can guest directors or designers join just one show?",
        a: "Absolutely. Add anyone to a single production with the access they need, and remove them when the show closes. Your workspace keeps a shared company directory across all your shows.",
      },
      {
        q: "How do emergency contacts work?",
        a: "Each person can store an emergency contact that's visible only to stage management. It's right there on the contact sheet when you need it, no scrambling through old emails.",
      },
    ],
  },
  {
    id: "features",
    title: "Features",
    subtitle: "Calls, script, blocking, and reports.",
    items: [
      {
        q: "Can I send a call to only part of the company?",
        a: "Yes. Call by scene, by role, by department, or hand-pick people. Proscene works out who's needed for the scenes you're working and only calls them.",
      },
      {
        q: "What file types can I upload for the script?",
        a: "PDF and Word documents. Proscene detects scenes and characters automatically, and you can adjust the breakdown by hand. Line changes are versioned so the company always has the current pages.",
      },
      {
        q: "Does blocking use standard notation?",
        a: "It supports the shorthand you already use, and expands it into plain language for anyone reading the book later. Moves pin to the exact line, so a cross is never floating in the margin.",
      },
      {
        q: "How do rehearsal reports get out?",
        a: "Proscene formats the report and distributes it by email straight to the right departments — pick the recipients and send. Running times and breaks are tracked automatically. (A dedicated PDF export for reports is on the roadmap; the script and blocking tools already export to PDF today.)",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing",
    subtitle: "Plans, trials, and how we charge.",
    items: [
      {
        q: "How does pricing work?",
        a: "The organization subscribes, never the people in it. Plans differ only by how many productions you can run at once: Season (1), Repertory (3), or Company (unlimited). Every paid plan includes the full toolset, and cast, crew, designers, and stage management are always free, no matter how many you invite.",
      },
      {
        q: "Is there a free trial?",
        a: "Yes, 60 days, no card required. The clock starts when you open your first production, not the day you sign up, so it never runs out before you've begun.",
      },
      {
        q: "I'm a freelance designer or choreographer. Do I need a company plan?",
        a: 'No. Proscene Studio is a personal subscription, Script and Blocking only, billed to you instead of a theatre, for your own prep between gigs. And if a company invites you to their show, you already have their full suite there for free. It\'s coming soon; sign up to be notified on the <a href="/pricing" style="color:var(--accent-ink)">pricing page</a>.',
      },
      {
        q: "Is there a discount for schools or non-profits?",
        a: 'Yes, schools, drama departments, university programs, and non-profit theatre companies get discounted, hand-verified pricing on the Company plan. It isn\'t free, but it\'s a meaningful break. <a href="/contact?reason=school" style="color:var(--accent-ink)">Reach out</a> with your organization\'s details and we\'ll get you set up.',
      },
    ],
  },
  {
    id: "data",
    title: "Data &amp; privacy",
    subtitle: "Your show, your information.",
    items: [
      {
        q: "Who owns the data in my productions?",
        a: "You do. We never sell your data or use it to train anything, and a closed show stays yours to revisit, export, or reopen for a remount.",
      },
      {
        q: "Is the company's contact info kept private?",
        a: "Phone numbers and emergency contacts are visible only to stage management and the people you designate. The cast can't browse each other's personal details.",
      },
      {
        q: "What happens to a show after it closes?",
        a: "It becomes a read-only archive you can revisit, export, or reopen for a remount. We never delete a closed production without telling you first.",
      },
    ],
  },
];

const qa = ({ q, a }: FaqPair) =>
  `<details class="qa"><summary>${q}${PL}</summary><p>${a}</p></details>`;

const sidebarLinks = FAQ_CATEGORIES.map(
  (c, i) =>
    `<a href="#${c.id}"${i === 0 ? ' class="active"' : ""}>${c.title} <span class="n">${c.items.length}</span></a>`,
).join("\n          ");

const groups = FAQ_CATEGORIES.map(
  (c) => `
          <div class="faq-group" id="${c.id}">
            <h2>${c.title}</h2>
            <p class="gsub">${c.subtitle}</p>
            ${c.items.map(qa).join("\n            ")}
          </div>`,
).join("\n");

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
          ${sidebarLinks}
        </aside>

        <div class="faq-main">
          <p class="no-results" id="noresults">No questions match that search. Try a different word, or <a href="/contact" style="color:var(--accent-ink)">ask us directly</a>.</p>
${groups}
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
