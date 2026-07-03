import type { DocSection } from "./types";

export const blocking: DocSection = {
  slug: "blocking",
  title: "Blocking",
  blurb:
    "A digital ground plan and a beat-by-beat record of the staging, kept live for the whole company.",
  description:
    "Set up a digital ground plan and record blocking beat by beat in Proscene, with movement arrows, beat notes, and comments for the whole company.",
  featureHref: "/features#blocking",
  featureLinkLabel: "See the blocking tool",
  overview: [
    {
      heading: "Pencil notation, without the pencil",
      body: `<p>The blocking tool is a digital ground plan plus a beat-by-beat record of where everyone stands. Instead of hieroglyphics in the margin of a prompt book, each beat stores real positions on a calibrated stage: performer tokens, set pieces, and movement arrows you can replay in order. When the director changes a cross on Tuesday, the whole company sees the new picture on Wednesday, and nobody is squinting at an eraser smudge.</p>`,
    },
    {
      heading: "Who can edit, who can view",
      body: `<p>Everyone on a production can open the Blocking tab and step through beats. Editing, which covers stage setup, placing performers, capturing beats, arrows, and notes, is limited to admins, producers, directors, choreographers, creative team members, and stage managers. Cast and crew get a live, view-only copy, including on their phones. See <a href="/help/people/roles-and-permissions">roles and permissions</a> for the full breakdown.</p>`,
    },
    {
      heading: "What you need before you start",
      body: `<p>Two things make blocking sing: cast assigned on the <a href="/help/productions/cast-crew-board">cast and crew board</a>, since performer tokens pull names and characters from there, and a ground plan PDF uploaded to the production's documents. Neither is strictly required. Proscene will happily give you a blank stage and a seeded first scene and beat so you can start dragging right away.</p>`,
    },
  ],
  pages: [
    {
      slug: "setting-up-your-ground-plan",
      title: "Set up your ground plan",
      description:
        "How to set up your ground plan in Proscene: pick a stage PDF, enter dimensions, calibrate the scale, and build a set piece palette for blocking.",
      kind: "how-to",
      intro: `<p>Before you block anything, teach Proscene what your stage looks like. This page walks editors through the Stage Setup wizard and the set piece palette.</p>`,
      steps: [
        {
          title: "Open the Blocking tab",
          body: `<p>From your production, open <strong>Blocking</strong>. The first time an editor opens it on a production with no stage saved, Proscene sends you straight to <strong>Stage Setup</strong>. You can reopen it any time with the <strong>Stage Setup</strong> button in the blocking toolbar.</p>`,
        },
        {
          title: "Pick a ground plan PDF (optional)",
          body: `<p>If you have a scale drawing of your venue, upload the PDF to the production's documents first, then choose it from the <strong>Ground Plan PDF</strong> dropdown. No drawing yet? Leave it on <strong>No ground plan</strong> and you get a clean canvas instead.</p>`,
        },
        {
          title: "Enter your stage dimensions",
          body: `<p>Fill in <strong>Proscenium Width (ft)</strong> and <strong>Stage Depth (ft)</strong>, then click <strong>Next: Calibrate</strong>. If you skipped the PDF, the button reads <strong>Save &amp; Continue</strong> and there is nothing to calibrate; just save on the next screen.</p>`,
        },
        {
          title: "Calibrate the scale",
          body: `<p>Click the <strong>Stage Right</strong> edge of the proscenium opening on your drawing, then the <strong>Stage Left</strong> edge. Proscene shows the scale it worked out in feet per pixel; click anywhere to reset the points and try again. If your PDF has several pages, pick the right page from the page row first.</p>`,
        },
        {
          title: "Save the stage setup",
          body: `<p>Click <strong>Save Stage Setup</strong>. Proscene snapshots the calibrated page as the canvas background, so the plan loads fast on every device, and returns you to the blocking canvas.</p>`,
        },
        {
          title: "Turn on the grid",
          body: `<p>Once the stage is calibrated, the canvas toolbar gains two toggles: <strong>SL/SR</strong> for stage left and right grid lines, and <strong>US/DS</strong> for upstage and downstage lines. Lines land every two feet with foot markings along the proscenium line, so a note like ten feet stage left means the same thing to everyone.</p>`,
        },
        {
          title: "Build your set piece palette",
          body: `<p>Open the <strong>Set Pieces</strong> panel on the right of the canvas. Click <strong>Upload custom piece</strong> to add a PNG or JPEG of your own furniture (under 5 MB), or open the <strong>Basic shapes</strong> disclosure for built-ins: chairs, couches, tables, beds, a desk, stairs, a door, a window, a grand piano, a podium, and platforms. Click a piece to place it center stage, drag it into position, and drag the small corner handle to rotate it.</p>`,
        },
      ],
      tip: `<p>Not seeing the <strong>SL/SR</strong> and <strong>US/DS</strong> buttons? They only appear once the stage is calibrated. Reopen <strong>Stage Setup</strong> and, if you already saved a plan, use <strong>Recalibrate Only</strong> to redo just the two proscenium clicks.</p>`,
      nextSteps: [
        {
          label: "Capture your first blocking beats",
          href: "/help/blocking/capturing-blocking-beats",
        },
        {
          label: "Get your cast onto the board",
          href: "/help/people/importing-cast-csv",
        },
        {
          label: "Upload the script",
          href: "/help/script/uploading-a-script",
        },
      ],
      related: [
        {
          label: "The production setup wizard",
          href: "/help/productions/setup-wizard",
        },
        {
          label: "Cast and crew board",
          href: "/help/productions/cast-crew-board",
        },
        {
          label: "AI script analysis can seed your scene list",
          href: "/help/script/ai-script-analysis",
        },
        {
          label: "Roles and permissions",
          href: "/help/people/roles-and-permissions",
        },
      ],
    },
    {
      slug: "capturing-blocking-beats",
      title: "Capture blocking beat by beat",
      description:
        "How to capture blocking beat by beat in Proscene: place performers on the ground plan, capture beats, draw movement arrows, and comment with mentions.",
      kind: "how-to",
      intro: `<p>A beat is one stage picture: where everyone is at a given moment. This page shows editors how to record a scene as a chain of beats, then annotate the movement between them.</p>`,
      steps: [
        {
          title: "Select or create a beat",
          body: `<p>In the <strong>Scenes</strong> panel on the left, click a beat to load it onto the canvas. Click <strong>Add scene</strong> to create a scene with a title, act, and scene number, and hover a scene to reveal <strong>Add beat</strong>. On a fresh production Proscene seeds a first scene and beat automatically, so editors land on a canvas that is ready to drag onto.</p>`,
        },
        {
          title: "Place your performers",
          body: `<p>Drag a name from the <strong>Off stage</strong> list onto the stage, or click it to drop the token center stage. Each performer appears as a colored circle with their initials, labeled with their character name from the cast board. Every move saves automatically to the selected beat.</p>`,
        },
        {
          title: "Arrange the set",
          body: `<p>Use the layer switch in the toolbar to flip between <strong>Set Pieces</strong> and <strong>Actors</strong>. Only tokens on the active layer respond to dragging, so you never nudge the couch while repositioning the cast. Drag pieces into place and rotate them with the corner handle.</p>`,
        },
        {
          title: "Capture the next beat",
          body: `<p>When the picture is right, click <strong>Capture Beat</strong>. Proscene saves the current positions and creates the next beat in the scene with everyone starting exactly where they just ended, so you only move the people who move.</p>`,
        },
        {
          title: "Review the movement",
          body: `<p>Toggle <strong>Movement</strong> in the toolbar to draw arrows from each performer's position in this beat to where they stand in the next one. It is the fastest way to sanity-check a crossing pattern before you run it.</p>`,
        },
        {
          title: "Draw your own arrows",
          body: `<p>Click <strong>Draw Arrow</strong>, then click once on the canvas to start the arrow and once to finish it; press Esc to cancel. Custom arrows are saved with the beat, and hovering one reveals a delete button if you change your mind.</p>`,
        },
        {
          title: "Jot beat notes",
          body: `<p>Open the <strong>Beat Notes</strong> panel on the right for notes that belong to this exact moment: motivation, a cue that lands here, a reminder to revisit the picture. Notes save with the beat and travel with it.</p>`,
        },
        {
          title: "Discuss with @ mentions",
          body: `<p>Open <strong>Beat Comments</strong>, write your note, and type @ to mention a teammate. Press Enter to send. Mentioned people get a notification that links straight back to this beat, so a note about a new cross arrives with the diagram attached.</p>`,
        },
      ],
      tip: `<p>Dragged a token and nothing moved? Check the layer switch: only the active layer (<strong>Set Pieces</strong> or <strong>Actors</strong>) is draggable. And <strong>Undo</strong> in the toolbar reverses your last move if a drag lands somewhere odd.</p>`,
      blocks: [
        {
          heading: "Moving groups together",
          body: `<p>To shift a clump of performers as one, drag a box across an empty patch of stage to lasso them. The toolbar shows how many are selected, and dragging any one of them moves the whole group. Click empty canvas to clear the selection.</p>`,
        },
      ],
      nextSteps: [
        {
          label: "Present blocking in Focus mode",
          href: "/help/blocking/presenting-blocking-in-focus-mode",
        },
        {
          label: "Write up the rehearsal report",
          href: "/help/reports/creating-a-rehearsal-report",
        },
        {
          label: "Set up your ground plan",
          href: "/help/blocking/setting-up-your-ground-plan",
        },
      ],
      related: [
        {
          label: "Cast and crew board",
          href: "/help/productions/cast-crew-board",
        },
        {
          label: "Script annotations and highlights",
          href: "/help/script/annotations-and-highlights",
        },
        {
          label: "Not getting mention notifications?",
          href: "/help/troubleshooting/notifications",
        },
        {
          label: "Department notes in reports",
          href: "/help/reports/department-notes",
        },
      ],
    },
    {
      slug: "presenting-blocking-in-focus-mode",
      title: "Present blocking in Focus mode",
      description:
        "How to present blocking in Focus mode: a full screen view for walking beats with the cast, showing movement arrows, and exporting a beat as a PNG.",
      kind: "how-to",
      intro: `<p>Focus mode strips away the rest of the app and gives the blocking tool the whole screen. It is built for the table: talking a scene through with a designer, or replaying staging for the room.</p>`,
      steps: [
        {
          title: "Open Focus mode",
          body: `<p>On the <strong>Blocking</strong> tab, click <strong>Focus mode</strong> in the production toolbar. The navigation drops away and the tool fills the screen: just the show title, a Script/Blocking switch, and the stage.</p>`,
        },
        {
          title: "Walk the show beat by beat",
          body: `<p>Click through beats in the <strong>Scenes</strong> panel to replay the staging in order. Each beat loads its saved positions and arrows, so you can move at the pace of the conversation.</p>`,
        },
        {
          title: "Show the traffic",
          body: `<p>Toggle <strong>Movement</strong> to display arrows from the current beat to the next. Useful when you are explaining a crossing or checking sightlines with a designer.</p>`,
        },
        {
          title: "Flip to the script and back",
          body: `<p>Use the <strong>Script</strong> and <strong>Blocking</strong> switch in the top bar to jump between the page and the stage without leaving full screen.</p>`,
        },
        {
          title: "Export a beat as a picture",
          body: `<p>Click <strong>Export</strong> to download the current beat as a PNG: the ground plan background with performer tokens and built-in set pieces in place. Handy for the call board or for pasting into a rehearsal report.</p>`,
        },
        {
          title: "Exit when you are done",
          body: `<p>Press <strong>Esc</strong> or click <strong>Exit focus</strong> to return to the regular Blocking tab, right where you left off.</p>`,
        },
      ],
      tip: `<p>Need to fix the stage mid-session? Editors can click <strong>Stage Setup</strong> inside Focus mode and the setup wizard opens right there, full screen, then drops you back on the canvas.</p>`,
      blocks: [
        {
          heading: "Blocking on phones",
          body: `<p>On a phone the blocking canvas is view only: cast can step through beats with the previous and next arrows above the stage, or swipe across the canvas. Editing is built for a computer, where drag and drop has room to breathe.</p>`,
        },
      ],
      nextSteps: [
        {
          label: "Write up the rehearsal report",
          href: "/help/reports/creating-a-rehearsal-report",
        },
        {
          label: "Distribute the report to the company",
          href: "/help/reports/distributing-reports",
        },
        {
          label: "Back to capturing beats",
          href: "/help/blocking/capturing-blocking-beats",
        },
      ],
      related: [
        {
          label: "Set up your ground plan",
          href: "/help/blocking/setting-up-your-ground-plan",
        },
        {
          label: "Your first rehearsal with Proscene",
          href: "/help/get-started/your-first-rehearsal",
        },
        {
          label: "Script annotations and highlights",
          href: "/help/script/annotations-and-highlights",
        },
        {
          label: "Roles and permissions",
          href: "/help/people/roles-and-permissions",
        },
      ],
    },
  ],
};
