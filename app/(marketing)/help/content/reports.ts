import type { DocSection } from "./types";

export const reports: DocSection = {
  slug: "reports",
  title: "Rehearsal reports",
  blurb:
    "Structured nightly rehearsal reports: department notes, attendance, line notes, and one-click distribution to your company.",
  description:
    "How rehearsal reports work in Proscene: create a structured report, route notes by department, and distribute it to your whole company.",
  featureHref: "/features#reports",
  overview: [
    {
      heading: "What a rehearsal report is in Proscene",
      body: `<p>A rehearsal report in Proscene is a structured nightly record, not a blank text box. Each report carries an automatically assigned report number and date, call times and breaks, attendance counts with per-person notes, the scenes you worked, a rich text note section for every department in the production, schedule changes, line notes, injuries and incidents, general notes, next rehearsal details, and file attachments. Because the notes are organized by department, the report does the routing for you: lighting reads the lighting section, wardrobe reads costumes, and nobody digs through a wall of prose to find their one note.</p>`,
    },
    {
      heading: "Who can create and send reports",
      body: `<p>Creating, editing, and sending reports takes the report manager capability. In Proscene that belongs to admins, producers, directors, choreographers, creative team members, and stage managers. Everyone on a production, cast and crew included, can read a report once it has been distributed. See <a href="/help/people/roles-and-permissions">roles and permissions</a> for the full breakdown.</p>`,
    },
    {
      heading: "The draft to distributed lifecycle",
      body: `<p>Every report starts as a draft. Drafts are visible only to report managers, so you can save a half-finished report mid-rehearsal without the company reading raw attendance or injury notes. When you click <strong>Distribute</strong>, the report becomes visible to the whole production and Proscene offers to email it to the members you choose. Report managers can keep editing after distribution, and changes save in place.</p>`,
    },
  ],
  pages: [
    {
      slug: "creating-a-rehearsal-report",
      title: "Create a rehearsal report",
      description:
        "Create a rehearsal report in Proscene: report number and date, call times, attendance, department notes, line notes, attachments, and drafts.",
      kind: "how-to",
      intro: `<p>The rehearsal report is the nightly record of what happened in the room, and it is Proscene's flagship feature. This page walks through filling one out, from a blank form to a saved draft or a distributed report.</p>`,
      steps: [
        {
          title: "Open the Reports tab and start a new report",
          body: `<p>From your production, open <strong>Reports</strong> and click <strong>New report</strong>. The editor opens as a fresh draft with today's date and a <strong>New draft</strong> pill in the header.</p>`,
        },
        {
          title: "Confirm the report date",
          body: `<p>The date sits in the header under the report title. Click it to change it if you are filing for a different day. The report number is assigned automatically when you save, counting up per production, so R-12 follows R-11 with no bookkeeping on your part.</p>`,
        },
        {
          title: "Fill in the summary cards",
          body: `<p>Across the top are three cards. <strong>Call times</strong> takes the start and end times plus any breaks (5-min, 10-min, or Meal). <strong>Attendance</strong> takes present, absent, and late counts, with per-person notes for anyone you need to flag. <strong>Scenes worked</strong> lists what you covered, with pages and time spent. Everything here is optional; record what you tracked.</p>`,
        },
        {
          title: "Write your department notes",
          body: `<p>On the <strong>Department notes</strong> tab, every department in the production has its own card. Click a card to open a rich text editor for that department, write the note, and save. The card fills in with your note, and the tab shows a running count of departments that have one.</p>`,
        },
        {
          title: "Log schedule changes, line notes, and injuries",
          body: `<p>Use the <strong>Schedule changes</strong>, <strong>Line notes</strong>, and <strong>Injuries / incidents</strong> tabs to add rows as needed: who is affected and what changed, the line and the issue for line notes, and the time and a description for incidents. Each tab shows a count so you can see at a glance what the report contains.</p>`,
        },
        {
          title: "Add general notes and the next rehearsal",
          body: `<p>The <strong>General notes</strong> tab is a free rich text summary of the day, for anything that does not belong to a single department. The <strong>Next rehearsal</strong> tab takes the date, time, location, and what will be covered, so the company knows what is coming.</p>`,
        },
        {
          title: "Attach files",
          body: `<p>In the <strong>Attachments</strong> card, add PDFs, images, or Office documents, up to 10 MB per file. Files are staged with the form and upload when you save, so you can attach things as you go without saving a draft first.</p>`,
        },
        {
          title: "Save as a draft or distribute",
          body: `<p>Click <strong>Save draft</strong> to keep the report private to report managers; you land back on the reports list with a Draft pill on the new report. Click <strong>Distribute</strong> when it is ready for the company: the report becomes visible to everyone on the production and Proscene opens the email dialog so you can send it out.</p>`,
        },
      ],
      tip: `<p>Missing a department card? The sections come from your production's department list, not a fixed set. Add or remove departments on the production's <strong>Settings</strong> tab, then come back to the form. See <a href="/help/reports/department-notes">how department notes work</a>.</p>`,
      nextSteps: [
        {
          label: "Distribute the report to your company",
          href: "/help/reports/distributing-reports",
        },
        {
          label: "Shape the department sections for your show",
          href: "/help/reports/department-notes",
        },
        {
          label: "Schedule the next rehearsal",
          href: "/help/scheduling/creating-calls",
        },
      ],
      related: [
        {
          label: "Departments on a production",
          href: "/help/productions/departments",
        },
        {
          label: "Roles and permissions",
          href: "/help/people/roles-and-permissions",
        },
        {
          label: "Your first rehearsal",
          href: "/help/get-started/your-first-rehearsal",
        },
        { label: "Rehearsal reports feature tour", href: "/features#reports" },
      ],
    },
    {
      slug: "department-notes",
      title: "Department notes in rehearsal reports",
      description:
        "How department notes in rehearsal reports work: sections come from your production's departments and route notes straight to the right teams.",
      kind: "concept",
      intro: `<p>Every rehearsal report in Proscene is organized by department, so the props note reaches props and the costume note reaches the shop. Here is where those sections come from and how to shape them for your show.</p>`,
      blocks: [
        {
          heading: "Report sections come from your production's departments",
          body: `<p>Each production keeps its own department list, and the report form, the report page, and the emailed report all build their sections from it. One department equals one note card on the form and one labeled section in the finished report. If a production has no department list on file, Proscene shows the full standard set of 12, so reports always have somewhere to put a note.</p>`,
        },
        {
          heading: "The 12 standard departments",
          body: `<p>Proscene ships with a standard catalog that covers most shows:</p><ul><li>Scenery / Set</li><li>Props</li><li>Costumes</li><li>Hair &amp; Makeup</li><li>Lighting</li><li>Sound</li><li>Sound Effects</li><li>Music</li><li>Choreography</li><li>Video / Projection</li><li>Crew</li><li>Other</li></ul><p>Use as many or as few as your production needs; a straight play with no projections does not have to carry a Video section.</p>`,
        },
        {
          heading: "Custom departments",
          body: `<p>You can add departments beyond the standard 12, for example Intimacy / Fight or Dramaturgy. A custom department behaves exactly like a standard one: it gets a note card on the report form, its own section in the distributed report and email, and a team bucket on the Cast &amp; Crew board.</p>`,
        },
        {
          heading: "Managing the list",
          body: `<p>Open your production's <strong>Settings</strong> tab and find the <strong>Departments</strong> panel. From there you can add departments from the standard catalog, add a custom one, remove departments the show does not use, and save. The <a href="/help/productions/setup-wizard">setup wizard</a> seeds this list when the production is created, so most shows only come back here when something changes.</p>`,
        },
        {
          heading: "Notes route to the right team, and history is safe",
          body: `<p>Because each department renders as its own labeled section in the report and in the distributed email, everyone can jump straight to their notes. Departments with nothing filed simply read as having no notes. And the history is safe: removing a department from a production later does not erase notes already saved on past reports; old reports keep rendering exactly as they were filed.</p>`,
        },
      ],
      nextSteps: [
        {
          label: "Create a rehearsal report",
          href: "/help/reports/creating-a-rehearsal-report",
        },
        {
          label: "Manage departments on a production",
          href: "/help/productions/departments",
        },
        {
          label: "See the Cast & Crew board",
          href: "/help/productions/cast-crew-board",
        },
      ],
      related: [
        {
          label: "Distribute a rehearsal report",
          href: "/help/reports/distributing-reports",
        },
        {
          label: "The production setup wizard",
          href: "/help/productions/setup-wizard",
        },
        {
          label: "Roles and permissions",
          href: "/help/people/roles-and-permissions",
        },
        { label: "Rehearsal reports feature tour", href: "/features#reports" },
      ],
    },
    {
      slug: "distributing-reports",
      title: "Distribute a rehearsal report",
      description:
        "Distribute a rehearsal report in Proscene: pick recipients from the production, send by email, and make the report visible to cast and crew.",
      kind: "how-to",
      intro: `<p>Distributing is how a report goes from a stage manager's private draft to the whole company: it flips the report to Distributed inside Proscene and emails it to the members you choose.</p>`,
      steps: [
        {
          title: "Finish the report and click Distribute",
          body: `<p>In the report editor, click <strong>Distribute</strong>. If you saved a draft earlier, open it from the reports list, click <strong>Edit</strong>, and distribute from there. The status pill flips to <strong>Distributed</strong>, the report becomes visible to the whole production, and the email dialog opens automatically.</p>`,
        },
        {
          title: "Or email an already distributed report",
          body: `<p>On any report page, click <strong>Email report</strong> at the top. The same <strong>Distribute report</strong> dialog opens. This is how you resend after edits, or catch up someone who joined the production late.</p>`,
        },
        {
          title: "Choose your recipients",
          body: `<p>Everyone on the production is preselected. Keep <strong>Entire production</strong> checked to send to the full company, or untick it and pick individual members. Recipients must be members of the production; Proscene will not send a report to outside addresses.</p>`,
        },
        {
          title: "Send it",
          body: `<p>Click the <strong>Send</strong> button, which shows how many people you have selected. Proscene emails the full report, from the header and summary cards through department notes, line notes, and injuries, as a formatted message with a plain text fallback for stricter mail clients.</p>`,
        },
        {
          title: "Check the attachment note if you had big files",
          body: `<p>Report attachments ride along as real email attachments. If the combined size is too large for email (roughly 35 MB), Proscene still sends the report and tells you which files were left off. Those files remain downloadable from the report page itself.</p>`,
        },
        {
          title: "Know who sees what",
          body: `<p>Once distributed, the report appears in the reports list for everyone on the production, cast and crew included. Until then, a draft is visible only to report managers, the roles that can create reports, so half-finished attendance or injury notes never leak early.</p>`,
        },
      ],
      tip: `<p>Distributing and emailing are separate actions. Clicking <strong>Distribute</strong> makes the report visible in Proscene and opens the email dialog, but no email goes out until you confirm the send. If you close the dialog, the report is still distributed; use <strong>Email report</strong> later to send it.</p>`,
      nextSteps: [
        {
          label: "Create the next rehearsal report",
          href: "/help/reports/creating-a-rehearsal-report",
        },
        {
          label: "Get everyone onto the production",
          href: "/help/get-started/invite-your-company",
        },
        {
          label: "Check who holds which role",
          href: "/help/people/roles-and-permissions",
        },
      ],
      related: [
        {
          label: "Department notes in rehearsal reports",
          href: "/help/reports/department-notes",
        },
        {
          label: "The people directory",
          href: "/help/people/people-directory",
        },
        {
          label: "Troubleshooting notifications",
          href: "/help/troubleshooting/notifications",
        },
        { label: "Rehearsal reports feature tour", href: "/features#reports" },
      ],
    },
  ],
};
