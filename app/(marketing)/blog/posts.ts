// Static blog posts — the always-present fallback used when Sanity has no
// posts yet (the /blog index and /blog/[slug] both prefer Sanity and fall
// back to these). Adding a post here makes it live immediately; publishing
// the same slug in Sanity Studio transparently supersedes it.
//
// Bodies are authored HTML for the `.art-body` container (see blogpost.css).
// The four SM-craft guides are ported from docs/seo/blog-drafts/*, with their
// pre-billing "free during open beta" CTAs updated to the real trial story.

export type BlogCategory = "Walkthrough" | "SM craft" | "Product";

export interface BlogPost {
  slug: string;
  title: string;
  /** Short hero sub-headline. */
  lede: string;
  category: BlogCategory;
  readTime: string; // e.g. "8 min"
  /** Display date, e.g. "Jun 4, 2026". */
  date: string;
  /** ISO date for schema/metadata. */
  dateISO: string;
  excerpt: string;
  metaDescription: string;
  tags: string[];
  /** Placeholder-image label shown on the cover/card ghost. */
  coverLabel: string;
  /** Inline style for the cover ghost. */
  coverStyle: string;
  /** Featured (large) card on the index. Exactly one should be true. */
  featured?: boolean;
  /** Slugs of up to two related posts for "Keep reading". */
  related: string[];
  /** Authored HTML for the `.art-body` container. */
  body: string;
}

const COVER_GRADIENT =
  "background:repeating-linear-gradient(135deg, var(--accent-soft) 0 12px, color-mix(in oklch,var(--accent-soft) 70%,var(--bg)) 12px 24px)";
const COVER_GRADIENT_SAGE =
  "background:repeating-linear-gradient(135deg, color-mix(in oklch,var(--c-sage) 22%,var(--bg)) 0 12px, color-mix(in oklch,var(--c-sage) 12%,var(--bg)) 12px 24px)";
const COVER_GRADIENT_DUSK =
  "background:repeating-linear-gradient(135deg, color-mix(in oklch,var(--c-dusk) 20%,var(--bg)) 0 12px, color-mix(in oklch,var(--c-dusk) 10%,var(--bg)) 12px 24px)";
const COVER_GRADIENT_CLAY =
  "background:repeating-linear-gradient(135deg, color-mix(in oklch,var(--c-clay) 20%,var(--bg)) 0 12px, color-mix(in oklch,var(--c-clay) 10%,var(--bg)) 12px 24px)";

const CATEGORY_COLOR: Record<BlogCategory, string> = {
  Walkthrough: "accent",
  "SM craft": "clay",
  Product: "dusk",
};

// ─────────────────────────────────────────────────────────────────────────
// Posts
// ─────────────────────────────────────────────────────────────────────────

const SETUP_POST: BlogPost = {
  slug: "setup-your-first-production",
  title: "Set up your first production in Proscene",
  lede: "A blank screen to your first call going out, step by step. We'll build a real show, <em>The Pirates of Penzance</em>, and have the whole company confirmed by the end.",
  category: "Walkthrough",
  readTime: "8 min",
  date: "May 28, 2026",
  dateISO: "2026-05-28",
  excerpt:
    "From a blank screen to your first call going out. We build a real show step by step: venues, cast list, the rehearsal calendar, and sending a call the whole company confirms.",
  metaDescription:
    "A blank screen to your first call going out, step by step. We build a real show and have the whole company confirmed by the end.",
  tags: ["getting started", "walkthrough", "stage management", "calls"],
  coverLabel: "cover / new-production.jpg",
  coverStyle: COVER_GRADIENT,
  featured: true,
  related: ["how-to-write-a-rehearsal-report", "stage-manager-tech-week-checklist"],
  body: `
        <p>If you've stage-managed before, you know the first week is mostly logistics: a cast list, a calendar, a venue, and a hundred small details you'll spend the run keeping straight. The promise of Proscene is that you do this <strong>once</strong>, and then it works for you every night after. Here's the whole setup, start to finish.</p>

        <div class="callout"><b>Before you start:</b> have your cast list handy (a spreadsheet is perfect) and know your rehearsal dates and venue. That's everything you need.</div>

        <h2><span class="step">Step one</span>Create the production</h2>
        <p>From your workspace, hit <strong>New production</strong>. Name the show, set the company it belongs to, and pick your dates, first rehearsal through closing night. Proscene uses these to build the spine of your calendar, so don't worry about being precise yet; you can move anything later.</p>
        <p>Add your venues while you're here. Most shows have a couple, a rehearsal studio and the theatre itself. Naming them now means every call you send later just references the right room.</p>

        <div class="panel">
          <div class="panel-row panel-head">New production</div>
          <div class="panel-row"><span class="lead"><b>The Pirates of Penzance</b><span style="font-size:12px;color:var(--ink-4)">Gilbert &amp; Sullivan · Comic opera</span></span><span class="pill" data-c="accent">Spring season</span></div>
          <div class="panel-row"><span class="lead">Rehearsals begin</span><span class="mono" style="font-size:12px;color:var(--ink-3)">Apr 7 → Jun 1</span></div>
          <div class="panel-row"><span class="lead">Venues</span><span class="mono" style="font-size:12px;color:var(--ink-3)">Studio A · Wellman Theatre</span></div>
        </div>

        <h2><span class="step">Step two</span>Bring in your company</h2>
        <p>This is the part people dread and shouldn't. Instead of typing 22 actors by hand, paste your cast list straight from a spreadsheet. Proscene reads the columns and maps them, name, role, email, phone, emergency contact, and you confirm the matches in one pass.</p>
        <ul>
          <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Paste from Sheets, Excel, or Numbers, or upload a CSV</li>
          <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Set each person's role: principal, ensemble, crew, design, FOH</li>
          <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> Reuse a company you've built before in one click</li>
        </ul>
        <p>Everyone you add gets an invite. They tap one link, and they're in, seeing exactly what their role should see and nothing more.</p>

        <div class="pull">"The first time I imported a cast list and watched 22 people appear in ten seconds, I genuinely laughed out loud at my desk."</div>

        <h2><span class="step">Step three</span>Build the rehearsal calendar</h2>
        <p>Now the part that earns its keep. Lay out your rehearsal period, block by block, scene by scene. Mark tech week, and as you go, Proscene quietly checks the cast's availability and flags conflicts <em>before</em> they cost you a room.</p>
        <div class="ph" data-label="screenshot / production-calendar.jpg"></div>
        <p>You don't have to plan the whole period in one sitting. Most stage managers rough in the shape, read-throughs, music calls, blocking weeks, runs, tech, and fill in detail a week at a time. The calendar is the single source everyone reads from, so a change you make here reaches all 22 phones at once.</p>

        <h2><span class="step">Step four</span>Send your first call</h2>
        <p>Pick a rehearsal, choose who's needed, by scene, by role, or hand-picked, and send. That's it. The call lands on everyone's device, they confirm with a tap, and you watch the room fill up in real time.</p>
        <div class="panel">
          <div class="panel-row panel-head">Tonight · Act II Stumble Run · 7:00 PM</div>
          <div class="panel-row"><span class="lead"><b>Tom Mercer</b> · Pirate King</span><span class="pill" data-c="sage"><span class="dot"></span>Confirmed</span></div>
          <div class="panel-row"><span class="lead"><b>Priya Anand</b> · Mabel</span><span class="pill" data-c="sage"><span class="dot"></span>Confirmed</span></div>
          <div class="panel-row"><span class="lead"><b>Marcus Ellroy</b> · Sergeant</span><span class="pill" data-c="amber"><span class="dot"></span>Seen</span></div>
        </div>
        <p>No more "did everyone get that?" The night before and the morning of, Proscene nudges anyone who hasn't confirmed, so you're not the human reminder service anymore.</p>

        <div class="callout"><b>That's the whole setup.</b> From here, you layer in the script, take blocking, and file reports as you rehearse, but the show is already running on Proscene, and you did it in about ten minutes.</div>

        <p>The point isn't the software. It's the hour you get back every night, and the quiet certainty that the whole company knows where to be. Build the show once. Let it carry you to closing.</p>
`,
};

const REHEARSAL_REPORT_POST: BlogPost = {
  slug: "how-to-write-a-rehearsal-report",
  title: "How to Write a Rehearsal Report (With a Free Template)",
  lede: "The most important document you'll write on any show, and the one most often done badly. Here's the format, section by section, with a free template and a filled-in sample.",
  category: "SM craft",
  readTime: "8 min",
  date: "Jun 4, 2026",
  dateISO: "2026-06-04",
  excerpt:
    "Learn how to write a rehearsal report stage managers actually read, with a free USITT-standard rehearsal report template and a filled-in sample.",
  metaDescription:
    "Learn how to write a rehearsal report stage managers actually read, with a free USITT-standard rehearsal report template and a filled-in sample.",
  tags: [
    "rehearsal report",
    "rehearsal report template",
    "stage management",
    "USITT",
    "production paperwork",
    "department notes",
  ],
  coverLabel: "cover / rehearsal-report.jpg",
  coverStyle: COVER_GRADIENT_CLAY,
  related: ["stage-manager-tech-week-checklist", "how-to-build-a-rehearsal-schedule"],
  body: `
        <p>The rehearsal report is the most important document you will write on any production, and you will write it every single night. It is also the document most often done badly. Too long, too late, missing the one note the props designer actually needed, or written like a diary entry instead of a working memo.</p>
        <p>This guide covers what goes in a rehearsal report, section by section, following the format taught in most training programs and standardized through USITT's stage management resources. There is a complete rehearsal report template you can copy below, plus a filled-in sample so you can see what a real one looks like on a real night.</p>

        <h2>What a rehearsal report is (and who it is really for)</h2>
        <p>A rehearsal report is a nightly summary of everything that happened in rehearsal that affects someone who was not in the room. That last clause is the whole job. The director knows what happened. The cast knows what happened. Your report exists for the costume designer who was at her day job, the TD who was in the shop, and the producer who wants to know the show is on track without calling you at 11pm.</p>
        <p>Every note you write should pass one test: does someone outside the room need to know this or act on it? "We ran Act One and it went well" fails that test. "Director cut the umbrella business on page 42, props no longer needs the practical umbrella" passes it.</p>
        <p>The report is also the production's paper trail. When the set designer says nobody told them the platform moved downstage, the report from three weeks ago says otherwise. Write every report knowing it may be read back to you later.</p>

        <h2>The standard rehearsal report sections</h2>
        <p>The format below reflects the USITT-aligned structure used across professional and educational theatre. Companies vary the order, but nearly every good report contains these sections.</p>
        <h3>Header block</h3>
        <p>Show title, report number, rehearsal date, start and end times, location, who was called, and who wrote the report. Number your reports sequentially from the first rehearsal. When someone says "check report 14," that should mean something.</p>
        <h3>Attendance and schedule notes</h3>
        <p>Late arrivals, absences, illnesses, and injuries, stated factually. "J. Alvarez arrived 7:22, notified in advance" is a note. "Jordan was late again" is a grievance. Injuries always get reported, however minor, the same night they happen.</p>
        <p>Then anything that affects the schedule going forward: rehearsal ran long, a scene got bumped to Thursday, the director wants a fight call added before every run.</p>
        <h3>What was rehearsed</h3>
        <p>A brief factual account: which scenes or numbers were worked, whether it was blocking, a work-through, a stumble run, or a full run. Two to four lines. This is context for the department notes, not a review of the evening.</p>
        <h3>Department notes</h3>
        <p>This is the heart of the report and the reason it exists. One section per department, and every department gets a line even if the line is "No notes today, thank you!" A department that never sees its name stops reading, and the night you finally have a note for them, they miss it.</p>
        <p>Typical sections: Scenic, Props, Costumes, Lighting, Sound, Music, Choreography, Production/Stage Management, and General. Adjust to your show. A good breakdown of how to write notes each department can act on lives in <a href="/help/reports/department-notes">department notes</a>, but the short version is in the tips below.</p>
        <h3>General notes and questions</h3>
        <p>Anything that crosses departments or needs a producer or director decision: budget questions, space conflicts, a request for a production meeting agenda item.</p>
        <h3>Next rehearsal</h3>
        <p>Date, time, location, and what will be worked. This doubles as an early warning for departments: if you are running Act Two tomorrow, sound knows tonight is the night to get the new cue file to you.</p>

        <h2>Free rehearsal report template (copy and paste)</h2>
        <p>Copy this into whatever you use to write reports. It is deliberately plain so it survives email, docs, and printing.</p>
        <pre class="art-code"><code>REHEARSAL REPORT #___
[SHOW TITLE] - [Producing Company]

Date:            [Day, Month DD, YYYY]
Rehearsal:       [Start] – [End]   Location: [Room/Venue]
Report by:       [Name, Stage Manager]   [email / phone]

--- ATTENDANCE &amp; SCHEDULE ---
Called:          [Who was called]
Late/Absent:     [Name, time, reason if known, or "None"]
Injuries:        [Details, or "None"]
Schedule notes:  [Changes to the upcoming schedule, or "None"]

--- REHEARSAL SUMMARY ---
[2–4 lines: what was worked and how (blocking / work-through /
stumble run / full run). Pages or scenes covered.]

--- DEPARTMENT NOTES ---

SCENIC:
1. [Note]

PROPS:
1. [Note]

COSTUMES:
1. [Note]

LIGHTING:
1. [Note]

SOUND:
1. [Note]

MUSIC / CHOREOGRAPHY:
1. [Note]

STAGE MANAGEMENT:
1. [Note]

GENERAL:
1. [Note]

(Every department appears every night. "No notes today,
thank you!" is a complete entry.)

--- NEXT REHEARSAL ---
[Day, Date] [Time] at [Location]
Working: [Scenes / focus]</code></pre>

        <h2>Sample rehearsal report (filled in)</h2>
        <p>Here is the same template on a realistic night, mid-process, at a community theatre.</p>
        <pre class="art-code"><code>REHEARSAL REPORT #17
THE 39 STEPS - Millbrook Community Players

Date:            Tuesday, March 10, 2026
Rehearsal:       7:00 PM – 10:05 PM   Location: Fellowship Hall
Report by:       Dana Okafor, SM   dana@millbrookplayers.org

--- ATTENDANCE &amp; SCHEDULE ---
Called:          Full cast
Late/Absent:     M. Reyes arrived 7:25 (traffic, called ahead)
Injuries:        None
Schedule notes:  Thursday 3/12 now begins with a 30-min fight
                 call at 6:30 PM before the 7:00 call. Fight
                 captain and both Clowns called at 6:30.

--- REHEARSAL SUMMARY ---
Blocked Act 1, Sc. 4–6 (pp. 28–41), then a work-through of
Sc. 1–6. First stumble run of Act 1 is still on for Friday.

--- DEPARTMENT NOTES ---

SCENIC:
1. The director has restaged the window escape (p. 34) so
   Hannay exits over the trunk, not through the frame. Can the
   trunk lid support repeated standing weight? Please advise
   before Friday's run.

PROPS:
1. ADD: a second pipe for Prof. Jordan (Sc. 6); the handoff
   to the Sheriff no longer returns it.
2. The rehearsal handcuffs arrived, thank you! They work well.

COSTUMES:
1. Pamela is now dragged stage right by the handcuffed wrist
   (p. 38). Please note for sleeve/seam durability on her
   Act 1 jacket.

LIGHTING:
1. No notes today, thank you!

SOUND:
1. The director requests a 3–4 sec train whistle to cover the
   Sc. 4 transition. Needed by Friday's stumble run if possible.

MUSIC / CHOREOGRAPHY:
1. No notes today, thank you!

STAGE MANAGEMENT:
1. SM will retape the Sc. 6 platform spike marks Thursday
   before fight call.

GENERAL:
1. Producer: the church has confirmed we lose Fellowship Hall
   on 3/21. Do we move that rehearsal to the black box or cut
   it? Decision needed by Monday 3/16 to notify cast.

--- NEXT REHEARSAL ---
Thursday, March 12: Fight call 6:30 PM, full call 7:00 PM
at Fellowship Hall. Working: Act 1, Sc. 7–8, then review 4–6.</code></pre>
        <p>Notice what the sample does. Every note names a page, a deadline, or a decision-maker. Questions ask for an answer by a date. Departments with nothing still get thanked. And the whole thing reads in under two minutes, because your designers will read it on their phones during a lunch break.</p>

        <h2>How to write notes people actually act on</h2>
        <ul class="plain">
          <li><strong>One item per note, numbered.</strong> Numbered notes can be answered by number. A paragraph of prose gets skimmed and half-answered.</li>
          <li><strong>Lead with the action word.</strong> ADD, CUT, CHANGE, QUESTION. The props designer triages twelve productions' worth of email; make yours scannable.</li>
          <li><strong>Give the page or the moment.</strong> "The umbrella business" means nothing in six weeks. "p. 42, top of the scene" always will.</li>
          <li><strong>Report, do not editorialize.</strong> You are a neutral conduit between the room and the departments. "The director cut the song" is your note. Whether it was a good idea is not.</li>
          <li><strong>Ask questions that can be answered.</strong> "Thoughts on the trunk?" invites silence. "Can the trunk lid support repeated standing weight? Answer needed before Friday" gets a reply.</li>
          <li><strong>Never bury safety.</strong> Injuries and hazards go in every time, clearly, even when the actor says they are fine.</li>
        </ul>

        <h2>Timing and distribution</h2>
        <p>Send the report the same night, within an hour of the end of rehearsal if you can manage it. A report that arrives at noon the next day has already cost the shop a morning. Send it from the same address, with the same subject line format ("Rehearsal Report #17: The 39 Steps"), to a list you maintain deliberately. Every designer, every department head, the director, the producer. When in doubt, include them.</p>
        <p>The traditional workflow is the painful part: you keep notes on paper or in your phone all night, then rebuild them into a formatted email at 10:30pm while the building manager waits to lock up. This is the part worth automating. Proscene assembles the report as you go and routes each note to the right department when you <a href="/help/reports/distributing-reports">distribute it</a>, so the 10:30pm rebuild disappears. But whether you use software or a template in an email, the discipline is the same: every night, every department, no exceptions.</p>

        <h2>The habit is the skill</h2>
        <p>Nobody remembers a merely adequate rehearsal report, and that is the point. A report that shows up on time, in the same format, with numbered notes and honest questions, makes the entire production trust the stage manager. Miss two nights and that trust erodes faster than you earned it.</p>
        <p>Copy the template above, put it somewhere you can reach at 10pm, and send report #1 after your next rehearsal.</p>

        <div class="callout"><b>See how Proscene builds the report for you as you take notes:</b> <a href="/help/reports/creating-a-rehearsal-report">Creating a rehearsal report</a>, part of <a href="/features#reports">Proscene's reports feature</a>. Free for your first production, a 60-day trial, no card required.</div>
`,
};

const BLOCKING_POST: BlogPost = {
  slug: "blocking-notation-complete-guide",
  title: "Blocking Notation: A Complete Guide for Stage Managers",
  lede: "Six weeks into a run, an understudy goes on with four hours' notice. The blocking in your book is all that stands between them and chaos. Here's the system.",
  category: "SM craft",
  readTime: "10 min",
  date: "Jun 11, 2026",
  dateISO: "2026-06-11",
  excerpt:
    "A complete guide to blocking notation for theatre: stage geography, shorthand symbols, mini ground plans, and paper vs digital blocking methods.",
  metaDescription:
    "A complete guide to blocking notation for theatre: stage geography, shorthand symbols, mini ground plans, and paper vs digital blocking methods.",
  tags: [
    "blocking notation",
    "how to notate blocking",
    "blocking symbols",
    "prompt book",
    "ground plan",
    "stage management",
  ],
  coverLabel: "cover / blocking-notation.jpg",
  coverStyle: COVER_GRADIENT_DUSK,
  related: ["how-to-write-a-rehearsal-report", "stage-manager-tech-week-checklist"],
  body: `
        <p>Six weeks into a run, an understudy goes on with four hours' notice. The only thing standing between that actor and chaos is the blocking notation in your book. If it says "X DR" and means it, they hit their light. If it says "moves over there-ish" in handwriting you can no longer read, everyone on stage is improvising traffic patterns in front of a paying audience.</p>
        <p>Blocking notation is the system stage managers use to record every actor's position and movement, moment by moment, so that the staging can be reproduced by anyone, at any time, without the director in the room. This guide covers the standard vocabulary, the shorthand symbols, how to keep up when the director is restaging on the fly, and an honest comparison of paper and digital methods.</p>

        <h2>Why blocking documentation matters</h2>
        <p>The book is the production's memory. Directors carry staging in their heads; heads are not transferable. Your blocking notation is what makes possible:</p>
        <ul class="plain">
          <li><strong>Understudy and swing rehearsals</strong>, often run by the SM alone</li>
          <li><strong>Brush-up rehearsals</strong> weeks into a run, when everyone "remembers" a different version</li>
          <li><strong>Remounts and transfers</strong>, where the notation is the staging</li>
          <li><strong>Calling the show</strong>, because your cues hang off movement ("LX 47 as she crosses DC")</li>
          <li><strong>Settling disputes</strong>, gently, when an actor is certain they have always entered stage left</li>
        </ul>
        <p>If it is not written down, it did not happen. That is the standard.</p>

        <h2>Stage geography: the vocabulary of blocking</h2>
        <p>Before symbols, directions. All blocking notation is built on stage geography from the actor's point of view, facing the audience:</p>
        <ul class="plain">
          <li><strong>US / DS</strong>: upstage (away from the audience) and downstage (toward it)</li>
          <li><strong>SL / SR</strong>: stage left and stage right, from the actor's perspective, so SL is the audience's right</li>
          <li><strong>C</strong>: center; combine freely, so DSR is downstage right, USC is upstage center</li>
          <li><strong>X</strong>: a cross, the basic unit of stage movement</li>
        </ul>
        <p>The proscenium stage divides into the classic nine-box grid: DR, DC, DL across the front, R, C, L across the middle, UR, UC, UL across the back. For most scenes on most shows, the grid plus a good ground plan gives you all the precision you need. Add landmarks for more: "X to DR corner of table" beats "X DR" when there is a table to name.</p>

        <h2>Blocking notation symbols: the standard shorthand</h2>
        <p>There is no single universal standard, and every SM's book develops a personal accent. But the core shorthand below is close to universal in North American practice, and any notation key built from it will be readable by another stage manager. Whatever you use, put a key in the front of your prompt book. The book must be readable by someone who is not you.</p>
        <div class="art-table">
          <table>
            <thead><tr><th>Symbol / abbreviation</th><th>Meaning</th></tr></thead>
            <tbody>
              <tr><td>X</td><td>Cross (X DL = cross downstage left)</td></tr>
              <tr><td>↗ ↘ → (arrows)</td><td>Direction of movement drawn on a mini ground plan</td></tr>
              <tr><td>ENT / ENTR</td><td>Enters (ENT SR = enters stage right)</td></tr>
              <tr><td>EXT</td><td>Exits (EXT USL)</td></tr>
              <tr><td>⊙ or initials in a circle</td><td>An actor's position, marked with character initials</td></tr>
              <tr><td>↓ or "sits"</td><td>Sits (↓ sofa = sits on the sofa)</td></tr>
              <tr><td>↑ or "rises"</td><td>Stands / rises</td></tr>
              <tr><td>KN</td><td>Kneels</td></tr>
              <tr><td>CTR</td><td>Counters (adjusts position to rebalance the stage picture)</td></tr>
              <tr><td>FF / FO</td><td>Faces front / faces off</td></tr>
              <tr><td>T ¼ L, T ½ R</td><td>Turns: quarter turn left, half turn right</td></tr>
              <tr><td>ABV / BLW</td><td>Above (upstage of) / below (downstage of) an object or person</td></tr>
              <tr><td>w/</td><td>With, moving together ("X DC w/ M")</td></tr>
              <tr><td>~ or "drift"</td><td>A slow, unmotivated move over several lines</td></tr>
              <tr><td>pp. / ln.</td><td>Page and line reference tying the move to the text</td></tr>
            </tbody>
          </table>
        </div>
        <p>Character names get one- or two-letter abbreviations, assigned in your key on day one. Hannay is H, Pamela is P, and if you have Margaret and Mrs. McGarrigle you decide early who gets M.</p>
        <p>A complete blocking note reads like a sentence in this language: <strong>"H: ENT UL, X DC to P, ↓ trunk"</strong> means Hannay enters up left, crosses down center to Pamela, and sits on the trunk. Ten words of staging in a line of shorthand.</p>

        <h2>How to notate blocking: the facing-page system</h2>
        <p>The traditional prompt book method interleaves the script with blocking pages:</p>
        <ol>
          <li><strong>Single-sided script.</strong> Print the script one-sided, hole-punched, so every page of text faces a blank page.</li>
          <li><strong>Number the moves.</strong> In the script margin, put a small circled number at the exact word where a move happens.</li>
          <li><strong>Describe on the facing page.</strong> Next to the matching number on the blank page, write the move in shorthand: "③ P: X USR, T ½ L."</li>
          <li><strong>Add mini ground plans.</strong> For busy scenes, draw a small outline of the set on the facing page and mark positions with initials and arrows. Many SMs pre-print a strip of thumbnail ground plans down the facing page before rehearsals start. Ten seconds of drawing beats ten lines of prose for a five-person scene change.</li>
          <li><strong>Always in pencil.</strong> Never ink. This is not a style preference; it is survival.</li>
        </ol>
        <p>The numbered-margin system keeps the script page clean enough to call from later, which matters when tech arrives and cue notations start competing for the same margins.</p>

        <h3>Notating in real time (when the director keeps changing it)</h3>
        <p>The gap between blocking-notation theory and practice is the director who restages the same crossing four times in ten minutes, and then says "actually, go back to what we had Tuesday." Some field-tested habits:</p>
        <ul class="plain">
          <li><strong>Wait for the repeat.</strong> Do not notate the first attempt at a staging. Notate when it repeats or the director moves on. Until then, keep it in soft pencil or shorthand on scratch paper.</li>
          <li><strong>Erase completely or strike clearly.</strong> A page with three half-erased versions is worse than a blank page. When a move dies, kill it.</li>
          <li><strong>Date significant changes.</strong> A small "3/10" next to a restaged sequence lets you answer "when did that change?" with a fact.</li>
          <li><strong>Capture positions at stability points.</strong> At the top of each scene or major beat, snapshot where everyone is. When the middle gets messy, the snapshots let you rebuild.</li>
          <li><strong>Ask.</strong> "Sorry, is she above or below the table on that cross?" is not an interruption; it is the job. Directors would rather answer now than re-block in tech.</li>
        </ul>

        <h3>Beats: the unit of blocking</h3>
        <p>Rather than notating continuously, most SMs break each scene into beats: a stretch of stage time where the picture is stable or a single movement phrase happens. Notate the positions at the top of the beat, then the moves within it. Thinking in beats keeps the book organized, matches how directors actually work ("let's go back to the top of the fight"), and gives understudies a chunk-by-chunk way to learn the track. It is also the model digital blocking tools are built around, for the same reasons.</p>

        <h2>Paper vs digital blocking: an honest comparison</h2>
        <p>Stage managers have notated blocking in pencil for a century, and pencil still works. Digital tools have matured fast in the last few years. Here is the fair comparison:</p>
        <div class="art-table">
          <table>
            <thead><tr><th></th><th>Paper prompt book</th><th>Digital blocking tool</th></tr></thead>
            <tbody>
              <tr><td><strong>Speed in the room</strong></td><td>Very fast once fluent; nothing beats pencil for a scribbled arrow</td><td>Fast for position capture (drag tokens, save the beat); slower for free-form marginalia</td></tr>
              <tr><td><strong>Legibility</strong></td><td>Depends entirely on your handwriting at 10pm</td><td>Always legible; positions are exact on a calibrated ground plan</td></tr>
              <tr><td><strong>Revisions</strong></td><td>Erase and redraw; pages get muddy after the third restaging</td><td>Update the beat; no eraser crumbs, full history stays clean</td></tr>
              <tr><td><strong>Sharing</strong></td><td>One physical book; photocopies or photos of pages</td><td>The whole team sees current blocking from any device</td></tr>
              <tr><td><strong>Movement over time</strong></td><td>You draw the arrows</td><td>Movement arrows between beats can be generated from the positions</td></tr>
              <tr><td><strong>Understudy rehearsals</strong></td><td>Reading your shorthand across the table</td><td>Step through the scene beat by beat on a screen</td></tr>
              <tr><td><strong>Cost</strong></td><td>Binder, paper, pencils: nearly free</td><td>Free to subscription pricing, varies by tool</td></tr>
              <tr><td><strong>Failure modes</strong></td><td>Coffee, lost binder, illegible pages, one copy on Earth</td><td>Dead battery, no wifi, learning curve in week one</td></tr>
              <tr><td><strong>Tech week</strong></td><td>The book is also your calling script: everything in one binder</td><td>Blocking lives alongside the script rather than inside it</td></tr>
            </tbody>
          </table>
        </div>
        <p>The honest summary: paper is unbeatable for speed of scribble and needs no battery, and a fluent SM with good handwriting loses nothing by staying analog on a small show. Digital wins on legibility, sharing, revision churn, and everything that happens after the room: understudies, brush-ups, remounts. The shows where digital pays off most are exactly the ones where blocking changes constantly and more than one person needs the current version.</p>
        <p>Plenty of SMs run a hybrid: pencil in the moment, transfer to digital at the end of the night, the same way rehearsal notes become a rehearsal report.</p>
        <p>If you want to see the digital version of the workflow in this guide, it maps almost one to one: you upload your ground plan and calibrate it, then capture positions beat by beat with movement arrows drawn between them. Proscene's blocking tool works exactly this way, with drag-and-drop actor tokens and per-beat notes; the beat-by-beat method is covered in <a href="/help/blocking/capturing-blocking-beats">capturing blocking beats</a>.</p>

        <h2>A worked example</h2>
        <p>Here is one moment notated three ways. The staging: Pamela enters from the stage right door, crosses below the sofa to the window down left, and Hannay rises from the armchair and drifts to center.</p>
        <p><strong>Prose (do not do this):</strong> "Pamela comes in from the door on the right and goes over to the window, going in front of the sofa. Hannay gets up from the chair and ends up in the middle."</p>
        <p><strong>Shorthand (facing page):</strong></p>
        <pre class="art-code"><code>④ P: ENT SR door, X BLW sofa to DL window
⑤ H: ↑ armchair, ~ to C</code></pre>
        <p><strong>Mini ground plan:</strong> a thumbnail of the set with "P" at the SR door, an arrow curving below the sofa to the DL window, "H" at the armchair with a short dashed arrow to C. Dashed for the drift, solid for the cross: another convention worth putting in your key.</p>
        <p>The shorthand and the thumbnail together take under fifteen seconds to record and can be reproduced by any stage manager, next week or next year. That is the entire standard blocking notation has to meet.</p>

        <h2>Build the system before you need it</h2>
        <p>Blocking notation is a system you set up once per show and then trust under pressure. Before first rehearsal: assign character abbreviations, print your facing pages or thumbnail strips, write your symbol key, and sharpen more pencils than you think you need. The SMs whose books can save an understudy's night are not the ones with the fanciest shorthand. They are the ones who notated every rehearsal, legibly, in a system someone else could read.</p>

        <div class="callout"><b>Going digital, or just curious what it looks like?</b> Start with <a href="/help/blocking/setting-up-your-ground-plan">setting up your ground plan</a> in <a href="/features#blocking">Proscene's blocking tool</a>. Free for your first production, a 60-day trial, no card required.</div>
`,
};

const TECH_WEEK_POST: BlogPost = {
  slug: "stage-manager-tech-week-checklist",
  title: "The Stage Manager's Tech Week Checklist (Printable)",
  lede: "Tech week is won or lost the week before tech. Here's the checklist, from pre-tech paperwork through cue to cue, dress, opening, and closing night.",
  category: "SM craft",
  readTime: "6 min",
  date: "Jun 18, 2026",
  dateISO: "2026-06-18",
  excerpt:
    "A week-by-week stage manager tech week checklist, from pre-tech paperwork through cue to cue, dress, opening, and closing night. Printable.",
  metaDescription:
    "A week-by-week stage manager tech week checklist, from pre-tech paperwork through cue to cue, dress, opening, and closing night. Printable.",
  tags: [
    "tech week",
    "stage manager checklist",
    "cue to cue",
    "dress rehearsal",
    "load-in",
    "opening night",
  ],
  coverLabel: "cover / tech-week.jpg",
  coverStyle: COVER_GRADIENT_CLAY,
  related: ["how-to-build-a-rehearsal-schedule", "how-to-write-a-rehearsal-report"],
  body: `
        <p>Tech week is won or lost the week before tech. By the time you are sitting at the prompt desk with a headset on and forty cues to place before dinner break, it is too late to discover that the run sheets do not exist, half the cast never saw the schedule, and nobody rehearsed the quick change.</p>
        <p>This is the checklist I wish someone had handed me before my first tech. It runs from the week before tech through closing night. Print it, tape it inside your prompt book, and adapt it to your show; a straight play in a black box does not need the mic tracking, and a musical needs twice of everything.</p>

        <h2>The week before tech</h2>
        <p>Paperwork week. Everything below exists before you load in, because during tech you will have no time to create anything, only to revise.</p>
        <ul class="task">
          <li><strong>Distribute the tech schedule</strong> to cast, crew, and every designer, with call times per day. Chase confirmations from every single person. "It was in the group chat" is how you end up teching without your Act Two lead.</li>
          <li><strong>Build run sheets</strong>: preset list, scene shift plot, props tracking (what starts where, what moves, who moves it), costume quick-change plot, mic tracking if applicable.</li>
          <li><strong>Prep the calling script</strong>: clean copy, cue placements penciled from paper tech or your best predictions, page tabs for tricky sequences.</li>
          <li><strong>Hold or confirm paper tech</strong> with the director, LD, and sound designer: walk the whole show cue by cue on paper before anyone burns stage time on it.</li>
          <li><strong>Confirm crew assignments</strong> and that every crew member knows their call and their track.</li>
          <li><strong>Update all contact info</strong> and the emergency sheet; post one at the desk and one backstage.</li>
          <li><strong>Send a "what tech is" note</strong> to any cast who have never done one. A volunteer cast that expects to act will resent standing in the dark; a cast that expects to stand in the dark brings a book and a sweater.</li>
          <li><strong>Stock the SM kit</strong>: spike tape, glow tape, batteries, pencils, first aid, snacks, spare headset ears.</li>
        </ul>

        <h2>Load-in and dry tech</h2>
        <p>The theatre becomes the set. You become the traffic controller.</p>
        <ul class="task">
          <li><strong>Walk the space first</strong>: sightlines, crossover route, escape lights, trip hazards, backstage running lights.</li>
          <li><strong>Spike everything</strong> that moves: furniture positions per scene, in a color code you document in the book.</li>
          <li><strong>Check headsets</strong> on every channel from every position. Do this before you need them, not during cue one.</li>
          <li><strong>Dry tech without actors</strong> where possible: shift the scenery, run the fly cues, walk the transitions with the crew alone.</li>
          <li><strong>Set the prompt desk</strong>: script light, running order taped up, God mic if you have one, sightline to the stage or a monitor.</li>
          <li><strong>Post signage</strong>: dressing room assignments, sign-in sheet, backstage quiet zones.</li>
        </ul>

        <h2>Cue to cue</h2>
        <p>The long day. Your job splits in two: call the room, and build the show.</p>
        <ul class="task">
          <li><strong>Start with introductions and the plan.</strong> Tell the room the order of the day, when breaks fall, and how holds work. A room that knows the rules moves faster.</li>
          <li><strong>Run the sign-in sheet</strong> and start every session on time, even when you are the only one ready.</li>
          <li><strong>Call the holds</strong>: "Hold please" stops everything; only you say "moving on." Protect this convention from minute one.</li>
          <li><strong>Jump between cues</strong> ruthlessly. You are teching transitions, not running scenes. The director who wants to "just run this bit" gets a gentle reminder of the clock.</li>
          <li><strong>Mark every cue placement</strong> in the calling script as it is set, in pencil, with the standard "warning, standby, go" spacing worked out. If your script lives digitally, drop <a href="/help/script/cue-markers">cue markers</a> as you go instead of retyping tonight's pencil scrawl later.</li>
          <li><strong>Track the changes</strong>: every "make that a five count" and "move that shift a page earlier" goes in the book and in tonight's report.</li>
          <li><strong>Enforce breaks.</strong> Equity or not, ten out of ninety keeps a volunteer cast human. Nobody techs well at hour four without one.</li>
          <li><strong>Send a rehearsal report every night of tech</strong>, same as the rehearsal room. Tech reports are the busiest of the run; the shop reads them at 8am. The format is the same one covered in our <a href="/blog/how-to-write-a-rehearsal-report">rehearsal report guide</a>.</li>
        </ul>

        <h2>Dress rehearsals</h2>
        <p>The show starts pretending to be a show, and you start running it like one.</p>
        <ul class="task">
          <li><strong>Institute the half hour</strong>: calls at half hour, fifteen, five, and places, every dress, exactly as you will run them in performance. The routine is the point.</li>
          <li><strong>Rehearse the quick changes</strong> separately before the run if they have not been walked. A failed quick change in dress becomes a cut costume in performance.</li>
          <li><strong>Run presets from the run sheets</strong>, not from memory, and check them with a walk-through before the house would open.</li>
          <li><strong>Time everything</strong>: acts, intermission, the total. The producer will ask; the house manager needs it.</li>
          <li><strong>Call the show fully</strong>: every warning, every standby, every go, even the ones that feel obvious. Dress is your rehearsal too.</li>
          <li><strong>Hold notes sessions to schedule</strong> and get the cast released on time. Goodwill spent in dress week is not recoverable.</li>
          <li><strong>Coordinate photo call</strong> if it lands here: shot list from the director in advance, cast informed, changes minimized.</li>
        </ul>

        <h2>Opening night</h2>
        <ul class="task">
          <li><strong>Sweep and mop the deck</strong>, check every preset, test every practical.</li>
          <li><strong>Confirm crew and cast sign-in</strong> as the half approaches; know your understudy or cancellation plan before you need it.</li>
          <li><strong>Give the calls calmly.</strong> The half hour on opening night is for steadiness, not speeches.</li>
          <li><strong>Hold your pre-show ritual</strong>, whatever it is. The cast takes its temperature from the prompt desk.</li>
          <li><strong>Call the show. Write the performance report. Go to the party</strong> (after the deck is checked and the theatre is locked).</li>
        </ul>

        <h2>The run and closing</h2>
        <ul class="task">
          <li><strong>Performance report every night</strong>: timings, calls missed, tech issues, injuries, house notes.</li>
          <li><strong>Maintain the show</strong>: watch for drift in blocking and pacing; schedule a brush-up rehearsal or line-through after any dark week.</li>
          <li><strong>Track consumables and props repairs</strong> so Saturday's show has everything Friday's did.</li>
          <li><strong>Plan strike before closing</strong>: assignments, tools, rental returns, and who is definitely not allowed near the fly rail.</li>
          <li><strong>Archive the book</strong>: final calling script, run sheets, reports, contact sheet. Future remounts, and future you, will be grateful.</li>
        </ul>

        <h2>The meta-item: the schedule is the show</h2>
        <p>Look back through the list and notice how many items are really one item: everyone knows where to be, when, and what happens there. Tech collapses when the schedule lives in a group chat that half the cast muted in week two. Publish every call with times, location, and who is called, get an actual confirmation from every person, and re-publish the moment anything changes. Do that, and even a rough cue to cue stays a schedule problem instead of a people problem.</p>
        <p>That workflow, publishing calls and collecting one-tap confirmations instead of chasing thumbs-up emojis, is exactly what Proscene's scheduling was built for.</p>

        <div class="callout"><b>Set up your tech week calls, with confirmations you can actually see:</b> <a href="/help/scheduling/creating-calls">Creating calls</a>, part of <a href="/features#calls">Proscene's calls feature</a>. Free for your first production, a 60-day trial, no card required.</div>
`,
};

const SCHEDULE_POST: BlogPost = {
  slug: "how-to-build-a-rehearsal-schedule",
  title: "How to Build a Rehearsal Schedule (Template + Examples)",
  lede: "Every schedule is a negotiation between the show you need to build, the hours you have, and humans with day jobs. Here's how to make one that survives real life.",
  category: "SM craft",
  readTime: "7 min",
  date: "Jun 25, 2026",
  dateISO: "2026-06-25",
  excerpt:
    "How to build a rehearsal schedule that survives contact with real life: a rehearsal schedule template, example call tables, and conflict tips.",
  metaDescription:
    "How to build a rehearsal schedule that survives contact with real life: a rehearsal schedule template, example call tables, and conflict tips.",
  tags: [
    "rehearsal schedule template",
    "call schedule",
    "rehearsal calls",
    "theatre scheduling",
    "conflict calendar",
    "stage management",
  ],
  coverLabel: "cover / rehearsal-schedule.jpg",
  coverStyle: COVER_GRADIENT_SAGE,
  related: ["stage-manager-tech-week-checklist", "how-to-write-a-rehearsal-report"],
  body: `
        <p>Every rehearsal schedule is a negotiation between three things: the show you need to build, the hours you actually have, and the humans who have day jobs, kids, and a shift they could not trade. Build the schedule around only the first one and you will spend the whole process re-scheduling. This guide walks through how to make a call schedule for a theatre production that survives contact with real life, with a template and filled-in examples you can steal.</p>
        <p>It is written for the common case: a community or educational production rehearsing evenings and weekends over six to eight weeks. Compress or stretch as your process demands.</p>

        <h2>Start from the immovables</h2>
        <p>Before you schedule a single scene, collect the facts you cannot change:</p>
        <ul class="plain">
          <li><strong>Opening night</strong>, and therefore tech week, and therefore your final run week</li>
          <li><strong>Space availability</strong>: which rooms you have, on which nights, until what hour</li>
          <li><strong>Conflicts</strong>: every cast member's known unavailability, gathered in writing at auditions, not week two ("in writing" is doing a lot of work in that sentence)</li>
          <li><strong>Milestones the director wants</strong>: off-book dates per act, first stumble run, designer run</li>
          <li><strong>Fixed company events</strong>: photo call, press night, the gala the producer forgot to mention</li>
        </ul>
        <p>Put these on a calendar first. The rehearsal schedule gets built in the space that remains.</p>

        <h2>Work backward from opening</h2>
        <p>The standard arc of a rehearsal process, whatever its length, runs in phases. Working backward from opening:</p>
        <ol>
          <li><strong>Tech and dress</strong> (the final week): the show meets the building</li>
          <li><strong>Runs and polish</strong> (1 to 2 weeks): full runs, notes, working the trouble spots</li>
          <li><strong>Work-throughs</strong> (the middle stretch): scene work, stumble runs of each act, off-book deadlines</li>
          <li><strong>Blocking</strong> (the first 2 to 3 weeks): staging every scene once</li>
          <li><strong>Table work</strong> (the first few days): read-through, design presentations, script work</li>
        </ol>
        <p>Assign your weeks to phases before you assign nights to scenes. If blocking must finish by the end of week 3, and you have four rehearsals a week, you know tonight how many pages each night has to cover. That single calculation is the difference between a schedule and a hope.</p>

        <h2>The scene breakdown meets the conflict sheet</h2>
        <p>The working tool of scheduling is the cross-reference between two documents:</p>
        <ul class="plain">
          <li><strong>The scene/character breakdown</strong>: which characters appear in which scenes (build it during your script prep)</li>
          <li><strong>The conflict calendar</strong>: who is unavailable when</li>
        </ul>
        <p>Lay them side by side and each rehearsal night schedules itself: on a night your Hannay is at his daughter's recital, you work the scenes he is not in. The cardinal sin of scheduling is calling actors and not using them. Volunteers forgive a lot; they do not forgive sitting in a hallway for three hours to deliver one line. Call people to be used, release them when you are done.</p>

        <h2>Two documents, two audiences</h2>
        <p>A rehearsal schedule is really two documents, and mixing them up causes most scheduling grief:</p>
        <p><strong>The master schedule</strong> (weekly or full-run view) shows the shape of the process: which nights rehearse, what phase each week is in, the off-book and run dates. It changes rarely and is published to everyone early.</p>
        <p><strong>The daily call</strong> says exactly who is needed, when, where, and for what, for one specific rehearsal. It is precise, published a few days out, and updated as the work moves faster or slower than planned.</p>
        <p>The master schedule makes promises; the daily call keeps them.</p>

        <h2>Example: the master schedule</h2>
        <p>A six-week master schedule for a play rehearsing Tuesday, Thursday, and Sunday. This is the template; swap in your dates and phases.</p>
        <div class="art-table">
          <table>
            <thead><tr><th>Week</th><th>Tue 7–10pm</th><th>Thu 7–10pm</th><th>Sun 2–6pm</th><th>Milestones</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>Read-through, designs</td><td>Table work</td><td>Block Act 1, Sc 1–3</td><td>Conflicts locked</td></tr>
              <tr><td>2</td><td>Block Act 1, Sc 4–6</td><td>Block Act 1, Sc 7–8</td><td>Block Act 2, Sc 1–3</td><td></td></tr>
              <tr><td>3</td><td>Block Act 2, Sc 4–6</td><td>Work Act 1</td><td>Stumble run Act 1</td><td>Off book Act 1</td></tr>
              <tr><td>4</td><td>Work Act 2</td><td>Work Act 2</td><td>Stumble run Act 2</td><td>Off book Act 2</td></tr>
              <tr><td>5</td><td>Work trouble spots</td><td>Run Act 1 + notes</td><td>Run full show</td><td>Designer run Sun</td></tr>
              <tr><td>6</td><td>Run + notes</td><td>Run + notes</td><td>Tech begins</td><td>See tech schedule</td></tr>
            </tbody>
          </table>
        </div>
        <p>Notice what the table encodes: a steady weekly rhythm (same nights, same times), phases that march toward opening, and milestones pinned to dates. The rhythm matters more than it looks. A cast that knows "we always rehearse Tue/Thu/Sun" plans their lives around it; a schedule that wanders across different nights each week generates conflicts by itself.</p>

        <h2>Example: the daily call</h2>
        <p>The daily call breaks one rehearsal into blocks so people arrive when needed and leave when released:</p>
        <p><strong>Thursday, March 12, Fellowship Hall</strong></p>
        <div class="art-table">
          <table>
            <thead><tr><th>Time</th><th>Working</th><th>Who is called</th></tr></thead>
            <tbody>
              <tr><td>6:30–7:00</td><td>Fight call (p. 38 sequence)</td><td>Hannay, Pamela, fight captain</td></tr>
              <tr><td>7:00–8:15</td><td>Block Act 1, Sc 7</td><td>Hannay, Margaret, Crofter</td></tr>
              <tr><td>8:15–8:25</td><td>Break</td><td></td></tr>
              <tr><td>8:25–9:30</td><td>Block Act 1, Sc 8</td><td>Hannay, Pamela, Clowns</td></tr>
              <tr><td>9:30–10:00</td><td>Review Sc 4–6 shifts</td><td>Full cast called at 9:30</td></tr>
            </tbody>
          </table>
        </div>
        <p>Every block answers who, what, when. Margaret knows she is done at 8:15. The Clowns know not to show up at 7. And you have a written record when someone insists they were never called.</p>

        <h2>The backbone trick: schedule the pattern, then fill it</h2>
        <p>Here is the workflow that saves the most time in practice:</p>
        <ol>
          <li><strong>Create the recurring backbone first.</strong> Every Tuesday and Thursday 7 to 10, every Sunday 2 to 6, from first rehearsal through the start of tech. Location, standard times, done.</li>
          <li><strong>Layer the content in as you go.</strong> Two weeks out, each skeleton call gets its scenes and its cast list, informed by where the work actually is rather than where you guessed it would be in week zero.</li>
          <li><strong>Break the pattern deliberately.</strong> Added Saturday calls before a stumble run, a shifted start for a space conflict. Exceptions read as exceptions when the backbone is steady.</li>
        </ol>
        <p>If you are doing this in a spreadsheet, the backbone is an hour of copy-paste. This is also the step where scheduling software earns its keep: in Proscene you set the pattern (which weekdays, what times, what date range) and <a href="/help/scheduling/bulk-schedule-generation">bulk schedule generation</a> creates every call in one pass, each one individually editable afterward, with saved templates for your standard rehearsal setups.</p>

        <h2>Getting confirmations without chasing people</h2>
        <p>A published schedule that nobody confirmed is a rumor. The failure mode is universal: you post the schedule in the group chat, four people thumbs-up it, and on Sunday two actors are missing because "I never saw that."</p>
        <p>Whatever your tools, the fix is the same discipline:</p>
        <ul class="plain">
          <li><strong>Publish to a channel of record</strong>, not a chat scroll. Email, a call board, or a shared calendar people actually subscribe to.</li>
          <li><strong>Require an explicit yes</strong> per call from each person, and track it. A list of who has not confirmed is your Thursday-morning to-do list.</li>
          <li><strong>Re-confirm anything that changes.</strong> A changed call inherits zero confirmations.</li>
          <li><strong>Close the loop the same day.</strong> Chase the two holdouts while the change is fresh, not the night before.</li>
        </ul>
        <p>One-tap confirmations tied to each call (the model behind <a href="/help/scheduling/rsvp-and-confirmations">RSVP and confirmations</a>) exist precisely because "seen by 14" is not the same as "confirmed by 14."</p>

        <h2>Publish early, revise honestly</h2>
        <p>The last rule is temperamental, not technical. Publish the master schedule as early as you can, even knowing it will change, and then treat every revision as a small contract renegotiation: announce it clearly, flag exactly what moved, and re-collect confirmations for the affected calls. Casts do not resent schedule changes. They resent discovering them.</p>
        <p>Build the backbone, cross-reference the conflicts, call people to be used, and confirm everything twice. That is the whole craft of how to make a call schedule, and it is 90 percent discipline, 10 percent template.</p>

        <div class="callout"><b>Skip the copy-paste hour:</b> generate your whole rehearsal backbone in one pass with <a href="/help/scheduling/bulk-schedule-generation">bulk schedule generation</a> on <a href="/features#calendar">Proscene's production calendar</a>. Free for your first production, a 60-day trial, no card required.</div>
`,
};

// Index order: featured first, then newest-first.
export const BLOG_POSTS: BlogPost[] = [
  SETUP_POST,
  SCHEDULE_POST,
  TECH_WEEK_POST,
  BLOCKING_POST,
  REHEARSAL_REPORT_POST,
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

// ─────────────────────────────────────────────────────────────────────────
// Rendering (static fallback markup, mirrors the Sanity-rendered layout)
// ─────────────────────────────────────────────────────────────────────────

const ARROW_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>`;

function pillColor(cat: BlogCategory): string {
  return CATEGORY_COLOR[cat];
}

function relatedCard(slug: string): string {
  const p = getBlogPost(slug);
  if (!p) return "";
  return `
          <a href="/blog/${p.slug}">
            <div class="ph" data-label="${p.coverLabel}"></div>
            <div class="b"><h4>${p.title}</h4><span>${p.category} · ${p.readTime}</span></div>
          </a>`;
}

export function renderArticleHtml(post: BlogPost): string {
  const related = post.related.map(relatedCard).join("");
  return `
  <article>
    <header class="art-hero">
      <div class="wrap-narrow">
        <a class="art-back" href="/blog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg> Back to the blog</a>
        <div class="art-meta">
          <span class="pill" data-c="${pillColor(post.category)}">${post.category}</span>
          <span class="read mono" style="color:var(--ink-4)">${post.readTime} read</span>
        </div>
        <h1 class="art-title">${post.title}</h1>
        <p class="art-lede">${post.lede}</p>
        <div class="art-byline">
          <span class="av">PS</span>
          <div><b>The Proscene team</b><span>${post.date}</span></div>
        </div>
      </div>
      <div class="wrap">
        <div class="ph art-cover" data-accent data-label="${post.coverLabel}" style="${post.coverStyle}"></div>
      </div>
    </header>

    <div class="section">
      <div class="art-body">
${post.body}
      </div>

      <div class="art-foot">
        <span class="kicker">Written by the Proscene team</span>
        <div style="display:flex;gap:10px">
          <a class="btn primary sm" href="/signup">Start your production</a>
        </div>
      </div>

      <div class="wrap-narrow" style="margin-top:48px">
        <h3 class="subtitle" style="margin-bottom:4px">Keep reading</h3>
        <div class="more">${related}
        </div>
      </div>
    </div>
  </article>

  <!-- CTA -->
  <section class="section" style="padding-top:0">
    <div class="wrap">
      <div class="cta-band center reveal">
        <div class="cta-curtain"></div>
        <div style="position:relative">
          <h2 class="title" style="font-size:clamp(28px,4vw,46px)">Run your next show <em>on Proscene.</em></h2>
          <p class="lede" style="margin:18px auto 30px;max-width:46ch">Calls, calendar, script, blocking, and reports, in one place the whole company reads from.</p>
          <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
            <a class="btn primary lg" href="/signup">Start free</a>
            <a class="btn ghost lg" href="/features">Tour the features</a>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
}

function featuredCard(post: BlogPost): string {
  return `
      <a class="feat-post reveal" href="/blog/${post.slug}">
        <div class="ph" data-accent data-label="${post.coverLabel}"></div>
        <div class="body">
          <div class="meta">
            <span class="pill" data-c="${pillColor(post.category)}">${post.category}</span>
            <span class="read">${post.readTime} read</span>
          </div>
          <h2>${post.title}</h2>
          <p>${post.excerpt}</p>
          <span class="btn-link" style="display:inline-flex">Read the walkthrough ${ARROW_SVG}</span>
          <div class="by" style="margin-top:14px">The Proscene team · ${post.date}</div>
        </div>
      </a>`;
}

function gridCard(post: BlogPost): string {
  return `
        <a class="post" href="/blog/${post.slug}">
          <div class="ph" data-label="${post.coverLabel}"></div>
          <div class="body">
            <div class="meta"><span class="pill" data-c="${pillColor(post.category)}">${post.category}</span><span class="read">${post.readTime}</span></div>
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <div class="by">The Proscene team · ${post.date}</div>
          </div>
        </a>`;
}

export function renderBlogIndexHtml(): string {
  const featured = BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0];
  const rest = BLOG_POSTS.filter((p) => p !== featured);
  return `
  <section class="page-hero">
    <div class="wrap">
      <span class="eyebrow">The Proscene blog</span>
      <h1 class="display" style="margin-top:18px;font-size:clamp(34px,5vw,58px)">Notes from the <em>prompt desk.</em></h1>
      <p class="lede lede-narrow" style="margin-top:18px">Walkthroughs, stage-management craft, and the occasional opinion about call times, written by people who've held the book.</p>
    </div>
  </section>

  <!-- FEATURED -->
  <section class="section-tight">
    <div class="wrap">${featuredCard(featured)}
    </div>
  </section>

  <!-- GRID -->
  <section class="section" style="padding-top:8px">
    <div class="wrap">
      <div class="posts reveal">${rest.map(gridCard).join("")}
      </div>
    </div>
  </section>

  <!-- NEWSLETTER -->
  <section class="section" style="padding-top:0">
    <div class="wrap-narrow">
      <div class="card card-pad center reveal" style="padding:clamp(32px,4vw,48px)">
        <span class="eyebrow no-rule" style="justify-content:center;margin-bottom:14px">The half-hour call</span>
        <h3 class="subtitle">A short letter for stage managers, twice a month.</h3>
        <p class="lede" style="margin:12px auto 24px;max-width:46ch">Craft, product updates, and the occasional war story. No spam, unsubscribe in a tap.</p>
        <form style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;max-width:440px;margin:0 auto" data-noop-form>
          <input type="email" placeholder="you@theatre.com" aria-label="Email" style="flex:1;min-width:220px;height:50px;border:1px solid var(--border-strong);border-radius:var(--radius);padding:0 16px;font-size:15px;font-family:inherit;background:var(--bg-elev)">
          <button class="btn primary" style="height:50px" type="submit">Subscribe</button>
        </form>
      </div>
    </div>
  </section>
`;
}
