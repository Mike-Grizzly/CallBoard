// Mock data for the demo. Stage Manager perspective on Pirates of Penzance.

const ME = {
  name: "Maya Okafor",
  role: "Stage Manager",
  initials: "MO",
};

const PRODUCTIONS = [
  { id: "pirates", title: "The Pirates of Penzance", venue: "Wellman Theatre", color: "var(--accent)", role: "Stage Manager", week: "Week 4 of 6", status: "In rehearsal", unread: 3 },
  { id: "mikado", title: "The Mikado", venue: "Studio B", color: "var(--c-dusk)", role: "Asst. Stage Manager", week: "Pre-production", status: "Planning", unread: 0 },
  { id: "ruddigore", title: "Ruddigore", venue: "Wellman Theatre", color: "var(--c-sage)", role: "PA", week: "Closed", status: "Archived", unread: 0 },
];

const CAST = [
  { id:"c1",  name:"Frederic",          actor:"Theo Marsh",       initials:"TM", color:"clay",  type:"Principal" },
  { id:"c2",  name:"Mabel",             actor:"Priya Anand",      initials:"PA", color:"plum",  type:"Principal" },
  { id:"c3",  name:"Pirate King",       actor:"Marcus Beale",     initials:"MB", color:"dusk",  type:"Principal" },
  { id:"c4",  name:"Major-General",     actor:"Walter Ek",        initials:"WE", color:"amber", type:"Principal" },
  { id:"c5",  name:"Ruth",              actor:"Imogen Hart",      initials:"IH", color:"sage",  type:"Principal" },
  { id:"c6",  name:"Sergeant",          actor:"Jonas Lin",        initials:"JL", color:"sand",  type:"Principal" },
  { id:"c7",  name:"Edith",             actor:"Nora Quinn",       initials:"NQ", color:"plum",  type:"Daughter" },
  { id:"c8",  name:"Kate",              actor:"Sasha Patel",      initials:"SP", color:"plum",  type:"Daughter" },
  { id:"c9",  name:"Isabel",            actor:"Lila Rowe",        initials:"LR", color:"plum",  type:"Daughter" },
  { id:"c10", name:"Samuel",            actor:"Diego Vargas",     initials:"DV", color:"dusk",  type:"Pirate" },
];

const TABS = [
  { id:"overview",  label:"Overview",         icon:"Layout"    },
  { id:"reports",   label:"Rehearsal Reports",icon:"Clipboard", count: 12 },
  { id:"notes",     label:"My Notes",         icon:"Pencil",    count: 8 },
  { id:"documents", label:"Documents",        icon:"Folder",    count: 24 },
  { id:"video",     label:"Rehearsal Video",  icon:"Film",      count: 6 },
  { id:"blocking",  label:"Stage Blocking",   icon:"Move"      },
];

const NOTIFICATIONS = [
  { id:1, ico:"Clipboard", c:"accent", title:"Rehearsal Report #11 needs your sign-off", body:"Director left 2 comments on Act II run.", when:"12m", unread:true },
  { id:2, ico:"Alert",     c:"amber",  title:"Costume fitting moved to Friday",          body:"Costume Dept. updated the schedule.",     when:"1h",  unread:true },
  { id:3, ico:"Mail",      c:"sage",   title:"Theo Marsh confirmed Saturday call",       body:"Replied to call sheet for May 9.",         when:"3h",  unread:true },
  { id:4, ico:"File",      c:"",       title:"Music Director uploaded vocal score v3",   body:"Pirates of Penzance / Documents / Score",  when:"yest.", unread:false },
  { id:5, ico:"Users",     c:"",       title:"Lighting designer joined the production",  body:"Adaeze Ife now has access.",               when:"2d",  unread:false },
];

const REPORTS = [
  { id:11, num:"R-11", date:"May 4", weekday:"Mon", scene:"Act II — Run", calls:"7:00 PM – 10:30 PM", status:"Pending review", c:"amber", absences:1, late:0, injuries:0, dept:5 },
  { id:10, num:"R-10", date:"May 3", weekday:"Sun", scene:"Act I — Stumble", calls:"2:00 PM – 6:00 PM", status:"Distributed", c:"sage", absences:0, late:1, injuries:0, dept:3 },
  { id:9,  num:"R-09", date:"May 2", weekday:"Sat", scene:"Music — Pirates Chorus", calls:"10:00 AM – 1:00 PM", status:"Distributed", c:"sage", absences:0, late:0, injuries:0, dept:2 },
  { id:8,  num:"R-08", date:"May 1", weekday:"Fri", scene:"Blocking II.4", calls:"7:00 PM – 10:30 PM", status:"Distributed", c:"sage", absences:2, late:0, injuries:1, dept:6 },
  { id:7,  num:"R-07", date:"Apr 30",weekday:"Thu", scene:"Tablework Act II", calls:"7:00 PM – 9:30 PM", status:"Distributed", c:"sage", absences:0, late:0, injuries:0, dept:1 },
  { id:6,  num:"R-06", date:"Apr 29",weekday:"Wed", scene:"Music — Mabel/Frederic", calls:"7:30 PM – 10:00 PM", status:"Distributed", c:"sage", absences:1, late:0, injuries:0, dept:2 },
];

// Detailed report (for the open editor) — industry-standard fields.
const ACTIVE_REPORT = {
  num: "R-11", date: "Monday, May 4, 2026", weekday: "Mon",
  rehearsal: 24, of: 36,
  start: "7:00 PM", end: "10:30 PM",
  breaks: [ {start:"8:25 PM", end:"8:35 PM", kind:"10-min"}, {start:"9:35 PM", end:"9:40 PM", kind:"5-min"} ],
  totalRehearsal: "3h 15m",
  scenesWorked: [
    { label:"Act II, Sc. 1 — Ruined Chapel",    pages:"42–48", time:"55m" },
    { label:"Act II, Sc. 2 — Pirates Approach", pages:"49–58", time:"1h 10m" },
    { label:"Run — Act II top to finale",       pages:"42–72", time:"1h 00m" },
  ],
  attendance: {
    present: 18, absent: 1, late: 0,
    notes: [
      { who:"Walter Ek (Major-General)", note:"Excused absence — vocal rest, returns Wed.", c:"amber" },
    ],
  },
  injuries: [],
  schedule: [
    { who:"Costume", what:"Fitting for daughters chorus moved Thu → Fri 4–6 PM", c:"clay" },
    { who:"Music",   what:"Sitzprobe pushed to Sat May 9 at 1 PM",               c:"dusk" },
  ],
  notes: {
    director: "Strong table work in pirate chorus opening; let's revisit Mabel's entrance staging — feels rushed at bar 47.",
    costumes: "Need bloomer adjustments for Edith and Kate. Pirate King boots came in too tight — exchange.",
    props:    "Cutlass #3 has loose hilt — repair before Wed. Need 6 additional handkerchiefs for daughters.",
    set:      "Confirm chapel ruin practical works — flicker timing too quick. Adjust hinges on stage-left flat.",
    lighting: "Cue 87 holding too long on Mabel — trim by 2 counts. Flash pot rehearsal scheduled Sat AM.",
    sound:    "Wireless pack #4 dropping out intermittently — swap and retest. Foghorn needs 2 dB boost.",
    music:    "Tempo on 'Hail, Poetry' settled at q=72. Frederic's high B in Act II finale still landing inconsistently.",
    stage:    "House lights in 5 cue placement working well. Run order tomorrow: warm-ups → Act I top → notes.",
  },
  lineNotes: [
    { who:"Frederic", line:"\"…my duty done\"", issue:"called for line — paraphrased twice in sc. 1" },
    { who:"Ruth",     line:"opening monologue", issue:"clean run — flag for memorization Wed" },
    { who:"Pirate K.",line:"\"orphan boy\" callback", issue:"dropped on first pass — got it on second" },
  ],
};

const NOTES = [
  { id:1, kind:"todo", done:false, pinned:true, title:"Print updated call sheets for Wed", tag:"Calls", c:"accent", due:"Tomorrow", body:"Need 22 copies — leave at SM table." },
  { id:2, kind:"todo", done:false, pinned:true, title:"Confirm cutlass repair w/ props", tag:"Props", c:"clay", due:"Wed", body:"Cutlass #3 — loose hilt. Talk to Eli." },
  { id:3, kind:"todo", done:true,  pinned:false, title:"Update contact sheet with Adaeze", tag:"Admin", c:"sand", due:"Done", body:"" },
  { id:4, kind:"note", done:false, pinned:false, title:"Sitzprobe room booking", tag:"Music", c:"dusk", due:"Sat", body:"Studio B confirmed 1–4 PM. Piano in place. Coordinate w/ MD on score copies." },
  { id:5, kind:"todo", done:false, pinned:false, title:"Walk-through new flash pot SOP", tag:"Safety", c:"amber", due:"Sat AM", body:"Coordinate w/ FX. Brief cast on safe distance." },
  { id:6, kind:"note", done:false, pinned:false, title:"Mabel's entrance — staging tweak", tag:"Blocking", c:"plum", due:"", body:"Director wants slower reveal. Try moving Edith DSL to give Mabel the apron. Test Wed." },
  { id:7, kind:"todo", done:false, pinned:false, title:"Send Friday's report by 11 PM", tag:"Reports", c:"sage", due:"Fri", body:"Distribute to producer + design team." },
  { id:8, kind:"note", done:false, pinned:false, title:"Daughters chorus — diction", tag:"Music", c:"dusk", due:"", body:"\"Climbing over rocky mountain\" — consonants getting eaten. Flag for MD." },
];

const DOCS = [
  { id:1, name:"Pirates_VocalScore_v3.pdf",  kind:"score", size:"4.2 MB", who:"Helena Voss",      when:"yesterday", folder:"Score",       starred:true,  shared:12 },
  { id:2, name:"Act II — Blocking Notation.pdf", kind:"pdf", size:"1.1 MB", who:"Maya Okafor",     when:"2 days ago", folder:"Blocking",    starred:true,  shared:8  },
  { id:3, name:"Costume Plot — Daughters.png", kind:"img",  size:"3.8 MB", who:"Adaeze Ife",       when:"3 days ago", folder:"Costumes",    starred:false, shared:6  },
  { id:4, name:"Cue Sheet — Lighting v2.pdf",  kind:"pdf",  size:"820 KB", who:"Renaud Tremblay",  when:"3 days ago", folder:"Lighting",    starred:false, shared:5  },
  { id:5, name:"Pirates_Pirates_Chorus.mp3",   kind:"audio",size:"6.4 MB", who:"Helena Voss",      when:"4 days ago", folder:"Score",       starred:false, shared:18 },
  { id:6, name:"Set Ground Plan — Final.pdf",  kind:"pdf",  size:"2.3 MB", who:"Sergei Karavaev",  when:"1 wk ago",   folder:"Set",         starred:true,  shared:14 },
  { id:7, name:"Contact Sheet — Company.pdf",  kind:"pdf",  size:"180 KB", who:"Maya Okafor",      when:"1 wk ago",   folder:"Admin",       starred:false, shared:22 },
  { id:8, name:"Daughter chorus_choreo.mp4",   kind:"video",size:"58 MB",  who:"Quinn Adler",      when:"1 wk ago",   folder:"Choreography",starred:false, shared:9  },
  { id:9, name:"Production Calendar.pdf",      kind:"pdf",  size:"310 KB", who:"Maya Okafor",      when:"2 wks ago",  folder:"Admin",       starred:false, shared:24 },
];
const DOC_FOLDERS = [
  { name:"All files", count:24 },
  { name:"Score",        count:5 },
  { name:"Blocking",     count:3 },
  { name:"Costumes",     count:4 },
  { name:"Lighting",     count:2 },
  { name:"Set",          count:3 },
  { name:"Choreography", count:2 },
  { name:"Admin",        count:5 },
];

const VIDEOS = [
  { id:1, title:"Act II Run-through",        date:"May 4", duration:"1:42:08", scene:"Act II — Full",         thumbHue:25,  notes:8 },
  { id:2, title:"Stumble — Act I",           date:"May 3", duration:"58:42",   scene:"Act I — Stumble",       thumbHue:260, notes:3 },
  { id:3, title:"Pirates Chorus Music",      date:"May 2", duration:"42:15",   scene:"Music — Chorus",        thumbHue:145, notes:5 },
  { id:4, title:"Blocking II.4",             date:"May 1", duration:"1:08:21", scene:"Blocking II.4",         thumbHue:75,  notes:11 },
  { id:5, title:"Mabel/Frederic Duet — Music", date:"Apr 29", duration:"36:54", scene:"Music — Duet",         thumbHue:35,  notes:2 },
  { id:6, title:"Tablework Act II",          date:"Apr 30", duration:"24:18",  scene:"Tablework",             thumbHue:320, notes:0 },
];

window.DATA = { ME, PRODUCTIONS, CAST, TABS, NOTIFICATIONS, REPORTS, ACTIVE_REPORT, NOTES, DOCS, DOC_FOLDERS, VIDEOS };
