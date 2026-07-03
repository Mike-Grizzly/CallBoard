import type { DocSection } from "./types";

export const troubleshooting: DocSection = {
  slug: "troubleshooting",
  title: "Troubleshooting",
  blurb:
    "Symptom-by-symptom fixes for sign-in and access, notifications, and script upload problems.",
  description:
    "Fixes for common Proscene problems: invite links, sign-in, missing productions, notifications that never arrive, and script uploads.",
  overview: [
    {
      heading: "How to use this section",
      body: `<p>Each page here is organized by symptom, not by feature. Find the question closest to what you are seeing, and the answer walks through what usually causes it and the fastest way out. Most of these problems are self-service: expired invite links, missing notifications, and stalled script analyses can all be recovered without waiting on anyone.</p><p>If the problem is really a "how do I" question, the how-to guides in the rest of the <a href="/help">help manual</a> are a better starting point, and the <a href="/faq">FAQ</a> covers product and pricing questions.</p>`,
    },
    {
      heading: "Still stuck?",
      body: `<p>If none of these pages match what you are seeing, <a href="/contact">get in touch</a>. The fastest reports include four things: what you clicked, what you expected, what actually happened (copy any error message word for word), and what device and browser you were using. If the problem involves an invite or a sign-in, include the email address the account uses.</p>`,
    },
  ],
  featureHref: "/faq",
  featureLinkLabel: "Read the FAQ",
  pages: [
    {
      slug: "invites-and-access",
      title: "Invite and sign-in problems",
      description:
        "Fix expired invite links, the account already exists message, missing productions, hidden draft reports, and wrong roles in Proscene.",
      kind: "troubleshooting",
      intro: `<p>Fixes for the moments between "I was invited" and "I can see my show": dead invite links, sign-in dead ends, and things you expected to see but cannot. Almost all of these are recoverable in a couple of clicks.</p>`,
      faqs: [
        {
          question: "My invite link expired or says it was already used",
          answer: `<p>Invite emails carry a one-time link, and it lapses after a while. If you click a dead one, Proscene sends you to a <strong>Get a new link</strong> screen that says "That link has expired or was already used." rather than a login error.</p><p>The fix is self-service. On that screen (it is the same form as <strong>Forgot your password</strong>, linked from the sign-in page), enter the email address your invite was sent to and request a fresh link. That flow doubles as first-time password setup for invited accounts, so you do not need anyone to re-invite you: click the new link, set a password, and you are in. If nothing arrives after a few minutes, check your spam folder, then ask whoever invited you to resend the invite from the People directory.</p>`,
        },
        {
          question: "I signed up but it says my account already exists",
          answer: `<p>This almost always means someone at your company already invited you. Inviting creates your account, so trying to sign up with the same email hits the existing one.</p><p>Do not create a second account. The signup form points you to the two ways in: if your invite email is still in your inbox, use its link to set your password. If the invite is old or gone, use the <strong>Set / reset password</strong> link (the Forgot password form): it sends a fresh link that also works as first-time password setup for invited accounts. If you already set a password at some point, or you originally joined with Google, just sign in that way instead.</p>`,
        },
        {
          question: "I can't see a production I should be on",
          answer: `<p>Membership in Proscene has two layers, and this symptom is nearly always the gap between them. Being invited to the company puts you in the workspace, but each production has its own member list. Admins and producers can see every show in the workspace; everyone else sees only the productions they have been added to.</p><p>The fix is to ask an admin or producer to add you to the show itself. They can do it from that production's <a href="/help/productions/cast-crew-board">Cast &amp; Crew board</a>: casting you in a character, dropping you into a team bucket, or adding you to the production team all grant access. If you belong to more than one company on Proscene, also check that you are looking at the right workspace before assuming you are missing.</p>`,
        },
        {
          question: "Why can't I see a rehearsal report",
          answer: `<p>Draft rehearsal reports are intentionally hidden from most of the company. Drafts routinely hold attendance notes, line notes, and incident details that the stage manager has not finished or chosen to share yet, so only report managers (admins, producers, directors, choreographers, creative team, and stage managers) can see a report before it is distributed. Cast and crew see a report once it has been sent out.</p><p>If you are cast or crew and a report you expect is missing, it most likely has not been distributed yet: ask your stage manager. If you are on the management side and cannot see drafts, your role does not include report writing; ask an admin to check it. See <a href="/help/reports/distributing-reports">Distributing reports</a> for how sending works.</p>`,
        },
        {
          question: "I have the wrong role",
          answer: `<p>Your role controls what you can do, from writing reports to editing blocking, and it is set by whoever invited you, so a mis-click at invite time follows you around. You cannot change your own role; Proscene refuses with "You cannot change your own role." even for admins, so someone else has to fix it.</p><p>There are two roles to check. Your <strong>workspace role</strong> is what an admin sees in the company member list under Settings; ask an admin to update it there. Your <strong>per-production role</strong> is set on each show's <a href="/help/productions/cast-crew-board">Cast &amp; Crew board</a>; an admin or producer can move you to the right bucket. One guard to know about: the last remaining admin of a workspace cannot be demoted or removed until another admin is promoted first. The full role list is in <a href="/help/people/roles-and-permissions">Roles and permissions</a>.</p>`,
        },
      ],
      tip: `<p>A failed sign-in also offers a way out: the login form includes a <strong>set / reset password</strong> link for anyone who was invited or never set a password. When in doubt, that reset flow is the universal recovery path into an account.</p>`,
      nextSteps: [
        {
          label: "Invite your company",
          href: "/help/get-started/invite-your-company",
        },
        {
          label: "Roles and permissions",
          href: "/help/people/roles-and-permissions",
        },
        {
          label: "The Cast & Crew board",
          href: "/help/productions/cast-crew-board",
        },
      ],
      related: [
        {
          label: "People directory",
          href: "/help/people/people-directory",
        },
        {
          label: "Distributing reports",
          href: "/help/reports/distributing-reports",
        },
        {
          label: "Notification problems",
          href: "/help/troubleshooting/notifications",
        },
        { label: "FAQ", href: "/faq" },
      ],
    },
    {
      slug: "notifications",
      title: "Notification problems",
      description:
        "Turn on push notifications, fix missing email alerts, and learn which Proscene events notify you in-app, by email, and by push.",
      kind: "troubleshooting",
      intro: `<p>When an announcement goes out and your phone stays silent, the cause is usually one of three things: push was never enabled on that device, an email preference or spam filter, or an event that simply does not send alerts. Here is how to tell which one you have.</p>`,
      faqs: [
        {
          question: "How do I turn on push notifications",
          answer: `<p>Push is off until you enable it, and it is enabled per device, so a quiet phone usually just means that phone was never subscribed.</p><p>Open <strong>Settings</strong>, then <strong>Notifications</strong>. The <strong>Push notifications</strong> card (labelled "This device") has an <strong>Enable on this device</strong> button. Click it, and your browser asks permission to show notifications; allow it, and the card flips to "Push is on for this device." Repeat this on each phone or computer you want alerted; enabling push on your laptop does nothing for your phone. The same screen is offered once in the welcome prompt on your first visit, so if you skipped that, Settings is where to catch up.</p>`,
        },
        {
          question: "Push won't enable on my phone",
          answer: `<p>Two causes cover almost every case of a push toggle that will not switch on.</p><p>On <strong>iPhone</strong>, web push only works from an installed app, not a browser tab. The settings card tells you so: "This browser doesn't support push notifications. On iPhone, add Proscene to your Home Screen first, then open it from there." In Safari, use Share, then <strong>Add to Home Screen</strong>, open Proscene from the new icon, and enable push from there.</p><p>If you previously <strong>declined the permission prompt</strong>, the card reports that notifications are blocked for Proscene in your device settings. Proscene cannot re-ask on its own: allow notifications for Proscene in your browser or device settings, reload the page, and press Enable again.</p>`,
        },
        {
          question: "I'm not getting email notifications",
          answer: `<p>Start with your spam or promotions folder; invite and notification emails are exactly the kind of automated mail that lands there.</p><p>Next, check your preference. In <strong>Settings</strong>, then <strong>Notifications</strong>, email is the one channel you can switch off (in-app alerts are always on), and it applies to things like announcements and being added to a company. It is on by default, including for brand-new accounts that never touched the settings, but it is worth confirming nobody turned it off.</p><p>Finally, know which emails are selective: rehearsal reports are emailed only to the recipients the report manager picks when distributing, so a missing report email may simply mean you were not on that send list. Ask your stage manager to include you next time.</p>`,
        },
        {
          question: "Which events send notifications",
          answer: `<p>Not everything in Proscene notifies, so it helps to know what to expect.</p><ul><li><strong>Announcements</strong> notify their audience in-app, by email, and by push, according to each person's preferences.</li><li><strong>@Mentions</strong> in rehearsal reports, notes, announcements, blocking comments, and document comments appear in the Mentions list on your dashboard and send a push if you have it enabled. Several mentions in one save are batched into a single alert.</li><li><strong>Being added to a company</strong> notifies you in-app and by email if you already had a Proscene account; brand-new invitees get the invite email instead.</li><li><strong>AI script analysis</strong> notifies the person who requested it, in-app and by push, when results are ready.</li><li><strong>Rehearsal reports</strong> arrive as email, sent deliberately by a report manager to chosen recipients; they do not push.</li></ul><p>Scheduled calls do not send alerts when they are created or changed, so make checking your <a href="/help/scheduling/personal-calendar">personal calendar</a> a habit and confirm calls through <a href="/help/scheduling/rsvp-and-confirmations">RSVP</a>.</p>`,
        },
      ],
      tip: `<p>In-app notifications are always on and cannot be disabled, so the bell in the app is the one channel that never misses. If push and email both fail you mid-tech, the notification list in the app still has everything.</p>`,
      nextSteps: [
        {
          label: "Your personal calendar",
          href: "/help/scheduling/personal-calendar",
        },
        {
          label: "RSVP and confirmations",
          href: "/help/scheduling/rsvp-and-confirmations",
        },
        {
          label: "Distributing reports",
          href: "/help/reports/distributing-reports",
        },
      ],
      related: [
        {
          label: "Proscene on mobile",
          href: "/features#mobile",
        },
        {
          label: "Creating calls",
          href: "/help/scheduling/creating-calls",
        },
        {
          label: "Invite and sign-in problems",
          href: "/help/troubleshooting/invites-and-access",
        },
        { label: "Contact support", href: "/contact" },
      ],
    },
    {
      slug: "script-upload-issues",
      title: "Script upload and AI analysis problems",
      description:
        "Fix script upload and AI analysis problems in Proscene: file requirements, scanned PDFs and OCR, odd parse results, and stuck analyses.",
      kind: "troubleshooting",
      intro: `<p>Scripts arrive in every condition, from clean publisher PDFs to third-generation photocopies, and Proscene handles most of them. When an upload or an AI read goes sideways, the cause is usually the file itself, and there is a path through for each case.</p>`,
      faqs: [
        {
          question: "My script won't upload",
          answer: `<p>Two requirements catch most failed uploads. First, AI script analysis works on <strong>PDF files only</strong>; trying to analyze anything else is refused with "AI analysis supports PDF scripts only.", and the wizard's script step asks for a PDF up front. If your script lives in Word or as photos, export or print it to PDF first. Second, uploads are capped at <strong>64MB</strong> ("File must be under 64MB."). Text PDFs almost never hit that, but heavy scans do; re-scanning at a lower resolution, compressing the PDF, or splitting it into acts gets you under.</p><p>Proscene also verifies that a file really is what its extension claims, so a file merely renamed to .pdf is rejected. If a valid, small PDF still will not go through, try again on a steadier connection.</p>`,
        },
        {
          question: "My script is a scan and I can't select or search text",
          answer: `<p>Scanned and photocopied scripts have no text layer, which is why select, copy, and find do nothing on them. Proscene has two separate answers, depending on what you need.</p><p>For <strong>AI analysis</strong>, you do not need to do anything: when a script has no extractable text, the analysis automatically reads the pages visually instead. It takes longer than a text PDF, page bookmarks on scans are best-effort estimates worth reviewing, and very long scans are capped at 250 pages (split those into acts).</p><p>For <strong>reading tools</strong> (select, copy, search, line highlighting), the script viewer detects the scan and offers managers a <strong>Run OCR</strong> banner. OCR runs in your browser, works through the script page by page, and can take several minutes for a full script; you can cancel and resume later. Once it finishes, the result is stored with the file, so the whole production benefits and nobody runs it twice.</p>`,
        },
        {
          question: "The AI analysis failed or the results look odd",
          answer: `<p>First, nothing the AI produces touches your production automatically: every analysis lands on a review page where you can rename characters, fix scene rows, and delete anything wrong before applying. Odd results are edited, not endured.</p><p>If the read is too far off to fix by hand, use the <strong>Not quite right?</strong> box on the review page: describe what it got wrong and re-analyze. The new pass uses your notes and the previous result to make a targeted correction. Analyses are capped at 5 per production every 30 days, so re-run deliberately rather than repeatedly.</p><p>If you would rather skip AI entirely, you can. Discard the analysis and set up cast and scenes by hand, and in the new-production wizard, switch off the <strong>Auto-fill cast from this script</strong> toggle: your PDF still uploads as the production's script, with no analysis, and you can run the AI read later from the Script tab if you change your mind. Results are best on cleanly formatted text PDFs; heavily stylized or irregular layouts are where manual setup wins.</p>`,
        },
        {
          question: "My script analysis seems stuck",
          answer: `<p>A normal analysis takes from about thirty seconds to a few minutes; long scripts and scans sit at the top of that range. The review page checks for results every few seconds, so leave it open and let it work.</p><p>If the run dies behind the scenes, it does not spin forever: an analysis still processing after about eight minutes is automatically marked failed ("The analysis timed out."), at which point you can simply run it again. If instead you see a message that an analysis is already running for this production, someone (possibly you, in another tab) has one in flight; wait for it to finish or time out before starting another.</p><p>If the <strong>upload itself</strong> stalls rather than the analysis, check the basics: the file is under 64MB, your connection is stable, and the page was not closed mid-upload. Re-selecting the file and retrying is safe.</p>`,
        },
      ],
      tip: `<p>Licensed scripts are often the identical PDF for every company. If another production already applied a verified breakdown of the same file, Proscene reuses it instantly, so your analysis can come back in seconds with no AI run at all. That is a feature, not a glitch.</p>`,
      nextSteps: [
        {
          label: "Uploading a script",
          href: "/help/script/uploading-a-script",
        },
        {
          label: "AI script analysis",
          href: "/help/script/ai-script-analysis",
        },
        {
          label: "The production setup wizard",
          href: "/help/productions/setup-wizard",
        },
      ],
      related: [
        {
          label: "Annotations and highlights",
          href: "/help/script/annotations-and-highlights",
        },
        {
          label: "Cue markers",
          href: "/help/script/cue-markers",
        },
        {
          label: "The script tool",
          href: "/features#script",
        },
        { label: "Contact support", href: "/contact" },
      ],
    },
  ],
};
