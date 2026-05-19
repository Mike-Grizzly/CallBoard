// Org-level people directory — mock data.
// People exist at the org level; each person can be assigned to multiple
// productions with different roles per production.

const ORG_ROLES = [
  // grouped by category for filtering
  { key:"director",      label:"Director",            cat:"Creative",    c:"accent" },
  { key:"assoc-dir",     label:"Associate Director",  cat:"Creative",    c:"accent" },
  { key:"sm",            label:"Stage Manager",       cat:"Stage Mgmt",  c:"" },
  { key:"asm",           label:"Asst. Stage Manager", cat:"Stage Mgmt",  c:"" },
  { key:"pa",            label:"Production Asst.",    cat:"Stage Mgmt",  c:"" },
  { key:"producer",      label:"Producer",            cat:"Admin",       c:"dusk" },
  { key:"gm",            label:"General Manager",     cat:"Admin",       c:"dusk" },
  { key:"md",            label:"Music Director",      cat:"Music",       c:"plum" },
  { key:"conductor",     label:"Conductor",           cat:"Music",       c:"plum" },
  { key:"accompanist",   label:"Accompanist",         cat:"Music",       c:"plum" },
  { key:"choreo",        label:"Choreographer",       cat:"Movement",    c:"plum" },
  { key:"costume-d",     label:"Costume Designer",    cat:"Design",      c:"clay" },
  { key:"lighting-d",    label:"Lighting Designer",   cat:"Design",      c:"amber" },
  { key:"sound-d",       label:"Sound Designer",      cat:"Design",      c:"dusk" },
  { key:"set-d",         label:"Set Designer",        cat:"Design",      c:"sage" },
  { key:"props-master",  label:"Props Master",        cat:"Crew",        c:"sand" },
  { key:"cast-principal",label:"Cast — Principal",    cat:"Cast",        c:"clay" },
  { key:"cast-featured", label:"Cast — Featured",     cat:"Cast",        c:"clay" },
  { key:"cast-ensemble", label:"Cast — Ensemble",     cat:"Cast",        c:"plum" },
  { key:"crew",          label:"Crew",                cat:"Crew",        c:"sand" },
];

// Permission levels — per person, org-wide default. Can be overridden per production.
const PERMISSIONS = [
  { key:"admin",  label:"Admin",   hint:"Full org access" },
  { key:"editor", label:"Editor",  hint:"Edit assigned productions" },
  { key:"viewer", label:"Viewer",  hint:"Read-only on assigned productions" },
  { key:"cast",   label:"Cast",    hint:"Sees own calls + cast-facing report views" },
];

// Pronouns options
const PRONOUNS = ["she/her", "he/him", "they/them", "she/they", "he/they", "—"];

// Mock org-level user directory (40 people).
// "assigns" = current production assignments [{prod, role, c}]
const PEOPLE = [
  { id:"p1",  name:"Maya Okafor",       email:"maya@wellman.co",          phone:"(617) 555-0142", pronouns:"she/her",   role:"Stage Manager",       roleKey:"sm",            cat:"Stage Mgmt", permission:"admin",  status:"active",  joined:"Sep 2022", lastActive:"5 min ago", c:"",       initials:"MO", you:true,
      assigns:[{prod:"Pirates of Penzance", role:"Stage Manager", c:""}, {prod:"The Mikado", role:"Asst. Stage Manager", c:""}] },
  { id:"p2",  name:"Eleanor Bryce",     email:"eleanor.bryce@wellman.co", phone:"(617) 555-0118", pronouns:"she/her",   role:"Director",            roleKey:"director",      cat:"Creative", permission:"editor",  status:"active",  joined:"Mar 2021", lastActive:"22 min ago", c:"accent", initials:"EB",
      assigns:[{prod:"Pirates of Penzance", role:"Director", c:"accent"}] },
  { id:"p3",  name:"Helena Voss",       email:"helena.voss@wellman.co",   phone:"(617) 555-0193", pronouns:"she/her",   role:"Music Director",      roleKey:"md",            cat:"Music",    permission:"editor",  status:"active",  joined:"Jan 2022", lastActive:"1h ago", c:"plum",   initials:"HV",
      assigns:[{prod:"Pirates of Penzance", role:"Music Director", c:"plum"}, {prod:"Ruddigore", role:"Music Director", c:"plum"}] },
  { id:"p4",  name:"Adaeze Ife",        email:"adaeze.i@example.com",      phone:"(617) 555-0211", pronouns:"she/her",   role:"Costume Designer",    roleKey:"costume-d",     cat:"Design",   permission:"editor",  status:"active",  joined:"Aug 2023", lastActive:"3h ago", c:"clay",   initials:"AI",
      assigns:[{prod:"Pirates of Penzance", role:"Costume Designer", c:"clay"}] },
  { id:"p5",  name:"Renaud Tremblay",   email:"renaud.t@example.com",      phone:"(617) 555-0334", pronouns:"he/him",    role:"Lighting Designer",   roleKey:"lighting-d",    cat:"Design",   permission:"editor",  status:"active",  joined:"Oct 2022", lastActive:"yesterday", c:"amber",  initials:"RT",
      assigns:[{prod:"Pirates of Penzance", role:"Lighting Designer", c:"amber"}, {prod:"The Mikado", role:"Lighting Designer", c:"amber"}] },
  { id:"p6",  name:"Sergei Karavaev",   email:"sergei.k@example.com",      phone:"(617) 555-0388", pronouns:"he/him",    role:"Set Designer",        roleKey:"set-d",         cat:"Design",   permission:"editor",  status:"active",  joined:"May 2023", lastActive:"yesterday", c:"sage",   initials:"SK",
      assigns:[{prod:"Pirates of Penzance", role:"Set Designer", c:"sage"}] },
  { id:"p7",  name:"Theo Marsh",        email:"theo.marsh@example.com",    phone:"(617) 555-0455", pronouns:"he/him",    role:"Cast — Principal",    roleKey:"cast-principal", cat:"Cast",    permission:"cast",    status:"active",  joined:"Jan 2024", lastActive:"2h ago", c:"clay",   initials:"TM",
      assigns:[{prod:"Pirates of Penzance", role:"Frederic", c:"clay"}, {prod:"Into the Woods (2024)", role:"Baker", c:"clay"}] },
  { id:"p8",  name:"Priya Anand",       email:"priya@example.com",         phone:"(617) 555-0512", pronouns:"she/her",   role:"Cast — Principal",    roleKey:"cast-principal", cat:"Cast",    permission:"cast",    status:"active",  joined:"Feb 2024", lastActive:"yesterday", c:"plum",   initials:"PA",
      assigns:[{prod:"Pirates of Penzance", role:"Mabel", c:"plum"}, {prod:"Carousel (2025)", role:"Julie", c:"plum"}] },
  { id:"p9",  name:"Marcus Beale",      email:"marcus.beale@example.com",  phone:"(617) 555-0577", pronouns:"he/him",    role:"Cast — Principal",    roleKey:"cast-principal", cat:"Cast",    permission:"cast",    status:"active",  joined:"Mar 2023", lastActive:"2h ago", c:"dusk",   initials:"MB",
      assigns:[{prod:"Pirates of Penzance", role:"Pirate King", c:"dusk"}, {prod:"Anything Goes (2025)", role:"Moonface", c:"dusk"}] },
  { id:"p10", name:"Walter Ek",         email:"wek@example.com",           phone:"(617) 555-0610", pronouns:"he/him",    role:"Cast — Principal",    roleKey:"cast-principal", cat:"Cast",    permission:"cast",    status:"active",  joined:"Apr 2022", lastActive:"3d ago", c:"amber",  initials:"WE",
      assigns:[{prod:"Pirates of Penzance", role:"Major-General", c:"amber"}] },
  { id:"p11", name:"Imogen Hart",       email:"imogen.h@example.com",      phone:"(617) 555-0666", pronouns:"she/her",   role:"Cast — Principal",    roleKey:"cast-principal", cat:"Cast",    permission:"cast",    status:"active",  joined:"Nov 2023", lastActive:"yesterday", c:"sage",   initials:"IH",
      assigns:[{prod:"Pirates of Penzance", role:"Ruth", c:"sage"}] },
  { id:"p12", name:"Jonas Lin",         email:"jonas.l@example.com",       phone:"(617) 555-0722", pronouns:"he/him",    role:"Cast — Principal",    roleKey:"cast-principal", cat:"Cast",    permission:"cast",    status:"active",  joined:"Jun 2024", lastActive:"5h ago", c:"sand",   initials:"JL",
      assigns:[{prod:"Pirates of Penzance", role:"Sergeant", c:"sand"}] },
  { id:"p13", name:"Nora Quinn",        email:"nora.q@example.com",        phone:"(617) 555-0801", pronouns:"she/her",   role:"Cast — Ensemble",     roleKey:"cast-ensemble", cat:"Cast",    permission:"cast",    status:"active",  joined:"Feb 2024", lastActive:"yesterday", c:"plum",   initials:"NQ",
      assigns:[{prod:"Pirates of Penzance", role:"Edith", c:"plum"}] },
  { id:"p14", name:"Sasha Patel",       email:"sasha.p@example.com",       phone:"(617) 555-0855", pronouns:"she/her",   role:"Cast — Ensemble",     roleKey:"cast-ensemble", cat:"Cast",    permission:"cast",    status:"active",  joined:"Feb 2024", lastActive:"2d ago", c:"plum",   initials:"SP",
      assigns:[{prod:"Pirates of Penzance", role:"Kate", c:"plum"}] },
  { id:"p15", name:"Lila Rowe",         email:"lila.rowe@example.com",     phone:"(617) 555-0903", pronouns:"she/her",   role:"Cast — Ensemble",     roleKey:"cast-ensemble", cat:"Cast",    permission:"cast",    status:"active",  joined:"Mar 2024", lastActive:"4h ago", c:"plum",   initials:"LR",
      assigns:[{prod:"Pirates of Penzance", role:"Isabel", c:"plum"}] },
  { id:"p16", name:"Diego Vargas",      email:"diego.v@example.com",       phone:"(617) 555-0998", pronouns:"he/him",    role:"Cast — Ensemble",     roleKey:"cast-ensemble", cat:"Cast",    permission:"cast",    status:"active",  joined:"Jan 2024", lastActive:"3d ago", c:"dusk",   initials:"DV",
      assigns:[{prod:"Pirates of Penzance", role:"Samuel", c:"dusk"}] },
  { id:"p17", name:"Quinn Adler",       email:"quinn.adler@example.com",   phone:"(617) 555-1021", pronouns:"they/them", role:"Choreographer",       roleKey:"choreo",        cat:"Movement", permission:"editor",  status:"active",  joined:"Sep 2023", lastActive:"yesterday", c:"plum",   initials:"QA",
      assigns:[{prod:"Pirates of Penzance", role:"Choreographer", c:"plum"}] },
  { id:"p18", name:"Eli Hartman",       email:"eli.hartman@example.com",   phone:"(617) 555-1108", pronouns:"he/him",    role:"Props Master",        roleKey:"props-master",  cat:"Crew",    permission:"editor",  status:"active",  joined:"Aug 2022", lastActive:"6h ago", c:"sand",   initials:"EH",
      assigns:[{prod:"Pirates of Penzance", role:"Props Master", c:"sand"}, {prod:"The Mikado", role:"Props Master", c:"sand"}] },
  { id:"p19", name:"Sasha Petrov",      email:"sasha.petr@example.com",    phone:"(617) 555-1199", pronouns:"she/her",   role:"Asst. Stage Manager", roleKey:"asm",           cat:"Stage Mgmt", permission:"editor",  status:"active",  joined:"Oct 2023", lastActive:"30 min ago", c:"",       initials:"SP",
      assigns:[{prod:"The Mikado", role:"Stage Manager", c:""}, {prod:"Pirates of Penzance", role:"ASM", c:""}] },
  { id:"p20", name:"June Castellanos",  email:"june.c@example.com",        phone:"(617) 555-1244", pronouns:"she/they",  role:"Sound Designer",      roleKey:"sound-d",       cat:"Design",   permission:"editor",  status:"active",  joined:"Mar 2024", lastActive:"yesterday", c:"dusk",   initials:"JC",
      assigns:[{prod:"The Mikado", role:"Sound Designer", c:"dusk"}] },
  { id:"p21", name:"Imani Brooks",      email:"imani.brooks@example.com",  phone:"(617) 555-1301", pronouns:"she/her",   role:"Producer",            roleKey:"producer",      cat:"Admin",    permission:"admin",   status:"active",  joined:"Jul 2021", lastActive:"yesterday", c:"dusk",   initials:"IB",
      assigns:[{prod:"Pirates of Penzance", role:"Producer", c:"dusk"}, {prod:"The Mikado", role:"Producer", c:"dusk"}, {prod:"Ruddigore", role:"Producer", c:"dusk"}] },
  { id:"p22", name:"Felix Beaumont",    email:"felix.b@example.com",       phone:"(617) 555-1356", pronouns:"he/him",    role:"Conductor",           roleKey:"conductor",     cat:"Music",    permission:"editor",  status:"active",  joined:"May 2023", lastActive:"3d ago", c:"plum",   initials:"FB",
      assigns:[{prod:"Ruddigore", role:"Conductor", c:"plum"}] },
  { id:"p23", name:"Yuki Tanaka",       email:"yuki.t@example.com",        phone:"(617) 555-1422", pronouns:"she/her",   role:"Accompanist",         roleKey:"accompanist",   cat:"Music",    permission:"editor",  status:"active",  joined:"Feb 2023", lastActive:"yesterday", c:"plum",   initials:"YT",
      assigns:[{prod:"Pirates of Penzance", role:"Accompanist", c:"plum"}] },
  { id:"p24", name:"Marisol Cruz",      email:"marisol.c@example.com",     phone:"(617) 555-1488", pronouns:"she/her",   role:"Associate Director",  roleKey:"assoc-dir",     cat:"Creative", permission:"editor",  status:"active",  joined:"Nov 2022", lastActive:"2d ago", c:"accent", initials:"MC",
      assigns:[{prod:"The Mikado", role:"Director", c:"accent"}] },
  { id:"p25", name:"Owen Pritchard",    email:"owen.p@example.com",        phone:"(617) 555-1545", pronouns:"he/him",    role:"General Manager",     roleKey:"gm",            cat:"Admin",    permission:"admin",   status:"active",  joined:"Jan 2020", lastActive:"4h ago", c:"dusk",   initials:"OP",
      assigns:[] },
  { id:"p26", name:"Kira Volkov",       email:"kira.v@example.com",        phone:"(617) 555-1612", pronouns:"she/her",   role:"Production Asst.",    roleKey:"pa",            cat:"Stage Mgmt", permission:"editor",  status:"active",  joined:"Aug 2024", lastActive:"yesterday", c:"",       initials:"KV",
      assigns:[{prod:"Pirates of Penzance", role:"PA", c:""}] },
  { id:"p27", name:"Devon Asher",       email:"devon.a@example.com",       phone:"(617) 555-1677", pronouns:"he/they",   role:"Crew",                roleKey:"crew",          cat:"Crew",    permission:"editor",  status:"active",  joined:"Jun 2024", lastActive:"5d ago", c:"sand",   initials:"DA",
      assigns:[{prod:"Pirates of Penzance", role:"Run Crew", c:"sand"}] },
  { id:"p28", name:"Rosa Linden",       email:"rosa.l@example.com",        phone:"(617) 555-1722", pronouns:"she/her",   role:"Cast — Featured",     roleKey:"cast-featured", cat:"Cast",    permission:"cast",    status:"active",  joined:"Apr 2024", lastActive:"yesterday", c:"clay",   initials:"RL",
      assigns:[{prod:"The Mikado", role:"Yum-Yum", c:"clay"}] },
  { id:"p29", name:"Anders Holm",       email:"anders.h@example.com",      phone:"(617) 555-1801", pronouns:"he/him",    role:"Cast — Principal",    roleKey:"cast-principal", cat:"Cast",    permission:"cast",    status:"active",  joined:"Sep 2023", lastActive:"3d ago", c:"clay",   initials:"AH",
      assigns:[{prod:"The Mikado", role:"The Mikado", c:"clay"}] },
  { id:"p30", name:"Tabitha Pell",      email:"tabitha.p@example.com",     phone:"(617) 555-1855", pronouns:"she/her",   role:"Cast — Ensemble",     roleKey:"cast-ensemble", cat:"Cast",    permission:"cast",    status:"invited", joined:"May 2026", lastActive:"never", c:"plum",   initials:"TP",
      assigns:[{prod:"Pirates of Penzance", role:"Daughter chorus", c:"plum"}] },
  { id:"p31", name:"Olu Adebayo",       email:"olu.a@example.com",         phone:"(617) 555-1922", pronouns:"he/him",    role:"Cast — Ensemble",     roleKey:"cast-ensemble", cat:"Cast",    permission:"cast",    status:"invited", joined:"May 2026", lastActive:"never", c:"dusk",   initials:"OA",
      assigns:[{prod:"Pirates of Penzance", role:"Pirate", c:"dusk"}] },
  { id:"p32", name:"Etta Whitfield",    email:"etta.w@example.com",        phone:"(617) 555-2011", pronouns:"she/her",   role:"Cast — Principal",    roleKey:"cast-principal", cat:"Cast",    permission:"cast",    status:"active",  joined:"Aug 2022", lastActive:"1 wk ago", c:"clay",   initials:"EW",
      assigns:[] },
  { id:"p33", name:"Bram Voss",         email:"bram.v@example.com",        phone:"(617) 555-2098", pronouns:"he/him",    role:"Lighting Designer",   roleKey:"lighting-d",    cat:"Design",   permission:"editor",  status:"inactive", joined:"Feb 2022", lastActive:"3 mo ago", c:"amber",  initials:"BV",
      assigns:[] },
];

// Past + active production names (for assigning).
const ALL_PRODUCTIONS = [
  "Pirates of Penzance",
  "The Mikado",
  "Ruddigore",
  "Into the Woods (2024)",
  "Carousel (2025)",
  "Anything Goes (2025)",
  "H.M.S. Pinafore (2024)",
];

Object.assign(window, { ORG_ROLES, PERMISSIONS, PRONOUNS, PEOPLE, ALL_PRODUCTIONS });
