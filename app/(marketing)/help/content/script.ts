import type { DocSection } from "./types";

export const script: DocSection = {
  slug: "script",
  title: "Script",
  blurb:
    "Upload your script once, mark up your own copy, run the AI breakdown, and build exportable cue sheets.",
  description:
    "How the Script tab works in Proscene: upload a script PDF, run AI script analysis, keep personal annotations, and export cue sheets.",
  featureHref: "/features#script",
  overview: [
    {
      heading: "What the Script tab is for",
      body: `<p>The Script tab is the production's shared reading copy. One PDF is set as the default script, and everyone on the production opens that same file, page by page, with reading tools (thumbnails, zoom, page jump, a distraction-free read mode) and markup tools (highlights, notes, cues, bookmarks). It is also home to the AI breakdown that can seed your cast list, scene list, and bookmarks from the script itself.</p>`,
    },
    {
      heading: "Personal markup, shared breakdown",
      body: `<p>Everything you draw on the script is yours alone. Highlights, notes, cue markers, and bookmarks are stored per person, so the lighting designer's cues, the stage manager's calling script, and an actor's highlights never collide. Nobody else sees your marks, and your annotated PDF export only contains your own layer.</p><p>The AI breakdown is the exception by design: when a manager applies an analysis, the cast list and scene breakdown become shared production data, and the AI's scene and song bookmarks are seeded into every member's personal bookmark set as a starting point. You can rename or remove those bookmarks in your own copy without affecting anyone else.</p>`,
    },
    {
      heading: "Who can do what",
      body: `<p>Anyone with access to the production can read the script and make their own annotations, cues, and bookmarks. Managing the script itself takes a role with document upload rights: admins, producers, directors, choreographers, creatives, and stage managers can upload scripts, choose the default script, run and apply the AI analysis, make a scanned script searchable, and drag cue labels into custom positions. Cast and crew read and mark up their own copy only. See <a href="/help/people/roles-and-permissions">roles and permissions</a> for the full breakdown.</p>`,
    },
  ],
  pages: [
    {
      slug: "uploading-a-script",
      title: "How to upload a script to your production",
      description:
        "Upload a script PDF in Proscene from the production setup wizard or the Documents tab, set it as the default script, and handle scanned PDFs.",
      kind: "how-to",
      intro: `<p>There are two ways to get a script into Proscene: during the new-production wizard, or from the Documents tab of an existing production. This page covers both, plus what happens when your script is a scan.</p>`,
      steps: [
        {
          title: "Upload during production setup (new shows)",
          body: `<p>On the wizard's <strong>Cast list &amp; characters</strong> step, drag your script PDF onto the dropzone or click <strong>Upload script &amp; auto-fill</strong>. The file uploads right away and becomes the production's default script when you launch, so you never re-upload it.</p>`,
        },
        {
          title: "Decide whether AI reads the cast",
          body: `<p>The <strong>Auto-fill cast from this script</strong> checkbox is on by default: AI reads the PDF and drops the characters into your editable roles list a minute or two later. Untick it to opt out. The script still uploads and becomes your default script, and you can run the AI read any time later from the Script tab.</p>`,
        },
        {
          title: "Or upload from the Documents tab (existing shows)",
          body: `<p>In your production, open <strong>Documents</strong> and upload the PDF, setting its document type to <strong>Script</strong>. It appears in the document list like any other file. Uploading here never runs AI automatically; analysis is a separate, manual action.</p>`,
        },
        {
          title: "Set it as the default script",
          body: `<p>Open the script row's options menu (the three-dot button) and choose <strong>Set as default script</strong>. The Script tab now opens this file for everyone on the production. If you upload a revised draft later, set the new file as default the same way.</p>`,
        },
        {
          title: "Let Proscene handle scanned PDFs",
          body: `<p>If the file is a scan or photocopy with no real text layer, Proscene detects it and offers <strong>Make searchable</strong>, both right after a single script upload and as a banner on the Script tab. It OCRs every page in your browser (a few minutes for a full script) and installs a searchable copy as the new default script, keeping the original. Until then, text tools like select, find, and text highlighting stay off.</p>`,
        },
        {
          title: "Open the Script tab to confirm",
          body: `<p>Go to the production's <strong>Script</strong> tab. Your PDF should render with the tool sidebar on the left and the toolbar along the top. If you see "No script uploaded yet", no document is marked as the default script yet; go back to step 4.</p>`,
        },
      ],
      tip: `<p>Scripts that arrive as photos or images (JPEG, PNG) work too: upload them in Documents as type Script and Proscene rebuilds them into a searchable PDF. If a scan will not display at all, the Script tab falls back to your browser's built-in viewer and offers the same Make searchable fix.</p>`,
      nextSteps: [
        { label: "Run the AI script analysis", href: "/help/script/ai-script-analysis" },
        { label: "Start marking up your copy", href: "/help/script/annotations-and-highlights" },
        { label: "The production setup wizard", href: "/help/productions/setup-wizard" },
      ],
      related: [
        { label: "Placing cue markers", href: "/help/script/cue-markers" },
        { label: "Script upload issues", href: "/help/troubleshooting/script-upload-issues" },
        { label: "Roles and permissions", href: "/help/people/roles-and-permissions" },
        { label: "Setting up your ground plan", href: "/help/blocking/setting-up-your-ground-plan" },
      ],
    },
    {
      slug: "ai-script-analysis",
      title: "How to run AI script analysis",
      description:
        "Run AI script analysis in Proscene to detect characters, scenes, and bookmarks from a script PDF, then review and apply them to your production.",
      kind: "how-to",
      intro: `<p>AI script analysis reads your uploaded script and proposes three things: a cast list with each character's prominence, an act and scene breakdown, and page bookmarks for scenes and musical numbers. Nothing touches your production until a human reviews and applies it.</p>`,
      steps: [
        {
          title: "Start the analysis from Documents",
          body: `<p>In the <strong>Documents</strong> tab, open your script's options menu and choose <strong>Analyze with AI</strong>. You land on the <strong>AI Script Setup</strong> page, which shows "Analyzing your script…" while it runs. A full script takes a minute or two; you can leave the page and you will get a notification when it is ready.</p>`,
        },
        {
          title: "Review the cast and characters",
          body: `<p>The <strong>Cast &amp; characters</strong> card lists every detected character with a type of Principal, Supporting, or Ensemble. Rename characters, change their type, delete rows, or add ones the AI missed. The type is the model's estimate, so correct it where it guessed wrong.</p>`,
        },
        {
          title: "Review the scene breakdown and bookmarks",
          body: `<p>The <strong>Scene breakdown</strong> card holds the act and scene list that will feed the blocking tool, and the <strong>Bookmarks</strong> card groups page markers into Scenes and Songs. Edit titles, fix pages, or remove anything spurious. On scanned scripts, bookmark pages are best-effort estimates; cast and scenes are unaffected.</p>`,
        },
        {
          title: "Refine with notes if something is off",
          body: `<p>Use the <strong>Not quite right?</strong> box: type what was wrong (for example, "Act 2 scenes are missing") and click <strong>Re-analyze with notes</strong>. It re-runs on the same file, no re-upload needed, feeding your notes and the previous result back for a targeted revision.</p>`,
        },
        {
          title: "Apply it to the production",
          body: `<p>Click <strong>Apply to production</strong>. The cast list and scene breakdown are written to the production, and the scene and song bookmarks are added to every member's script. Or click <strong>Discard</strong> to throw the proposal away; you can run it again later.</p>`,
        },
        {
          title: "Cast actors from the parsed list",
          body: `<p>From the applied screen, click <strong>Assign actors</strong> to open the Cast &amp; Crew page, where each parsed character can be cast with a real person. See the <a href="/help/productions/cast-crew-board">cast and crew board</a> for how casting works.</p>`,
        },
        {
          title: "Come back and refine any time",
          body: `<p>The Script tab's toolbar has an <strong>AI setup</strong> link (visible to script managers) that returns to this page. Re-analyzing after applying refreshes the AI's cast, scenes, and bookmarks while keeping hand-added roles, blocked scenes, casting assignments, and your own bookmarks.</p>`,
        },
      ],
      tip: `<p>Each production gets 5 analyses per rolling 30 days; the "analyses left" pill on the AI Script Setup page shows where you stand. Results vary with formatting: modern scripts with clearly labelled songs and scene headings read best, and if someone has already applied an analysis of the identical licensed PDF, you may get an instant result with no AI run at all.</p>`,
      nextSteps: [
        { label: "Mark up your script", href: "/help/script/annotations-and-highlights" },
        { label: "Capture blocking against the scene list", href: "/help/blocking/capturing-blocking-beats" },
        { label: "The cast and crew board", href: "/help/productions/cast-crew-board" },
      ],
      related: [
        { label: "Uploading a script", href: "/help/script/uploading-a-script" },
        { label: "Cue markers and cue sheets", href: "/help/script/cue-markers" },
        { label: "Roles and permissions", href: "/help/people/roles-and-permissions" },
        { label: "Script upload issues", href: "/help/troubleshooting/script-upload-issues" },
      ],
    },
    {
      slug: "annotations-and-highlights",
      title: "How to annotate and highlight your script",
      description:
        "Read your script in Proscene and add personal highlights, notes, and bookmarks. Annotations are private to you and export to an annotated PDF.",
      kind: "how-to",
      intro: `<p>Every member gets their own markup layer on the shared script: highlights, sticky notes, and bookmarks that nobody else can see. This page covers reading and marking up on desktop and phone.</p>`,
      steps: [
        {
          title: "Open the script",
          body: `<p>Go to the production's <strong>Script</strong> tab. The default script renders with a tool sidebar on the left, a toolbar on top (page navigation, zoom, fit, read mode), and an annotations panel on the right listing your marks on the current page.</p>`,
        },
        {
          title: "Highlight text or draw a highlight box",
          body: `<p>Pick <strong>Highlight (text select)</strong> to select words like in any PDF reader, or <strong>Highlight (draw)</strong> to drag a box over any area. Choose from five colors (Yellow, Green, Blue, Pink, Coral). Text-selection highlights hug each line of a multi-line selection.</p>`,
        },
        {
          title: "Add a sticky note",
          body: `<p>Pick the <strong>Note</strong> tool and drag a box where you want it, then type your text. The note renders as a readable text box right on the page and also appears in the Notes section of the right-hand panel, where you can edit it inline.</p>`,
        },
        {
          title: "Bookmark pages",
          body: `<p>Click <strong>Bookmark</strong> in the toolbar to label the current page. The bookmarks panel lists everything, searchable by title or page number, with Scene and Song tags on markers that came from the AI breakdown. Bookmarks are personal, so renaming or deleting one only changes your copy.</p>`,
        },
        {
          title: "Use read mode or the phone reader",
          body: `<p>Click <strong>Read mode</strong> for a distraction-free, scrolling view. On a phone, the Script tab opens a mobile reader automatically, with page thumbnails, bookmarks, and a freehand palette (highlighter, pen, eraser) for marking up by hand. Desktop-drawn annotations show read-only on the phone.</p>`,
        },
        {
          title: "Let it save itself",
          body: `<p>There is no save button: annotations and bookmarks save automatically to your personal layer as you work. Reopen the script on any device and your markup is there.</p>`,
        },
        {
          title: "Export your annotated PDF",
          body: `<p>Click <strong>Download PDF</strong> in the toolbar to export the script with your highlights, notes, and cues drawn onto every page, ready to print for the tech table or share outside the app.</p>`,
        },
      ],
      tip: `<p>If the annotation tools look disabled, your script is probably a scan with no text layer. Ask a script manager to run <strong>Make searchable</strong> from the banner on the Script tab; once it finishes, select, find, and the text tools switch on for the whole production.</p>`,
      nextSteps: [
        { label: "Place cue markers", href: "/help/script/cue-markers" },
        { label: "Run the AI script analysis", href: "/help/script/ai-script-analysis" },
        { label: "Your first rehearsal", href: "/help/get-started/your-first-rehearsal" },
      ],
      related: [
        { label: "Uploading a script", href: "/help/script/uploading-a-script" },
        { label: "Script upload issues", href: "/help/troubleshooting/script-upload-issues" },
        { label: "Capturing blocking beats", href: "/help/blocking/capturing-blocking-beats" },
        { label: "Creating a rehearsal report", href: "/help/reports/creating-a-rehearsal-report" },
      ],
    },
    {
      slug: "cue-markers",
      title: "How to place cue markers and export a cue sheet",
      description:
        "Place numbered cue markers on your script in Proscene with the box or pipe tool, drag labels into place, and export a cue sheet as CSV or PDF.",
      kind: "how-to",
      intro: `<p>The Cue tool turns your script into a calling script: numbered cue markers anchored to the exact word, with labels in the margin and a spreadsheet cue sheet you can export. Cues live in your personal layer, so your book stays yours.</p>`,
      steps: [
        {
          title: "Pick the Cue tool and set its options",
          body: `<p>Select <strong>Cue</strong> in the tool sidebar. Options appear beneath it: a <strong>Style</strong> toggle (Box or Pipe), a <strong>Margin</strong> toggle for which side the label leader runs to, and a <strong>Color</strong> palette (Black, Red, Blue, Green, Amber, Purple, Pink), handy for separating departments like lights and sound. The last color you pick sticks for new cues.</p>`,
        },
        {
          title: "Drop a pipe marker on the exact word",
          body: `<p>With <strong>Pipe</strong> style, click between two words or at a line end. A clean vertical line drops in, snapped to the height of that text line, and the surrounding words are captured with a marker at the pipe's position, so the cue sheet later shows exactly where the cue is called.</p>`,
        },
        {
          title: "Or draw a box around words or lines",
          body: `<p>With <strong>Box</strong> style, drag a rectangle around the words or lines the cue covers. The text under the box is captured as the cue's line the same way.</p>`,
        },
        {
          title: "Number and describe the cue",
          body: `<p>A popover asks for the <strong>Cue number</strong> (point cues like 12.5 are fine, and prefixes like LX 4 or SFX 4 work too) and a <strong>Description</strong> (for example, "Sound: doorbell"). Confirm and the cue's label appears in the margin with a leader line back to its anchor.</p>`,
        },
        {
          title: "Drag labels where you want them",
          body: `<p>Labels auto-stack in the margin in cue-number order, but on desktop a script manager can drag any cue's number to place it exactly, and the right-angle leader follows. Use <strong>Reset label position</strong> in the cue's edit panel to return it to auto-placement, and the label-size sliders in the right panel to tune number and description text size.</p>`,
        },
        {
          title: "Work in the cue sheet view",
          body: `<p>Click <strong>Cue sheet</strong> in the toolbar to swap to a spreadsheet of every cue, grouped under scene and song headings from your bookmarks and ordered by position in the script. Edit the Cue and Note columns inline, and click a row's arrow to jump to that spot in the script.</p>`,
        },
        {
          title: "Export the cue sheet as CSV",
          body: `<p>In the cue sheet header, click <strong>Export CSV</strong>. You get a spreadsheet file with Cue, Line, and Page columns plus scene divider rows, ready for a paper backup or a console operator.</p>`,
        },
        {
          title: "Export the annotated script",
          body: `<p>Back in script view, click <strong>Download PDF</strong> to export the full script with your cue pipes, boxes, leader lines, and margin labels drawn on every page, honoring any labels you dragged.</p>`,
        },
      ],
      tip: `<p>Cues are per-user, like all script markup: the lighting designer, sound designer, and stage manager can each build their own cue book on the same script without stepping on each other. If you need one combined document, one person should own the calling script and place all departments' cues in their own layer, color-coded.</p>`,
      nextSteps: [
        { label: "Annotations and highlights", href: "/help/script/annotations-and-highlights" },
        { label: "Capturing blocking beats", href: "/help/blocking/capturing-blocking-beats" },
        { label: "Department notes in reports", href: "/help/reports/department-notes" },
      ],
      related: [
        { label: "Uploading a script", href: "/help/script/uploading-a-script" },
        { label: "AI script analysis", href: "/help/script/ai-script-analysis" },
        { label: "Roles and permissions", href: "/help/people/roles-and-permissions" },
        { label: "Script upload issues", href: "/help/troubleshooting/script-upload-issues" },
      ],
    },
  ],
};
