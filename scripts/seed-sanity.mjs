// One-time seed of the marketing CMS with the current copy.
// Run: SANITY_WRITE_TOKEN='<editor token>' node scripts/seed-sanity.mjs
// Uses createOrReplace with stable _ids so it's safe to re-run.
import { createClient } from "@sanity/client";

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error("Set SANITY_WRITE_TOKEN (an Editor token) and re-run.");
  process.exit(1);
}

const client = createClient({
  projectId: "dsciikio",
  dataset: "production",
  apiVersion: "2024-12-01",
  token,
  useCdn: false,
});

const f = (key, text, included = true) => ({ _key: key, text, included });

const homePage = {
  _id: "homePage",
  _type: "homePage",
  heroEyebrow: "Built by stage managers",
  heroHeadline: "The paper call board, *reinvented.*",
  heroSubhead:
    "Proscene keeps your whole production on the same page — calls, calendars, scripts, blocking, and reports. One hub for the stage manager, the cast, and the crew.",
  primaryCtaLabel: "Start free",
  primaryCtaHref: "/signup",
  secondaryCtaLabel: "Book a demo",
  secondaryCtaHref: "/contact?reason=demo",
  heroNote: "Free for your first production · No card required",
};

const pricing = [
  {
    _id: "pricingTier.understudy",
    _type: "pricingTier",
    name: "Understudy",
    description: "For your first show, or a small one-off production.",
    priceProduction: "Free",
    noteProduction: "Forever, one active show",
    ctaLabel: "Start free",
    ctaHref: "/signup",
    featured: false,
    order: 1,
    features: [
      f("a", "1 active production"),
      f("b", "Unlimited people on the show"),
      f("c", "Calls, calendar & people"),
      f("d", "Mobile app for the company"),
      f("e", "Script, blocking & reports", false),
    ],
  },
  {
    _id: "pricingTier.company",
    _type: "pricingTier",
    name: "Company",
    description: "Everything a production needs, from read-through to strike.",
    priceProduction: "$29",
    priceAnnual: "$23",
    period: "/ production",
    noteProduction: "One-time, per show",
    noteAnnual: "Billed annually, per show",
    flag: "Most popular",
    featured: true,
    ctaLabel: "Start free trial",
    ctaHref: "/signup",
    order: 2,
    features: [
      f("a", "Unlimited productions"),
      f("b", "Script, blocking & ground plans"),
      f("c", "Auto rehearsal & performance reports"),
      f("d", "Document & video library, 50 GB"),
      f("e", "PDF export & calendar sync"),
    ],
  },
  {
    _id: "pricingTier.resident",
    _type: "pricingTier",
    name: "Resident",
    description: "For theatres and programs running a full season.",
    priceProduction: "Custom",
    noteProduction: "Talk to us about your season",
    ctaLabel: "Book a demo",
    ctaHref: "/contact?reason=demo",
    featured: false,
    order: 3,
    features: [
      f("a", "Everything in Company"),
      f("b", "Season & venue management"),
      f("c", "SSO & shared company directory"),
      f("d", "Unlimited storage"),
      f("e", "Priority support & onboarding"),
    ],
  },
];

const faqData = [
  ["Getting started", [
    ["How long does it take to set up a production?", "About five minutes. Name the show, add your venues and rehearsal dates, then import or type your cast list. You can start sending calls the same afternoon and fill in the script and reports later."],
    ["Do I need to install anything?", "No. Proscene runs in any browser, and the company installs the mobile app from the App Store or Google Play. Nothing to maintain, nothing to update."],
    ["Can I import a cast list from a spreadsheet?", "Yes. Paste from a spreadsheet or upload a CSV and Proscene maps the columns — names, roles, email, phone, and emergency contacts. Reuse the same company on your next show."],
    ["What if my actors aren't tech people?", "They tap one link to join and see exactly one thing: tonight's call and this week's schedule. There's nothing to learn. Confirming a call is a single button, and reminders arrive by text and push."],
  ]],
  ["The company", [
    ["Can different people see different things?", "Yes — access is role-based. Principals see their calls and the script; designers see the reports tagged to their department; crew see the run sheet. The stage management team sees it all."],
    ["Is there a limit on company size?", "No limit, and no per-person cost. A four-hander and a forty-strong opera chorus are priced exactly the same."],
    ["Can guest directors or designers join just one show?", "Absolutely. Add anyone to a single production with the access they need, and remove them when the show closes. Resident plans keep a shared company directory across all your shows."],
    ["How do emergency contacts work?", "Each person can store an emergency contact that's visible only to stage management. It's right there on the contact sheet when you need it — no scrambling through old emails."],
  ]],
  ["Features", [
    ["Can I send a call to only part of the company?", "Yes. Call by scene, by role, by department, or hand-pick people. Proscene works out who's needed for the scenes you're working and only calls them."],
    ["What file types can I upload for the script?", "PDF and Word documents. Proscene detects scenes and characters automatically, and you can adjust the breakdown by hand. Line changes are versioned so the company always has the current pages."],
    ["Does blocking use standard notation?", "It supports the shorthand you already use — and expands it into plain language for anyone reading the book later. Moves pin to the exact line, so a cross is never floating in the margin."],
    ["Can I export reports as PDF?", "Every report exports to a clean, printable PDF, and can be emailed straight from Proscene to the right departments. Running times and breaks are tracked automatically."],
  ]],
  ["Billing", [
    ["How does per-production pricing work?", "You pay once per show on the Company plan — never per person. Run one show a year or ten; you only pay for the productions you actually open."],
    ["Is there a free trial?", "Yes — 14 days of the full Company plan on your first production, no card required. After that, stay free on Understudy or upgrade for script, blocking, and reports."],
    ["Do students really get it free?", "Verified students and educators get the Company plan free for school productions. Verify with a .edu email or a note from your department."],
  ]],
  ["Data & privacy", [
    ["Who owns the data in my productions?", "You do. We never sell data or use it to train anything. Export your full production — schedule, reports, contacts — to PDF and CSV whenever you like."],
    ["Is the company's contact info kept private?", "Phone numbers and emergency contacts are visible only to stage management and the people you designate. The cast can't browse each other's personal details."],
    ["What happens to a show after it closes?", "It becomes a read-only archive you can revisit, export, or reopen for a remount. We never delete a closed production without telling you first."],
  ]],
];

const faqDocs = [];
let n = 0;
for (const [category, items] of faqData) {
  let order = 0;
  for (const [question, answer] of items) {
    faqDocs.push({
      _id: `faqItem.${++n}`,
      _type: "faqItem",
      question,
      answer,
      category,
      order: order++,
    });
  }
}

const all = [homePage, ...pricing, ...faqDocs];

const run = async () => {
  let tx = client.transaction();
  for (const doc of all) tx = tx.createOrReplace(doc);
  await tx.commit();
  console.log(`Seeded ${all.length} documents: 1 homePage, ${pricing.length} pricingTier, ${faqDocs.length} faqItem.`);
};

run().catch((err) => {
  console.error("Seed failed:", err.message || err);
  process.exit(1);
});
