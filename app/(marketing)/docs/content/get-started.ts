import type { DocSection } from "./types";

export const getStarted: DocSection = {
  slug: "get-started",
  title: "Get started",
  blurb:
    "Create a workspace, build your first production, and get your whole company in the room.",
  description:
    "Set up Proscene for your theatre company: create a workspace, build your first production, invite your company, and run your first rehearsal.",
  featureHref: "/features",
  featureLinkLabel: "Tour the features",
  overview: [
    {
      heading: "What Proscene is",
      body: `<p>Proscene is a production portal for theatre companies. It puts the things a company usually scatters across email threads, spreadsheets, and group chats in one place: the rehearsal schedule, rehearsal reports, scripts, blocking, documents, announcements, and your people directory. It is built the way stage managers actually work, so the paperwork you already do (calls, reports, department notes) becomes the thing everyone else sees, on any device.</p>
<p>This section walks a brand-new company from a blank account to a first rehearsal with a distributed report. Each page stands alone, but they read best in order.</p>`,
    },
    {
      heading: "The shape of the app",
      body: `<p>Proscene has three layers, and once you see them everything else makes sense:</p>
<ul>
<li><strong>Your workspace</strong> is your organization, usually one theatre company or school. It owns your people, your settings, and every show you produce. Workspace-level pages live in the sidebar: Dashboard, Productions, People, and Calendar.</li>
<li><strong>Productions</strong> live inside the workspace. Each show has its own team, cast list, schedule, and paperwork. People can be on some productions and not others.</li>
<li><strong>Production tabs</strong> are where the day-to-day work happens. Open a show and you get Overview, Rehearsal Reports, My Notes, Rehearsal Schedule, Documents, Announcements, Rehearsal Video, Blocking, Your Script, and (for managers) Settings.</li>
</ul>
<p>So: one workspace, many shows, and inside each show a set of tabs your company already understands.</p>`,
    },
    {
      heading: "Who sees what: roles at a glance",
      body: `<p>Everyone you add gets one of eight roles, and the role decides what they can do everywhere in the workspace:</p>
<table>
<thead><tr><th>Role</th><th>At a glance</th></tr></thead>
<tbody>
<tr><td><strong>Admin</strong></td><td>Runs the workspace: invites and manages people, changes settings, and can do everything below.</td></tr>
<tr><td><strong>Producer</strong></td><td>Creates and manages productions and their teams, plus everything an editor role can do.</td></tr>
<tr><td><strong>Director, Choreographer, Creative, Stage Manager</strong></td><td>The editor roles: schedule calls, write rehearsal reports, upload documents, and edit blocking on their shows.</td></tr>
<tr><td><strong>Cast, Crew</strong></td><td>See the schedule and confirm calls, read distributed reports and announcements, view documents and blocking, and keep their own notes.</td></tr>
</tbody>
</table>
<p>One rule worth knowing on day one: a rehearsal report stays private to the report-writing roles while it is a draft. Cast and crew only see it once you distribute it. The full breakdown is in <a href="/docs/people/roles-and-permissions">Roles and permissions</a>.</p>`,
    },
  ],
  pages: [
    {
      slug: "create-your-workspace",
      title: "Create your Proscene workspace",
      description:
        "How to create your Proscene workspace: sign up with email and password or Google, name your company, and finish the first-time setup screen.",
      kind: "how-to",
      intro: `<p>This page is for the first person from a company to sign up, usually the stage manager or producer who will run the workspace. It covers creating the account, naming the workspace, and the one-time setup screen.</p>`,
      steps: [
        {
          title: "Choose how you will use Proscene",
          body: `<p>Go to <a href="/signup">the signup page</a> and pick one of the two options at the top: <strong>I run productions</strong> or <strong>I'm a participant</strong>. If you are setting up your company, choose <strong>I run productions</strong>; a <strong>Workspace name</strong> field appears. Participants (actors, crew, designers joining someone else's show) skip the workspace entirely and simply join the productions they are invited to.</p>`,
        },
        {
          title: "Fill in your details and create the account",
          body: `<p>Enter your name, your workspace name (usually your theatre company; you can rename it later from Settings), your email, and a password of at least 6 characters, then click <strong>Create account</strong>. You land on a check-your-email screen. Prefer one click? Use <strong>Continue with Google</strong> instead; it works for both new and returning accounts and skips email confirmation.</p>`,
        },
        {
          title: "Confirm your email",
          body: `<p>Open the confirmation email and click the link. You are signed in and taken straight to the first-time setup screen for your workspace. Google signups arrive here directly, with no email step.</p>`,
        },
        {
          title: "Upload your company logo (optional)",
          body: `<p>On the setup screen, click <strong>Upload</strong> in the Logo section and pick a PNG or JPG up to 2MB; square images work best. A preview appears, and you can <strong>Replace</strong> or <strong>Remove</strong> it before finishing.</p>`,
        },
        {
          title: "Answer the quick company survey (optional)",
          body: `<p>Tap the chips under <strong>About your company</strong>: average audience size, shows per year, team size, and the kinds of productions you put on (pick as many as apply). This helps tailor the workspace; nothing here is required.</p>`,
        },
        {
          title: "Invite your first teammates (optional)",
          body: `<p>Under <strong>Invite your team</strong>, add a row per person with first name, last name, email, and a role, and click <strong>Add another</strong> for more. Each person gets an email inviting them to join your workspace. If you would rather do this later with the full tooling (CSV import, bulk paste), skip it and see <a href="/docs/get-started/invite-your-company">Invite your company</a>.</p>`,
        },
        {
          title: "Finish setup",
          body: `<p>Click <strong>Finish setup</strong>, or <strong>Skip for now</strong> if you just want to look around. Either way you land on your dashboard, and everything on this screen (logo, survey answers, invites) can be done or changed later from Settings and the People page.</p>`,
        },
      ],
      tip: `<p><strong>No confirmation email?</strong> Check your spam folder first, then use the resend button on the check-your-email screen. If signup instead tells you an account with your email already exists, someone probably invited you to Proscene before you got here: look for the invite email, or use <strong>Set / reset password</strong> from the login page to get a fresh link that also sets your first password.</p>`,
      nextSteps: [
        {
          label: "Set up your first production",
          href: "/docs/get-started/set-up-your-first-production",
        },
        {
          label: "Invite your company",
          href: "/docs/get-started/invite-your-company",
        },
      ],
      related: [
        {
          label: "Roles and permissions",
          href: "/docs/people/roles-and-permissions",
        },
        {
          label: "Troubleshooting invites and access",
          href: "/docs/troubleshooting/invites-and-access",
        },
        {
          label: "Run your first rehearsal",
          href: "/docs/get-started/your-first-rehearsal",
        },
        { label: "People features", href: "/features#people" },
      ],
    },
    {
      slug: "set-up-your-first-production",
      title: "Set up your first production",
      description:
        "A step-by-step walkthrough of Proscene's New Production wizard: show basics, key dates, departments, cast list, team invites, and launch.",
      kind: "how-to",
      intro: `<p>This page walks through creating a show with the New Production wizard, from title to launch. You need a role that can manage productions (admin or producer) to follow along.</p>`,
      steps: [
        {
          title: "Start a new production",
          body: `<p>On the Productions page, click the <strong>+</strong> button and choose <strong>Full setup</strong> to open the six-step wizard. (There is also <strong>Quick add</strong>, which creates a draft show from just a name and an optional opening date; you can come back and fill in the rest any time.) The wizard opens full screen.</p>`,
        },
        {
          title: "Enter the production basics",
          body: `<p>Give the show a <strong>Title</strong> (the only required field on this step), plus a venue and season if you know them, then click <strong>Continue</strong>.</p>`,
        },
        {
          title: "Set the key dates",
          body: `<p>Add your first rehearsal, tech start, <strong>opening night</strong> (the one required date), and closing, along with your regular rehearsal days and times. These drive the show's header and calendar. As the wizard says: only opening night is required, everything else can be set later.</p>`,
        },
        {
          title: "Pick your departments",
          body: `<p>Choose which teams this show needs (scenery, props, costumes, lighting, sound, and so on), and add custom ones if your company runs differently. Departments shape two things downstream: the sections of every rehearsal report and the team buckets on the Cast &amp; Crew board. You can change them later in the production's Settings tab; see <a href="/docs/productions/departments">Departments</a>.</p>`,
        },
        {
          title: "Build the cast list",
          body: `<p>On <strong>Roles &amp; characters</strong>, add each character with an optional actor and type, or open <strong>Paste a cast list to import several at once</strong> and paste one role per line (Character, Actor, Type). The actor field autocompletes against people already in your workspace, so existing members link up automatically.</p>`,
        },
        {
          title: "Invite your team",
          body: `<p>On <strong>Invite your team</strong>, add your stage management, creative team, and cast. People already in your workspace are assigned to the show directly; brand-new names are invited by email when you launch.</p>`,
        },
        {
          title: "Review and launch",
          body: `<p>Check the summary on <strong>Review &amp; launch</strong>, then click <strong>Launch production</strong>. The launch screen confirms what was created, and if anyone on your team list could not be added (say, a typo in an email), they are listed there rather than silently dropped, so you can fix and re-invite.</p>`,
        },
      ],
      tip: `<p><strong>Continue button not lighting up?</strong> The wizard only hard-requires two things: a title on the Production basics step and an opening night on the Key dates step. Everything else can stay blank and be filled in later from the show's tabs and Settings.</p>`,
      nextSteps: [
        {
          label: "Invite your company",
          href: "/docs/get-started/invite-your-company",
        },
        {
          label: "Run your first rehearsal",
          href: "/docs/get-started/your-first-rehearsal",
        },
      ],
      related: [
        {
          label: "The production setup wizard in depth",
          href: "/docs/productions/setup-wizard",
        },
        {
          label: "The Cast & Crew board",
          href: "/docs/productions/cast-crew-board",
        },
        { label: "Departments", href: "/docs/productions/departments" },
        {
          label: "Importing a cast from CSV",
          href: "/docs/people/importing-cast-csv",
        },
      ],
    },
    {
      slug: "invite-your-company",
      title: "Invite your company",
      description:
        "How to invite your company to Proscene: send per-email invites with a role, what invitees receive, and how to resend a pending invite.",
      kind: "how-to",
      intro: `<p>This page is for workspace admins adding cast, crew, and creative team to Proscene. You add each person once at the workspace level, then assign them to any number of shows.</p>`,
      steps: [
        {
          title: "Open the People page",
          body: `<p>Click <strong>People</strong> in the sidebar (it only appears for admins) and then <strong>Add people</strong>. The add dialog opens with three ways in.</p>`,
        },
        {
          title: "Choose how to add them",
          body: `<p>Type one person in manually, upload a CSV (you map the columns and preview before anything imports), or paste a list of names and emails. For a whole season's worth of people, CSV or paste is the fast path; see <a href="/docs/people/importing-cast-csv">Importing a cast from CSV</a>.</p>`,
        },
        {
          title: "Give each person a role",
          body: `<p>Pick a role per person: Admin, Producer, Director, Choreographer, Creative, Stage Manager, Cast, or Crew. The role sets what they can see and do across the workspace, so cast your roles as carefully as your show. When in doubt, start lower; you can promote anyone later from their profile.</p>`,
        },
        {
          title: "Assign productions in the same pass (optional)",
          body: `<p>You can attach people to a production as you add them, so an invited actor lands with their show already on their dashboard. You can also do this later by multi-selecting rows in the People table or by dragging on the <a href="/docs/productions/cast-crew-board">Cast &amp; Crew board</a>.</p>`,
        },
        {
          title: "Send the invites",
          body: `<p>Leave <strong>send invite</strong> on and finish the dialog. You get a summary of who was invited, who was added, and who was skipped. What each person receives depends on whether they already use Proscene: <strong>new people</strong> get an invite email with a set-password link, and once they set a password they land signed in to your workspace. <strong>People who already have a Proscene account</strong> are added immediately with no password step, and get an in-app notification plus an email letting them know they have been added to your company.</p>`,
        },
        {
          title: "Watch the status column",
          body: `<p>Each person shows <strong>Invite pending</strong> in the directory until their first sign-in, then flips to Active. That is your at-a-glance view of who still has not joined.</p>`,
        },
        {
          title: "Resend an invite when needed",
          body: `<p>If someone lost the email or their link expired, open their entry in the People directory and click <strong>Resend invite</strong>. They get a fresh email with a new set-password link.</p>`,
        },
      ],
      tip: `<p><strong>Invite not arriving, or the link says it expired?</strong> Have them check spam first, then resend from their person entry. Invitees can also rescue themselves: <strong>Set / reset password</strong> from the login page emails a fresh link that doubles as first-time password setup, no original invite required. Note that invites are always per email address; there is no share-one-link option, which keeps your workspace limited to people you actually invited.</p>`,
      nextSteps: [
        {
          label: "Run your first rehearsal",
          href: "/docs/get-started/your-first-rehearsal",
        },
        {
          label: "Roles and permissions",
          href: "/docs/people/roles-and-permissions",
        },
      ],
      related: [
        {
          label: "The People directory",
          href: "/docs/people/people-directory",
        },
        {
          label: "Importing a cast from CSV",
          href: "/docs/people/importing-cast-csv",
        },
        {
          label: "Troubleshooting invites and access",
          href: "/docs/troubleshooting/invites-and-access",
        },
        {
          label: "The Cast & Crew board",
          href: "/docs/productions/cast-crew-board",
        },
      ],
    },
    {
      slug: "your-first-rehearsal",
      title: "Run your first rehearsal in Proscene",
      description:
        "Schedule your first rehearsal call in Proscene, collect company confirmations, then write and distribute your first rehearsal report.",
      kind: "how-to",
      intro: `<p>This page takes a stage manager through one full rehearsal cycle: schedule the call, watch the company confirm, then write and distribute the rehearsal report. You need a report-writing role (admin, producer, director, choreographer, creative, or stage manager).</p>`,
      steps: [
        {
          title: "Open the schedule and start a call",
          body: `<p>In your production, open the <strong>Rehearsal Schedule</strong> tab and click <strong>Schedule call</strong>. The Schedule a call form opens with today's date and a sensible start time already filled.</p>`,
        },
        {
          title: "Fill in the call details",
          body: `<p>Set the date, start and end time, and location, then add the working details: focus (say, "Act II choreography"), scenes or numbers, a schedule breakdown (the "6:30 to 6:45 vocal warmups" timeline), and any notes for the company. Only fill what you know; calls are easy to edit later.</p>`,
        },
        {
          title: "Choose who is called and save",
          body: `<p>Use the quick-select chips (<strong>Full Cast</strong>, <strong>Principals</strong>, <strong>Full Ensemble</strong>) or pick individual people, then click <strong>Schedule call</strong>. The call lands on the production calendar and shows up as the next call on every called member's dashboard.</p>`,
        },
        {
          title: "Watch the confirmations come in",
          body: `<p>Company members see the call on their dashboard with a <strong>Confirm you'll be there</strong> button (tapping again undoes it). Your dashboard shows a running count, "3 of 12 confirmed", with the confirmed faces, so you know before you leave for the theatre who has seen the call. More in <a href="/docs/scheduling/rsvp-and-confirmations">RSVP and confirmations</a>.</p>`,
        },
        {
          title: "Start the rehearsal report",
          body: `<p>During or right after rehearsal, click <strong>New report</strong> at the top of the production. The report is numbered automatically. Fill in the header times (scheduled call, actual start, end), your general notes, and a note per department; the department sections match exactly the departments you chose for this show.</p>`,
        },
        {
          title: "Save a draft as you go",
          body: `<p>Click <strong>Save draft</strong> any time. Drafts are visible only to the report-writing roles, so you can leave half-finished notes sitting overnight without the cast reading them; they will not see anything until you distribute.</p>`,
        },
        {
          title: "Distribute the report",
          body: `<p>When it is ready, click <strong>Distribute</strong>. The report becomes visible to the whole production, and the email picker opens so you can send it out: choose <strong>Entire production</strong> or tick individual recipients. Full details in <a href="/docs/reports/distributing-reports">Distributing reports</a>.</p>`,
        },
        {
          title: "Set up the rest of the run (optional)",
          body: `<p>Once the first call feels right, stop scheduling one night at a time: in the Schedule a call tray, flip the toggle from <strong>One call</strong> to <strong>Repeating</strong> to generate a whole block of rehearsals across a date range and chosen weekdays. See <a href="/docs/scheduling/bulk-schedule-generation">Bulk schedule generation</a>.</p>`,
        },
      ],
      tip: `<p><strong>Cast says they cannot see the report?</strong> It is almost always still a draft. Draft reports are hidden from cast and crew on every surface (the list, the report page, even the dashboard feed) until you click <strong>Distribute</strong>. Open the report and check the pill next to its title: amber Draft means only report writers can see it, sage Distributed means the company can.</p>`,
      nextSteps: [
        {
          label: "Bulk schedule generation",
          href: "/docs/scheduling/bulk-schedule-generation",
        },
        {
          label: "Distributing reports",
          href: "/docs/reports/distributing-reports",
        },
      ],
      related: [
        { label: "Creating calls", href: "/docs/scheduling/creating-calls" },
        {
          label: "RSVP and confirmations",
          href: "/docs/scheduling/rsvp-and-confirmations",
        },
        {
          label: "Creating a rehearsal report",
          href: "/docs/reports/creating-a-rehearsal-report",
        },
        {
          label: "Department notes",
          href: "/docs/reports/department-notes",
        },
      ],
    },
  ],
};
