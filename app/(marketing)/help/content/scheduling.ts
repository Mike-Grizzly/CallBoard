import type { DocSection } from "./types";

export const scheduling: DocSection = {
  slug: "scheduling",
  title: "Calls & calendar",
  blurb:
    "Schedule rehearsal calls, repeat them with templates, and keep the whole company looking at the same calendar.",
  description:
    "Plan rehearsal calls, generate repeating schedules, collect confirmations, and give everyone one personal calendar across productions.",
  featureHref: "/features#calls",
  featureLinkLabel: "See calls & calendar",
  overview: [
    {
      heading: "Two calendars, one schedule",
      body: `<p>Scheduling in Proscene lives in two places that always agree with each other. Each production has its own <strong>Rehearsal Schedule</strong> tab, which is where the stage management team plans calls for that show. And every person in the workspace has a personal <strong>Calendar</strong> in the left navigation, which gathers the calls from every production they belong to into one view.</p><p>You schedule once, on the production. The call then shows up on the production calendar, on each member's personal calendar, and on the dashboard as the next call, with a live countdown. There is no separate publish step and nothing to sync.</p>`,
    },
    {
      heading: "What a call is",
      body: `<p>A call is one scheduled block of rehearsal: a date, an optional start and end time, a location, and the working details a company actually needs on the callboard. Those details are a general <strong>focus</strong> (say, Act II choreography), specific <strong>scenes or numbers</strong>, <strong>who is called</strong>, a line-by-line <strong>schedule breakdown</strong>, and free-form notes.</p><p>You do not have to fill all of that in at once. A common rhythm is to block out dates and times weeks ahead, then fill in scenes and cast a day or two before each call. Proscene works out each call's status on its own: it shows as upcoming until the start time, live during the call window, and past afterward.</p>`,
    },
    {
      heading: "Who can schedule",
      body: `<p>Creating, editing, and deleting calls, plus templates and repeating schedules, is limited to the production staff roles: <strong>admin, producer, director, choreographer, creative, and stage manager</strong>. Cast and crew see the full calendar and every call's details, and can confirm they will be there, but they cannot change the schedule.</p><p>For the full breakdown of what each role can do, see <a href="/help/people/roles-and-permissions">roles and permissions</a>.</p>`,
    },
  ],
  pages: [
    {
      slug: "creating-calls",
      title: "Create and send a rehearsal call",
      description:
        "How to create a rehearsal call in Proscene: set the date, times, location, and who is called, then share it to the whole company's calendars.",
      kind: "how-to",
      intro: `<p>This page walks through scheduling a single rehearsal call from a production's calendar. You need a staff role (stage manager, director, choreographer, creative, producer, or admin) to schedule.</p>`,
      steps: [
        {
          title: "Open the production's Rehearsal Schedule",
          body: `<p>From your production, open the <strong>Rehearsal Schedule</strong> tab. The production calendar opens on the current month, with any existing calls shown in the production's color.</p>`,
        },
        {
          title: "Click Schedule call",
          body: `<p>Click the <strong>Schedule call</strong> button in the calendar toolbar (on a phone, tap the round plus button in the corner). The <strong>Schedule a call</strong> tray slides in over the calendar, set to <strong>One call</strong> mode.</p>`,
        },
        {
          title: "Set the date and times",
          body: `<p>In <strong>When &amp; where</strong>, pick the date. The date is the only required field. The start time defaults to the next whole hour and the end time follows it two hours later, so adjust both to your actual call window.</p>`,
        },
        {
          title: "Add the location",
          body: `<p>Type where the company should show up, like Studio A or the main stage. This appears on every calendar chip and in the call's details, so be specific enough that nobody has to ask.</p>`,
        },
        {
          title: "Say what is being worked and who is called",
          body: `<p>In <strong>What's being worked</strong>, add a general <strong>Focus</strong>, list <strong>Scenes / numbers</strong>, and choose the <strong>Cast called</strong>. Use the quick-select chips (<strong>Full Cast</strong>, <strong>Principals</strong>, <strong>Full Ensemble</strong>) or check individual names from the production's cast list. The form's own hints say it: focus can be set a week out, scenes and cast a day or two before.</p>`,
        },
        {
          title: "Add the schedule breakdown and notes",
          body: `<p>Optionally type a <strong>Schedule breakdown</strong>, one item per line (6:00 to 6:30 warmups, and so on), plus anything else the company should know in <strong>Notes</strong>. Any format works; it displays exactly as you typed it.</p>`,
        },
        {
          title: "Click Schedule call to save",
          body: `<p>Click <strong>Schedule call</strong> at the bottom of the tray. The tray closes, the calendar refreshes in place, and the new call appears on the date you picked.</p>`,
        },
        {
          title: "Check what the company sees",
          body: `<p>The call now shows on the production's Rehearsal Schedule, on each member's personal <a href="/help/scheduling/personal-calendar">Calendar</a>, and on the dashboard as the next call with a countdown. Anyone can click the call to open its details drawer: when, where, scenes, who is called, the breakdown, and notes. Calls do not fire an automatic notification, so the calendar and dashboard are the source of truth.</p>`,
        },
      ],
      tip: `<p>Made a mistake, or plans changed? Open the call from any calendar and click <strong>Edit</strong> in its details drawer. Staff can change every field or delete the call entirely; the update appears everywhere at once.</p>`,
      nextSteps: [
        {
          label: "Generate a repeating rehearsal schedule",
          href: "/help/scheduling/bulk-schedule-generation",
        },
        {
          label: "How call confirmations work",
          href: "/help/scheduling/rsvp-and-confirmations",
        },
        {
          label: "Run your first rehearsal",
          href: "/help/get-started/your-first-rehearsal",
        },
      ],
      related: [
        {
          label: "See every call in one personal calendar",
          href: "/help/scheduling/personal-calendar",
        },
        {
          label: "Invite your company",
          href: "/help/get-started/invite-your-company",
        },
        {
          label: "Roles and permissions",
          href: "/help/people/roles-and-permissions",
        },
        {
          label: "Create a rehearsal report",
          href: "/help/reports/creating-a-rehearsal-report",
        },
      ],
    },
    {
      slug: "bulk-schedule-generation",
      title: "Generate a repeating rehearsal schedule with call templates",
      description:
        "Use call templates and Repeating mode in Proscene to generate a recurring rehearsal schedule: pick weekdays and a date range, skip clashes.",
      kind: "how-to",
      intro: `<p>If your show rehearses every Tuesday and Thursday for six weeks, you do not want to type six weeks of calls by hand. Repeating mode creates them all in one pass, optionally seeded from a saved template.</p>`,
      steps: [
        {
          title: "Open the tray and switch to Repeating",
          body: `<p>On the production's Rehearsal Schedule, click <strong>Schedule call</strong>, then flip the toggle at the top of the tray from <strong>One call</strong> to <strong>Repeating</strong>. The tray's heading changes to <strong>Schedule rehearsals</strong> and the generator form replaces the single-call form.</p>`,
        },
        {
          title: "Pick a template, or start from blank",
          body: `<p>If the production has saved templates, choose one from the <strong>Template</strong> dropdown; it fills the call defaults below with the template's time, location, focus, and other fields. No templates yet? Leave it blank and type the defaults yourself, or follow the <strong>Save a template</strong> link to create one first.</p>`,
        },
        {
          title: "Set the date range",
          body: `<p>Set the start and end dates. The range defaults to today through six weeks out. Calls are only created inside this window, inclusive of both ends.</p>`,
        },
        {
          title: "Choose the weekdays with the Repeat on chips",
          body: `<p>Tap the weekday chips (Sun through Sat) for your rehearsal days; selected chips fill in with the accent color. A call is created on every selected weekday in the range, and you must pick at least one.</p>`,
        },
        {
          title: "Leave Skip clashes on",
          body: `<p>The <strong>Skip clashes</strong> checkbox is on by default and means a day that already has any call is left alone. Keep it on unless you genuinely want doubled-up calls on the same day.</p>`,
        },
        {
          title: "Fill in the call defaults",
          body: `<p>Set the time, location, focus, cast called, and schedule breakdown that every generated call should share. In Repeating mode, <strong>Cast called</strong> is plain text (like Full Cast or Principals) rather than the name picker, so generated calls are skeletons you flesh out per day.</p>`,
        },
        {
          title: "Click Generate calls",
          body: `<p>Click <strong>Generate calls</strong>. The tray closes and every matching date now has a call on the calendar. One run can create up to 200 calls; a bigger range gets an error asking you to narrow it. If every matching day was skipped as a clash, you get a message saying so instead.</p>`,
        },
        {
          title: "Adjust individual days as normal",
          body: `<p>Each generated call is an ordinary call. Open any one of them to edit its scenes, cast, or times, or delete a day off entirely. Editing or deleting the template later never touches calls that already exist.</p>`,
        },
      ],
      tip: `<p>Generation runs one weekly pattern at a time. For a schedule like Tuesdays at 7 but Saturdays at 10, run the generator twice, once per pattern, and Skip clashes will keep the runs from colliding. Templates live under the production's calendar at <strong>Templates</strong>, where each one has its own <strong>Generate</strong> button.</p>`,
      nextSteps: [
        {
          label: "Create and send a single rehearsal call",
          href: "/help/scheduling/creating-calls",
        },
        {
          label: "How call confirmations work",
          href: "/help/scheduling/rsvp-and-confirmations",
        },
        {
          label: "See every call in one personal calendar",
          href: "/help/scheduling/personal-calendar",
        },
      ],
      related: [
        {
          label: "Set up your first production",
          href: "/help/get-started/set-up-your-first-production",
        },
        {
          label: "The production setup wizard",
          href: "/help/productions/setup-wizard",
        },
        {
          label: "Import your cast from a CSV",
          href: "/help/people/importing-cast-csv",
        },
        {
          label: "Roles and permissions",
          href: "/help/people/roles-and-permissions",
        },
      ],
    },
    {
      slug: "rsvp-and-confirmations",
      title: "Confirm a rehearsal call (call confirmations)",
      description:
        "How call confirmations work in Proscene: cast confirm the next rehearsal call with one tap, and everyone sees who has confirmed so far.",
      kind: "how-to",
      intro: `<p>Call confirmations are Proscene's lightweight RSVP: one tap says you will be there, and the whole company can watch the count fill in. Here is how to confirm as a cast or crew member, and what the stage manager sees.</p>`,
      steps: [
        {
          title: "Open your Dashboard",
          body: `<p>Click <strong>Dashboard</strong> in the left navigation. Your next call, the earliest upcoming call across all your productions, sits front and center in the <strong>Next call</strong> panel with a live countdown (or a <strong>Live now</strong> badge if it has started).</p>`,
        },
        {
          title: "Check the call details",
          body: `<p>The panel shows the date and times, the location, and which production the call belongs to. Need more, like scenes or the schedule breakdown? <strong>Open schedule</strong> takes you to the production's full calendar.</p>`,
        },
        {
          title: "Tap Confirm you'll be there",
          body: `<p>Tap the <strong>Confirm you'll be there</strong> button (on a phone it is simply <strong>Confirm</strong>). It flips to <strong>You're confirmed</strong> immediately, and your avatar joins the confirmed stack. That is the whole job; there is nothing else to fill in.</p>`,
        },
        {
          title: "Undo it if plans change",
          body: `<p>The button is a toggle. Tap <strong>You're confirmed</strong> again and your confirmation is withdrawn, and the count drops back down. Confirm again whenever you are sure.</p>`,
        },
        {
          title: "Read the confirmation rollup",
          body: `<p>Below the countdown, everyone sees the same rollup: a stack of avatars for the people who have confirmed, a progress bar, and a count like <strong>7 of 12 confirmed</strong>. Before anyone responds it reads <strong>No confirmations yet</strong>. The total is everyone on the production, so a stage manager can glance at the dashboard the day of a call and know who still needs a nudge.</p>`,
        },
      ],
      tip: `<p>Confirmations live on the dashboard's next-call panel, so they naturally cover the call that matters right now. There is no per-call RSVP roster page yet; if you need a formal sign-in record, take attendance in that day's <a href="/help/reports/creating-a-rehearsal-report">rehearsal report</a>.</p>`,
      nextSteps: [
        {
          label: "See every call in one personal calendar",
          href: "/help/scheduling/personal-calendar",
        },
        {
          label: "Create a rehearsal report",
          href: "/help/reports/creating-a-rehearsal-report",
        },
        {
          label: "Set up notifications",
          href: "/help/troubleshooting/notifications",
        },
      ],
      related: [
        {
          label: "Create and send a rehearsal call",
          href: "/help/scheduling/creating-calls",
        },
        {
          label: "Invite your company",
          href: "/help/get-started/invite-your-company",
        },
        {
          label: "Roles and permissions",
          href: "/help/people/roles-and-permissions",
        },
        {
          label: "Trouble getting into a production?",
          href: "/help/troubleshooting/invites-and-access",
        },
      ],
    },
    {
      slug: "personal-calendar",
      title: "See every call in one personal calendar",
      description:
        "Your Proscene personal calendar gathers every rehearsal call across your productions into month, week, day, and agenda views.",
      kind: "how-to",
      intro: `<p>The personal calendar is the answer to the classic multi-show problem: which rehearsals am I actually called to this week? It pulls every call from every production you belong to into one place, color-coded per show.</p>`,
      steps: [
        {
          title: "Open Calendar from the left navigation",
          body: `<p>Click <strong>Calendar</strong> in the sidebar (it also has its own tab in the mobile tab bar). The calendar opens on the current month with every call from your productions, each in its production's color. If you are on one show you see that show; admins and producers see calls for every production in the workspace.</p>`,
        },
        {
          title: "Switch views to match the question",
          body: `<p>Use the view switcher in the toolbar: <strong>Month</strong> for the big picture, <strong>Week</strong> for an hour-by-hour grid, <strong>Day</strong> for one date in detail, and <strong>Agenda</strong> for a simple three-week list. The arrows and <strong>Today</strong> button move you around; during a live call, the week and day views draw a now line at the current time.</p>`,
        },
        {
          title: "Filter to the productions you care about",
          body: `<p>If you are on more than one show, the sidebar lists each production as a colored swatch. Click swatches to show or hide those productions, and <strong>All</strong> to reset. The mini month above them marks days that have events with a small dot, and the <strong>Upcoming</strong> list below shows your next five calls.</p>`,
        },
        {
          title: "Open a call for the details",
          body: `<p>Click any call to slide open its details drawer: the production, when and how long, where, the scenes being worked, who is called, the schedule breakdown, and notes. On a phone, tapping a day in month view opens a day sheet first, then the call.</p>`,
        },
        {
          title: "Jump to the production when you need more",
          body: `<p>From the drawer, <strong>Open schedule</strong> takes you to that production's full Rehearsal Schedule. Staff with scheduling rights also get a <strong>Schedule call</strong> button right on the personal calendar; with several productions it first asks which show the new call is for.</p>`,
        },
      ],
      tip: `<p>The calendar loads a window of about a month and a half back and four months ahead. If you page far into the future and it looks empty, refresh the page to load that stretch of the schedule.</p>`,
      nextSteps: [
        {
          label: "How call confirmations work",
          href: "/help/scheduling/rsvp-and-confirmations",
        },
        {
          label: "Run your first rehearsal",
          href: "/help/get-started/your-first-rehearsal",
        },
        {
          label: "Create and send a rehearsal call",
          href: "/help/scheduling/creating-calls",
        },
      ],
      related: [
        {
          label: "Generate a repeating rehearsal schedule",
          href: "/help/scheduling/bulk-schedule-generation",
        },
        {
          label: "The people directory",
          href: "/help/people/people-directory",
        },
        {
          label: "Set up notifications",
          href: "/help/troubleshooting/notifications",
        },
        {
          label: "Calendar on the features tour",
          href: "/features#calendar",
        },
      ],
    },
  ],
};
