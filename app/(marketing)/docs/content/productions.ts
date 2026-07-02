import type { DocSection } from "./types";

export const productions: DocSection = {
  slug: "productions",
  title: "Productions",
  blurb: "Create a show, cast it, and shape the departments it runs on.",
  description:
    "Guides to productions in Proscene: the New Production setup wizard, the Cast and Crew casting board, and per-show departments.",
  featureHref: "/features#sm",
  overview: [
    {
      heading: "What a production is in Proscene",
      body: `<p>A production is one show. Each production gets its own space with its own tabs: Overview, Rehearsal Reports, Rehearsal Schedule, Documents, Announcements, and Your Script, plus tabs that appear based on your role, such as My Notes, Rehearsal Video, Blocking, and Settings. Everything you do for that show, from the first read to closing, lives inside it, so <em>Twelfth Night</em> never bleeds into your spring musical.</p>`,
    },
    {
      heading: "What lives inside one",
      body: `<p>Inside a production you will find rehearsal reports with per-department note sections, the rehearsal schedule and calls, a document library, announcements, the script (with optional AI analysis), blocking, and rehearsal video. The show's people live there too: a cast list of characters with the performers cast in them, and a production team built from leadership roles and departments. Team management happens on the <a href="/docs/productions/cast-crew-board">Cast &amp; Crew board</a>, reached from the button in the production header.</p>`,
    },
    {
      heading: "Who can create and manage productions",
      body: `<p>Creating a production, editing its settings, and assigning people all require the manage-productions permission, which admins and producers hold. Everyone in your organization can see the production list, but shows you are not assigned to appear dimmed with a lock, and you cannot open them until someone adds you. Once you are cast or added to the team, the production unlocks for you. See <a href="/docs/people/roles-and-permissions">roles and permissions</a> for the full breakdown.</p>`,
    },
  ],
  pages: [
    {
      slug: "setup-wizard",
      title: "Set up a new production with the setup wizard",
      description:
        "How to create a show with the New Production wizard in Proscene: name and dates, departments, cast list, optional AI script read, and team invites.",
      kind: "how-to",
      intro: `<p>The Full setup wizard walks you from a blank slate to a launched show in six steps: basics, dates, departments, roles, team, review. Everything it asks for can be changed later, so do not agonize.</p>`,
      steps: [
        {
          title: "Start a new production",
          body: `<p>On the Productions page, click the <strong>+</strong> button and choose <strong>Full setup</strong>. The wizard opens full-screen. (If you only have a title so far, <strong>Quick add</strong> creates a draft from just a show name and an optional opening date, and drops you straight into the production.) Only admins and producers see these options.</p>`,
        },
        {
          title: "Name your show",
          body: `<p>On <strong>Production basics</strong>, enter the title. That is the only field the wizard insists on before you can continue. Add the venue and season if you know them, and pick a color, which becomes the show's badge on the calendar and dashboard. Click <strong>Continue</strong>.</p>`,
        },
        {
          title: "Add key dates and your rehearsal pattern",
          body: `<p>On <strong>Key dates</strong>, set first rehearsal, tech week start, opening night, and closing. Any of these can wait, but dates you add now power the dashboard countdown and calendar. Below, tap the weekdays you typically rehearse and set typical start and end times; these pre-fill call times on rehearsal reports and can be overridden per day.</p>`,
        },
        {
          title: "Choose your departments",
          body: `<p>On <strong>Departments</strong>, tap the cards to turn areas on or off. Director / Production and Stage Management are always on. Each enabled department becomes a note section in your rehearsal reports and a team bucket on the Cast &amp; Crew board. You can change all of this later from the production's Settings tab; see <a href="/docs/productions/departments">departments</a>.</p>`,
        },
        {
          title: "Upload the script to auto-fill your cast (optional)",
          body: `<p>On <strong>Roles &amp; characters</strong>, drag a PDF of your script into the upload box, or click <strong>Upload script &amp; auto-fill</strong>. With <strong>Auto-fill cast from this script</strong> checked (it is on by default), the AI reads the script and drops the characters into your roles list, usually within a minute or two, even if you have moved on to the next step. Untick the box to opt out: the file still uploads and becomes the production's default script, and you can run the AI read later from the Script tab. See <a href="/docs/script/ai-script-analysis">AI script analysis</a>.</p>`,
        },
        {
          title: "Add roles by hand or in bulk",
          body: `<p>Still on the Roles step, add or edit rows: character name, an optional actor (start typing to pick from your organization), and a type (Principal, Supporting, Ensemble, Dance Core, or Swing/Cover). To import several at once, open <strong>Paste a cast list to import several at once</strong> and paste one role per line as Character, Actor, Type.</p>`,
        },
        {
          title: "Invite your team",
          body: `<p>On <strong>Invite your team</strong>, add stage management, creatives, and crew by name, picking existing members from the autocomplete, and choose a role for each row. The <strong>Quick add by role</strong> buttons add a pre-labeled row (Stage Manager, Lighting Designer, and so on), and the bulk box accepts pasted Name, Email, Role lines. Permissions follow the role you pick.</p>`,
        },
        {
          title: "Review and launch",
          body: `<p>On <strong>Review &amp; launch</strong>, check each card (click <strong>Edit</strong> to jump back to any step), then click <strong>Launch production</strong>. If anyone you named is not in your organization yet, a prompt asks for their email so they can be invited; leave a row blank to skip that person. The launch screen confirms your roles, team, and departments, and anyone who could not be added is listed so nothing fails silently.</p>`,
        },
      ],
      tip: `<p>If the AI read fails or you skipped it, nothing is lost: add the cast by hand on the Roles step, or upload the script later from the production's Script tab and run the analysis there. You can also click <strong>Save draft</strong> at any point to park the wizard and keep editing inside the production.</p>`,
      nextSteps: [
        {
          label: "Cast your show on the Cast & Crew board",
          href: "/docs/productions/cast-crew-board",
        },
        {
          label: "Schedule your first rehearsal calls",
          href: "/docs/scheduling/creating-calls",
        },
        {
          label: "See what the AI script read extracts",
          href: "/docs/script/ai-script-analysis",
        },
      ],
      related: [
        {
          label: "How departments shape reports and casting",
          href: "/docs/productions/departments",
        },
        {
          label: "Set up your first production (getting started)",
          href: "/docs/get-started/set-up-your-first-production",
        },
        {
          label: "Invite your company",
          href: "/docs/get-started/invite-your-company",
        },
        {
          label: "Uploading a script",
          href: "/docs/script/uploading-a-script",
        },
      ],
    },
    {
      slug: "cast-crew-board",
      title: "Cast your show on the Cast & Crew board",
      description:
        "How to use the Cast and Crew board in Proscene: drag people onto character slots and team buckets, tap to assign on phones, and invite someone new inline.",
      kind: "how-to",
      intro: `<p>The Cast &amp; Crew board is where you cast characters and build the production team. Your whole company sits on the left; the show's structure sits on the right; you move people left to right.</p>`,
      steps: [
        {
          title: "Open the board",
          body: `<p>Open your production and click the <strong>Cast &amp; Crew</strong> button in the header. The board loads with the <strong>Company</strong> roster (everyone in your organization) on the left and two cards on the right: a <strong>Cast</strong> card of character slots and a <strong>Production team</strong> card. You need manage-productions access (admin or producer) to open it.</p>`,
        },
        {
          title: "Find the person you want to place",
          body: `<p>Use the search box above the roster, or narrow it with the filter chips: <strong>All</strong>, <strong>Unassigned</strong>, <strong>Cast</strong>, <strong>Creative</strong>, <strong>Crew</strong>. People already placed on this show appear dimmed with a tick, so the Unassigned filter is the fastest way to see who is still free.</p>`,
        },
        {
          title: "Drag someone onto a character slot",
          body: `<p>Drag a roster card onto a character's slot; the slot highlights as you hover, and a toast confirms the casting. Each slot holds one performer, and dropping a new person onto a filled slot swaps them in. Casting someone also gives them access to the production.</p>`,
        },
        {
          title: "Fill the Ensemble bucket",
          body: `<p>Below the character slots sits the <strong>Ensemble</strong> bucket, which holds as many people as you drop into it. Drag your ensemble members in one by one; each appears as a chip.</p>`,
        },
        {
          title: "Build the production team",
          body: `<p>The <strong>Production team</strong> card always offers Director, Stage Manager, and Producer buckets, plus one bucket for each of the production's departments (Lighting, Sound, Props, and so on). Drag a person into a bucket and they appear as a chip with that position, with access to match. Which buckets you see is driven by your <a href="/docs/productions/departments">department setup</a>.</p>`,
        },
        {
          title: "Move or remove people",
          body: `<p>Filled slots and chips are draggable too, so you can pull someone straight from Stage Manager to Lighting Designer, or from one character to another, and their old spot clears. The <strong>×</strong> on a character slot uncasts the character but leaves the person on the production; the <strong>×</strong> on a team or ensemble chip removes them from the production entirely.</p>`,
        },
        {
          title: "Assign by tapping on a phone or tablet",
          body: `<p>On smaller screens, drag is replaced by tap-to-assign. A <strong>Casting board</strong> / <strong>Company</strong> toggle switches between the two zones. Tap the <strong>+</strong> on a person to pick a character or team role for them, or tap an empty slot or bucket (they read "Tap to cast" or "Tap to add") to pick a person, with unassigned people listed first.</p>`,
        },
        {
          title: "Invite and cast someone new inline",
          body: `<p>If the performer is not in your organization yet, open the tap-to-cast sheet for their character and choose <strong>+ Invite someone new</strong> (admins only). Enter their name and email and click <strong>Invite &amp; cast</strong>: they get an invitation to join your organization and are cast in the role in one move.</p>`,
        },
      ],
      tip: `<p>Not sure who is who? Click any roster card, filled slot, or chip to open the person drawer, the same one the People directory uses, with their contact details and current assignment. The live Cast and Team counters at the top of the board tell you at a glance how much casting is left.</p>`,
      nextSteps: [
        {
          label: "Understand what each role can see and do",
          href: "/docs/people/roles-and-permissions",
        },
        {
          label: "Schedule calls for your new cast",
          href: "/docs/scheduling/creating-calls",
        },
        {
          label: "Invite the rest of your company",
          href: "/docs/get-started/invite-your-company",
        },
      ],
      related: [
        {
          label: "The New Production setup wizard",
          href: "/docs/productions/setup-wizard",
        },
        {
          label: "Departments and team buckets",
          href: "/docs/productions/departments",
        },
        {
          label: "The people directory",
          href: "/docs/people/people-directory",
        },
        {
          label: "Trouble with invites or access",
          href: "/docs/troubleshooting/invites-and-access",
        },
      ],
    },
    {
      slug: "departments",
      title: "How production departments work",
      description:
        "What production departments do in Proscene: they drive rehearsal report sections and casting board team buckets, plus how to manage them in Settings.",
      kind: "concept",
      intro: `<p>Departments are how a production describes the teams it actually runs on. One list, set per show, decides both what your rehearsal reports ask for and which team buckets appear on the casting board.</p>`,
      blocks: [
        {
          heading: "What departments drive",
          body: `<p>A production's department list feeds two things at once:</p><ul><li><strong>Rehearsal report sections.</strong> Every enabled department gets its own notes section on the report form, so your lighting notes, props notes, and costume notes each land where their team will look. See <a href="/docs/reports/department-notes">department notes</a>.</li><li><strong>Cast &amp; Crew board team buckets.</strong> Each department becomes a drop target on the <a href="/docs/productions/cast-crew-board">casting board</a>, so you can place a person on, say, Sound, and the board reflects the same structure the reports use.</li></ul><p>Director, Stage Manager, and Producer are not departments; they are leadership roles that always have buckets on the board regardless of your department list.</p>`,
        },
        {
          heading: "The 12 standard departments",
          body: `<p>Proscene ships a catalog of 12 standard departments, matching the classic rehearsal report layout:</p><ul><li>Scenery / Set</li><li>Props</li><li>Costumes</li><li>Hair &amp; Makeup</li><li>Lighting</li><li>Sound</li><li>Sound Effects</li><li>Music</li><li>Choreography</li><li>Video / Projection</li><li>Crew</li><li>Other</li></ul><p>A brand-new production that has never picked departments shows all 12 by default. Most shows trim this down: a straight play with no band does not need a Music section on every report.</p>`,
        },
        {
          heading: "Custom departments",
          body: `<p>If your show runs on something the catalog does not cover, add your own: Pyrotechnics, Aerial, Puppetry, Fight, whatever the production demands. A custom department behaves exactly like a standard one; it gets a notes section on every new rehearsal report and its own team bucket on the casting board. You can also rename any department, standard or custom, so the label matches how your company talks.</p>`,
        },
        {
          heading: "Where departments come from",
          body: `<p>The <a href="/docs/productions/setup-wizard">setup wizard</a> seeds the list from its Departments step when you create the show. After that, the production's <strong>Settings</strong> tab is the single place to manage them; changes apply to the report form and the board together. Removing a department never erases notes already written on past reports; those reports keep their sections.</p>`,
        },
      ],
      steps: [
        {
          title: "Open the production's Settings tab",
          body: `<p>Inside the production, click the <strong>Settings</strong> tab. The Departments panel lists the show's current departments in order. The tab only appears for admins and producers.</p>`,
        },
        {
          title: "Edit the list",
          body: `<p>Rename a department by typing in its field, reorder with the up and down arrows, or click <strong>Remove</strong> to drop one. To add, click any button under <strong>Add a standard department</strong>, or type a name under <strong>Add a custom department</strong> and click <strong>Add</strong>.</p>`,
        },
        {
          title: "Save your changes",
          body: `<p>Click <strong>Save departments</strong>. A confirmation appears, and both the Cast &amp; Crew board's team buckets and the sections on new rehearsal reports immediately reflect the new list.</p>`,
        },
      ],
      tip: `<p>Worried about losing history? Removing a department only affects new reports and the board; every note already written on past reports stays exactly where it was.</p>`,
      nextSteps: [
        {
          label: "Write department notes in a rehearsal report",
          href: "/docs/reports/department-notes",
        },
        {
          label: "Create your first rehearsal report",
          href: "/docs/reports/creating-a-rehearsal-report",
        },
        {
          label: "Place people into department buckets",
          href: "/docs/productions/cast-crew-board",
        },
      ],
      related: [
        {
          label: "The New Production setup wizard",
          href: "/docs/productions/setup-wizard",
        },
        {
          label: "Distributing reports to your team",
          href: "/docs/reports/distributing-reports",
        },
        {
          label: "Roles and permissions",
          href: "/docs/people/roles-and-permissions",
        },
      ],
    },
  ],
};
