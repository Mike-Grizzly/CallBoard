import type { DocSection } from "./types";

export const people: DocSection = {
  slug: "people",
  title: "People & roles",
  blurb:
    "Add your whole company once, assign people to any production, and control what each role can see and do.",
  description:
    "Add your company to Proscene once and assign people to any production. Guides to CSV import, the People directory, and roles and permissions.",
  featureHref: "/features#people",
  featureLinkLabel: "See how People works",
  overview: [
    {
      heading: "One directory for your whole company",
      body: `<p>People in Proscene live at the organization level, not inside a single show. You add someone once, in the People directory, and then assign them to as many productions as you need across a season. Their contact info, pronouns, and role travel with them, so casting the next show is an assignment, not a re-entry job.</p>`,
    },
    {
      heading: "Invites are per email address",
      body: `<p>Every person you add gets their own account, invited by email. There are no share links to forward around: you enter (or import) a name and email, Proscene sends that address an invite, and the person sets a password to claim it. Until they do, they show as <strong>Invite pending</strong> in the directory, and you can resend the invite at any time.</p>`,
    },
    {
      heading: "Who manages people",
      body: `<p>The People directory is admin territory: only workspace admins can open the People page, add or invite anyone, edit profiles, or change organization roles. Admins and producers manage production teams (who is assigned to which show). Everyone else meets the company through each production's cast and crew board.</p>`,
    },
  ],
  pages: [
    {
      slug: "importing-cast-csv",
      title: "Import a cast list from a spreadsheet",
      description:
        "Import a cast list from a spreadsheet into Proscene: upload a CSV, map name, email, and role columns, preview, and send invites in one pass.",
      kind: "how-to",
      intro: `<p>Got the season's contact sheet in a spreadsheet? Proscene's CSV import adds a whole company in one pass: upload the file, map your columns, preview the rows, and send everyone an invite. You need to be a workspace admin.</p>`,
      steps: [
        {
          title: "Open the People directory",
          body: `<p>Click <strong>People</strong> in the sidebar. The directory opens with stat cards for total members, active people, pending invites, cast, creative team, and stage management. Only workspace admins see this page; anyone else is sent back to the dashboard.</p>`,
        },
        {
          title: "Click Add people",
          body: `<p>Hit the <strong>Add people</strong> button at the top right. A modal opens with three ways in: <strong>Add a single person</strong>, <strong>Upload a CSV</strong>, and a <strong>Bulk add wizard</strong> for pasted lists.</p>`,
        },
        {
          title: "Choose Upload a CSV and drop your file",
          body: `<p>Pick <strong>Upload a CSV</strong>, then drag your file onto the drop zone or click <strong>Choose file</strong>. Commas, tabs, and semicolons all work; Proscene detects the delimiter for you. The recommended columns are Name, Email, Phone, Role, Pronouns, and Production, and there is a sample CSV link if you want to see the shape first.</p>`,
        },
        {
          title: "Map your columns",
          body: `<p>Proscene auto-guesses which column belongs to which field; confirm or correct each one from the dropdowns. Name and Email are required, everything else is optional, and any column you don't need can be set to ignore. A sample value from your first row appears next to each field so you can sanity-check the mapping.</p>`,
        },
        {
          title: "Preview and fix rows",
          body: `<p>Click <strong>Preview</strong> to see every row with a valid or flagged marker. Rows missing a name or email are excluded automatically. Roles are matched from common names and abbreviations (for example, "SM" and "ASM" both become Stage Manager); anything unrecognized defaults to Cast, which you can change later. The Production column is matched by title to your existing productions; a "(no match)" note means that person imports without a production assignment.</p>`,
        },
        {
          title: "Decide whether to send invites now",
          body: `<p>The <strong>Send invite emails</strong> checkbox is on by default, so every valid person receives an email at their address with a link to set a password and sign in. Uncheck it if you just want them in the directory without emailing anyone yet.</p>`,
        },
        {
          title: "Import the list",
          body: `<p>Click <strong>Add</strong> to run the import. You get a summary of what happened: how many were invited, how many existing accounts were added to your organization, how many were skipped because they were already in your org, and any failures. Duplicate emails inside the file are deduped automatically.</p>`,
        },
        {
          title: "Watch for pending invites",
          body: `<p>Imported people appear in the directory with <strong>Invite pending</strong> status until they accept and sign in for the first time, at which point they flip to <strong>Active</strong>. Click the <strong>Pending invites</strong> stat card to see who is still outstanding, and resend from there if needed.</p>`,
        },
      ],
      tip: `<p>If your list lives in an email or a document instead of a spreadsheet, use the <strong>Bulk add wizard</strong>: paste one person per line, either as <strong>Name &lt;email&gt;</strong> or comma-separated name, email, phone, then apply one default role and production to the whole batch.</p>`,
      nextSteps: [
        {
          label: "Assign people to productions in the directory",
          href: "/docs/people/people-directory",
        },
        {
          label: "Build your cast & crew board",
          href: "/docs/productions/cast-crew-board",
        },
        {
          label: "Understand roles and permissions",
          href: "/docs/people/roles-and-permissions",
        },
      ],
      related: [
        {
          label: "Invite your company",
          href: "/docs/get-started/invite-your-company",
        },
        {
          label: "Fix invite and access problems",
          href: "/docs/troubleshooting/invites-and-access",
        },
        {
          label: "The production setup wizard",
          href: "/docs/productions/setup-wizard",
        },
        {
          label: "Creating rehearsal calls",
          href: "/docs/scheduling/creating-calls",
        },
      ],
    },
    {
      slug: "roles-and-permissions",
      title: "Roles and permissions in Proscene",
      description:
        "How roles and permissions work in Proscene: what each of the 8 roles can do, plus how organization roles differ from production membership.",
      kind: "concept",
      intro: `<p>Proscene has eight roles and one rule that explains most of the system: your organization role decides <strong>what</strong> you can do, and production membership decides <strong>where</strong> you can do it.</p>`,
      blocks: [
        {
          heading: "Org role vs production membership",
          body: `<p>Everyone in your workspace has exactly one organization role, set by an admin in the People directory. That role is the single source of their permissions everywhere in Proscene.</p>
<p>Separately, each person is assigned to specific productions. A production assignment carries its own role label and an optional character name, which is how someone shows up on that show's cast and crew board, but it does not change what they are allowed to do. A stage manager assigned to two shows can write reports on both; a cast member assigned to five shows still cannot write reports on any of them.</p>
<p>Admins and producers are the exception to the "where" rule: because they manage productions, they can open every production in the organization without an explicit assignment. Everyone else only sees productions they have been assigned to.</p>`,
        },
        {
          heading: "The eight roles at a glance",
          body: `<p>The People directory shows each role's access tier in a read-only Permission column: Admin, Editor, or Viewer. Here is what each role means in practice.</p>
<table>
  <thead>
    <tr><th>Role</th><th>Tier</th><th>In practice</th></tr>
  </thead>
  <tbody>
    <tr><td>Admin</td><td>Admin</td><td>Runs the workspace. Full access everywhere, including workspace settings and the People directory. The only role that can invite people or change roles.</td></tr>
    <tr><td>Producer</td><td>Admin</td><td>Everything an admin can do inside productions, including creating shows, managing teams, and deleting reports, but no workspace settings or People directory.</td></tr>
    <tr><td>Director</td><td>Editor</td><td>Full working access on assigned shows: reports, calls, blocking, uploads, and note tags, plus posting announcements.</td></tr>
    <tr><td>Choreographer</td><td>Editor</td><td>Same working access as a director, minus announcements and note tag management.</td></tr>
    <tr><td>Creative</td><td>Editor</td><td>For designers and the wider creative team. Identical access to a choreographer.</td></tr>
    <tr><td>Stage Manager</td><td>Editor</td><td>Reports, calls, blocking, uploads, and note tag management on assigned shows. Cannot post announcements.</td></tr>
    <tr><td>Cast</td><td>Viewer</td><td>Sees distributed reports, documents, video, announcements, and blocking on assigned shows; writes notes and confirms their own calls.</td></tr>
    <tr><td>Crew</td><td>Viewer</td><td>Same access as cast.</td></tr>
  </tbody>
</table>`,
        },
        {
          heading: "What each role can do",
          body: `<p>Grouped into plain terms, here is the full capability picture.</p>
<table>
  <thead>
    <tr><th>What you can do</th><th>Who can do it</th></tr>
  </thead>
  <tbody>
    <tr><td>View productions, reports, documents, video, announcements, and blocking</td><td>Everyone on the show</td></tr>
    <tr><td>Write notes and confirm your own calls</td><td>Everyone on the show</td></tr>
    <tr><td>Write rehearsal reports and schedule calls</td><td>Admin, Producer, Director, Choreographer, Creative, Stage Manager</td></tr>
    <tr><td>Upload documents and rehearsal video</td><td>Admin, Producer, Director, Choreographer, Creative, Stage Manager</td></tr>
    <tr><td>Edit blocking and stage setup</td><td>Admin, Producer, Director, Choreographer, Creative, Stage Manager</td></tr>
    <tr><td>Post announcements</td><td>Admin, Producer, Director</td></tr>
    <tr><td>Manage note tags</td><td>Admin, Producer, Director, Stage Manager</td></tr>
    <tr><td>Create productions, manage teams and casting, delete reports</td><td>Admin, Producer</td></tr>
    <tr><td>Workspace settings, inviting people, changing roles</td><td>Admin only</td></tr>
  </tbody>
</table>
<p>One nuance worth knowing: draft rehearsal reports are visible only to the roles that can write them. Cast and crew see a report once it has been distributed, never before.</p>`,
        },
        {
          heading: "Guardrails built into the system",
          body: `<ul>
<li><strong>You cannot change your own role.</strong> Another admin has to do it, which keeps a lone admin from accidentally locking themselves out.</li>
<li><strong>The last admin is protected.</strong> Proscene refuses to demote or remove the only remaining admin; promote someone else first.</li>
<li><strong>Role changes are immediate.</strong> There is no re-invite step; the person's access updates the next time they load a page.</li>
<li><strong>Permission checks run on the server.</strong> The interface hides what you cannot do, and the server enforces it independently.</li>
</ul>`,
        },
      ],
      tip: `<p>If someone can't open a production, the fix is usually membership, not role: assign them to that production from the People directory or the cast &amp; crew board.</p>`,
      nextSteps: [
        {
          label: "Invite your company",
          href: "/docs/get-started/invite-your-company",
        },
        {
          label: "Add people in bulk from a spreadsheet",
          href: "/docs/people/importing-cast-csv",
        },
        {
          label: "Manage people in the directory",
          href: "/docs/people/people-directory",
        },
      ],
      related: [
        {
          label: "The cast & crew board",
          href: "/docs/productions/cast-crew-board",
        },
        {
          label: "Distributing rehearsal reports",
          href: "/docs/reports/distributing-reports",
        },
        {
          label: "Fix invite and access problems",
          href: "/docs/troubleshooting/invites-and-access",
        },
      ],
    },
    {
      slug: "people-directory",
      title: "Manage people in the People directory",
      description:
        "How to use the People directory in Proscene: search and filter your company, edit contact info, resend invites, and assign people to productions.",
      kind: "how-to",
      intro: `<p>The People page is the admin's home base for the whole company: search it, keep contact details current, chase pending invites, and put anyone on a production in a couple of clicks.</p>`,
      steps: [
        {
          title: "Open the People directory",
          body: `<p>Click <strong>People</strong> in the sidebar. You land on the full company directory; the stat cards along the top show totals for active members, pending invites, cast, creative team, and stage management. This page is admin-only.</p>`,
        },
        {
          title: "Search and filter",
          body: `<p>Type in the search box to match a name, email, or role, or narrow the list with the category, production, and status dropdowns. The stat cards double as one-click filters (click <strong>Pending invites</strong> to see only unaccepted invites), and you can switch between the table and card views with the toggle on the right.</p>`,
        },
        {
          title: "Open someone's profile",
          body: `<p>Click a person to open their drawer. You get their contact info (email and phone, with a <strong>Message</strong> button that opens your mail app), pronouns, status, permission tier, member since date, last active time, and a list of every production they are assigned to.</p>`,
        },
        {
          title: "Edit contact details",
          body: `<p>Click <strong>Edit</strong> in the drawer to change their first and last name, phone, and pronouns, then hit <strong>Save</strong>. The drawer confirms with "Profile updated."</p>`,
        },
        {
          title: "Change an organization role",
          body: `<p>Use the <strong>Organization role</strong> dropdown in the drawer. The change takes effect immediately across every production. You cannot change your own role, and Proscene will refuse to demote the workspace's only admin until another one exists.</p>`,
        },
        {
          title: "Resend an invite",
          body: `<p>For anyone still showing <strong>Invite pending</strong>, click <strong>Resend invite</strong> in their drawer to send a fresh email. To chase several at once, select their rows with the checkboxes and use <strong>Resend invite</strong> in the selection bar; only people with pending invites get one.</p>`,
        },
        {
          title: "Assign people to a production",
          body: `<p>Click <strong>Assign</strong> in a person's drawer, or select multiple rows and choose <strong>Assign to production</strong>. Pick the production, the person's role within it, and (for cast) an optional character name. The assignment appears in their drawer and on that production's team immediately.</p>`,
        },
        {
          title: "Deactivate or remove someone",
          body: `<p>In the drawer, <strong>Deactivate</strong> marks a person inactive but keeps their profile and history, and you can reactivate them anytime. <strong>Remove from org</strong> takes them out of your organization. <strong>Delete account</strong> is permanent and removes their account along with the reports, documents, and notes they created, so Proscene asks you to confirm first.</p>`,
        },
      ],
      tip: `<p>Need a contact sheet for the callboard? The <strong>Export</strong> button downloads the whole directory as a CSV, and <strong>Export selected</strong> does the same for just the rows you have checked.</p>`,
      nextSteps: [
        {
          label: "Build your cast & crew board",
          href: "/docs/productions/cast-crew-board",
        },
        {
          label: "Schedule your first calls",
          href: "/docs/scheduling/creating-calls",
        },
        {
          label: "Distribute a rehearsal report",
          href: "/docs/reports/distributing-reports",
        },
      ],
      related: [
        {
          label: "Import a cast list from a spreadsheet",
          href: "/docs/people/importing-cast-csv",
        },
        {
          label: "Roles and permissions in Proscene",
          href: "/docs/people/roles-and-permissions",
        },
        {
          label: "Fix invite and access problems",
          href: "/docs/troubleshooting/invites-and-access",
        },
        {
          label: "Invite your company",
          href: "/docs/get-started/invite-your-company",
        },
      ],
    },
  ],
};
