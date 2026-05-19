// Workspace Calendar — week/month/day views across all productions.
//
// Stage manager perspective: events from every production Maya is on,
// color-coded to match the rail. Conflicts (actor double-booked) are flagged.

const { I: CalI } = window;
const { PRODUCTIONS: Cal_PRODS, CAST: Cal_CAST } = window.DATA;

// ─── Event data ──────────────────────────────────────────────────────
// Anchor: Monday May 4, 2026. Build a 3-week span so prev/next has content.
// time = "HH:MM" 24h, durMin
const EVENT_TYPES = [
  { id:"rehearsal", label:"Rehearsal",   ico:"Drama",     c:"clay"   },
  { id:"performance", label:"Performance", ico:"Star",    c:"accent" },
  { id:"tech",      label:"Tech / Dress", ico:"Lightbulb",c:"amber"  },
  { id:"music",     label:"Music",       ico:"Music",     c:"dusk"   },
  { id:"fitting",   label:"Fittings",    ico:"User",      c:"plum"   },
  { id:"meeting",   label:"Meetings",    ico:"Users",     c:"sand"   },
  { id:"hold",      label:"Holds",       ico:"Clock",     c:""       },
  { id:"personal",  label:"Personal",    ico:"Sparkle",   c:"sage"   },
];

const EVENTS = [
  // ─── Mon May 4 ───
  { id:"e1",  prod:"pirates",  type:"rehearsal", title:"Act II — Stumble run", loc:"Studio A · Wellman",
    date:"2026-05-04", time:"19:00", durMin:210, called:18, total:22, lead:"Eleanor Bryce" },
  { id:"e2",  prod:"pirates",  type:"meeting",   title:"Production meeting",   loc:"Conf Rm 2",
    date:"2026-05-04", time:"15:00", durMin:60,  called:8,  total:8,  lead:"Maya Okafor" },

  // ─── Tue May 5 ───
  { id:"e3",  prod:"mikado",   type:"meeting",   title:"Design presentation",  loc:"Studio B",
    date:"2026-05-05", time:"10:00", durMin:120, called:6,  total:6,  lead:"Jules Renforth" },
  { id:"e4",  prod:"pirates",  type:"fitting",   title:"Daughters — bloomers", loc:"Costume Shop",
    date:"2026-05-05", time:"14:00", durMin:120, called:3,  total:3,  lead:"Adaeze Ife",
    cast:["NQ","SP","LR"] },
  { id:"e5",  prod:"pirates",  type:"rehearsal", title:"Music — Pirates chorus",loc:"Studio A",
    date:"2026-05-05", time:"19:00", durMin:180, called:12, total:12, lead:"Helena Voss" },

  // ─── Wed May 6 ───
  { id:"e6",  prod:"",         type:"personal",  title:"Fire safety drill",    loc:"Wellman — full building",
    date:"2026-05-06", time:"09:55", durMin:25,  scope:"org",  lead:"Patrice Boudreau" },
  { id:"e7",  prod:"pirates",  type:"rehearsal", title:"Act I — Stumble",      loc:"Studio A",
    date:"2026-05-06", time:"19:00", durMin:210, called:20, total:22, lead:"Eleanor Bryce" },
  { id:"e8",  prod:"pirates",  type:"hold",      title:"Hold — Walter Ek",     loc:"vocal rest",
    date:"2026-05-06", time:"00:00", durMin:1440,allDay:true, who:"WE" },

  // ─── Thu May 7 ───
  { id:"e9",  prod:"pirates",  type:"rehearsal", title:"Blocking II.4",        loc:"Studio A",
    date:"2026-05-07", time:"19:00", durMin:210, called:14, total:14, lead:"Eleanor Bryce" },
  { id:"e10", prod:"mikado",   type:"meeting",   title:"Read-through — Act I", loc:"Studio B",
    date:"2026-05-07", time:"14:00", durMin:180, called:12, total:12, lead:"Jules Renforth",
    conflict:"NQ" },

  // ─── Fri May 8 ───
  { id:"e11", prod:"pirates",  type:"fitting",   title:"Pirate King — boot exchange", loc:"Costume Shop",
    date:"2026-05-08", time:"11:00", durMin:60,  called:1,  total:1,  lead:"Adaeze Ife", cast:["MB"] },
  { id:"e12", prod:"pirates",  type:"rehearsal", title:"Act II — Run",         loc:"Studio A",
    date:"2026-05-08", time:"19:00", durMin:210, called:22, total:22, lead:"Eleanor Bryce" },
  { id:"e13", prod:"pirates",  type:"meeting",   title:"Send R-12 report",     loc:"async · 11 PM deadline",
    date:"2026-05-08", time:"22:00", durMin:60,  called:1, total:1, lead:"Maya Okafor",
    me:true },

  // ─── Sat May 9 ───
  { id:"e14", prod:"pirates",  type:"music",     title:"Sitzprobe — full company",loc:"Studio B",
    date:"2026-05-09", time:"13:00", durMin:240, called:22, total:22, lead:"Helena Voss", anchor:true },
  { id:"e15", prod:"pirates",  type:"tech",      title:"Flash-pot rehearsal",  loc:"Studio A",
    date:"2026-05-09", time:"10:00", durMin:120, called:8,  total:8,  lead:"FX Team" },

  // ─── Sun May 10 ───
  { id:"e16", prod:"pirates",  type:"rehearsal", title:"Act II — Stumble run", loc:"Studio A",
    date:"2026-05-10", time:"14:00", durMin:240, called:22, total:22, lead:"Eleanor Bryce" },
  { id:"e17", prod:"",         type:"personal",  title:"Strike crew dinner",   loc:"Riccardo's on 7th",
    date:"2026-05-10", time:"18:30", durMin:150, scope:"org", lead:"Maya Okafor" },

  // ─── Previous week (Apr 27 – May 3) — for back-nav ───
  { id:"p1",  prod:"pirates",  type:"rehearsal", title:"Tablework Act II",     loc:"Studio A",
    date:"2026-04-30", time:"19:00", durMin:150, called:14, total:22 },
  { id:"p2",  prod:"pirates",  type:"music",     title:"Mabel/Frederic duet",  loc:"Studio B",
    date:"2026-04-29", time:"19:30", durMin:150, called:3, total:3 },
  { id:"p3",  prod:"pirates",  type:"rehearsal", title:"Blocking II.4",        loc:"Studio A",
    date:"2026-05-01", time:"19:00", durMin:210, called:18, total:22 },
  { id:"p4",  prod:"pirates",  type:"music",     title:"Pirates chorus",       loc:"Studio A",
    date:"2026-05-02", time:"10:00", durMin:180, called:12, total:12 },
  { id:"p5",  prod:"pirates",  type:"rehearsal", title:"Act I — Stumble",      loc:"Studio A",
    date:"2026-05-03", time:"14:00", durMin:240, called:22, total:22 },

  // ─── Next week (May 11 – May 17) — opening week ───
  { id:"n1",  prod:"pirates",  type:"tech",      title:"Tech Day 1 — Act I",   loc:"Mainstage",
    date:"2026-05-18", time:"13:00", durMin:600, called:22, total:22, lead:"Maya Okafor" },
  { id:"n2",  prod:"pirates",  type:"tech",      title:"Tech Day 2 — Act II",  loc:"Mainstage",
    date:"2026-05-19", time:"13:00", durMin:600, called:22, total:22 },
  { id:"n3",  prod:"pirates",  type:"tech",      title:"Dress rehearsal",      loc:"Mainstage",
    date:"2026-05-21", time:"19:00", durMin:240, called:22, total:22 },
  { id:"n4",  prod:"pirates",  type:"tech",      title:"Final dress · invited",loc:"Mainstage",
    date:"2026-05-22", time:"19:00", durMin:240, called:22, total:22 },
  { id:"n5",  prod:"pirates",  type:"performance",title:"Opening Night",       loc:"Mainstage",
    date:"2026-05-23", time:"19:30", durMin:180, called:22, total:22, anchor:true },
  { id:"n6",  prod:"pirates",  type:"performance",title:"Performance 2",       loc:"Mainstage",
    date:"2026-05-24", time:"14:00", durMin:180, called:22, total:22 },
  { id:"n7",  prod:"mikado",   type:"meeting",   title:"White model review",   loc:"Studio B",
    date:"2026-05-12", time:"10:00", durMin:120, called:8,  total:8 },
  { id:"n8",  prod:"mikado",   type:"meeting",   title:"Casting callbacks",    loc:"Studio B",
    date:"2026-05-14", time:"15:00", durMin:240, called:12, total:12 },
];

// ─── Date helpers ────────────────────────────────────────────────────
const ymd = (d) => d.toISOString().slice(0,10);
const parseYmd = (s) => { const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d); };
const sameYMD = (a,b) => a.toDateString() === b.toDateString();
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const startOfWeek = (d) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0,0,0,0); return x; };
const startOfMonth = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), 1); return x; };
const fmtTime = (hhmm) => {
  const [h,m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h+11)%12)+1;
  return `${h12}${m ? ":"+String(m).padStart(2,"0") : ""} ${ampm}`;
};
const minToY = (mins, hourPx) => (mins/60) * hourPx;

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Page ────────────────────────────────────────────────────────────
// "Today" anchored to the demo's frozen Monday May 4, 2026 (so events show).
const FROZEN_TODAY = new Date(2026, 4, 4);

function TabCalendar() {
  const [cursor, setCursor] = React.useState(FROZEN_TODAY);
  const [view, setView] = React.useState("week"); // month | week | day | agenda
  const [prodFilter, setProdFilter] = React.useState(() => new Set(Cal_PRODS.map(p => p.id).concat([""])));
  const [typeFilter, setTypeFilter] = React.useState(() => new Set(EVENT_TYPES.map(t => t.id)));
  const [selected, setSelected] = React.useState(null);

  const events = React.useMemo(() =>
    EVENTS.filter(e => prodFilter.has(e.prod) && typeFilter.has(e.type)),
  [prodFilter, typeFilter]);

  const goPrev = () => {
    if (view === "month") setCursor(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
    else if (view === "week") setCursor(d => addDays(d, -7));
    else setCursor(d => addDays(d, -1));
  };
  const goNext = () => {
    if (view === "month") setCursor(d => new Date(d.getFullYear(), d.getMonth()+1, 1));
    else if (view === "week") setCursor(d => addDays(d, 7));
    else setCursor(d => addDays(d, 1));
  };
  const goToday = () => setCursor(FROZEN_TODAY);

  const periodLabel = (() => {
    if (view === "month") return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (view === "week") {
      const start = startOfWeek(cursor);
      const end = addDays(start, 6);
      if (start.getMonth() === end.getMonth()) return `${MONTHS[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
      return `${MONTHS[start.getMonth()].slice(0,3)} ${start.getDate()} – ${MONTHS[end.getMonth()].slice(0,3)} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return cursor.toLocaleDateString(undefined, { weekday:"long", month:"long", day:"numeric", year:"numeric" });
  })();

  return (
    <div className="cal anim-in">
      <CalSidebar cursor={cursor} setCursor={setCursor}
                  prodFilter={prodFilter} setProdFilter={setProdFilter}
                  typeFilter={typeFilter} setTypeFilter={setTypeFilter}
                  events={events}/>

      <main className="cal-main">
        <header className="cal-toolbar">
          <div className="row gap-sm">
            <button className="btn ghost btn-icon" onClick={goPrev} title="Previous"><CalI.ChevLeft size={14}/></button>
            <button className="btn ghost btn-icon" onClick={goNext} title="Next"><CalI.ChevRight size={14}/></button>
            <button className="btn ghost" onClick={goToday} style={{height:32,padding:"0 12px"}}>Today</button>
            <h2 className="cal-period">{periodLabel}</h2>
          </div>
          <div className="row gap-sm">
            <div className="seg cal-view-seg">
              {["month","week","day","agenda"].map(v => (
                <button key={v} data-on={view===v} onClick={() => setView(v)}>
                  {v[0].toUpperCase()+v.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn"><CalI.Filter size={14}/>Filter</button>
            <button className="btn primary"><CalI.Plus size={14}/>New event</button>
          </div>
        </header>

        <div className="cal-canvas">
          {view === "week"  && <WeekView cursor={cursor} events={events} onSelect={setSelected}/>}
          {view === "month" && <MonthView cursor={cursor} events={events} onSelect={setSelected}
                                          jumpDay={(d) => { setCursor(d); setView("day"); }}/>}
          {view === "day"   && <DayView cursor={cursor} events={events} onSelect={setSelected}/>}
          {view === "agenda"&& <AgendaView cursor={cursor} events={events} onSelect={setSelected}/>}
        </div>
      </main>

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)}/>}
      <CalStyles/>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────
function CalSidebar({ cursor, setCursor, prodFilter, setProdFilter, typeFilter, setTypeFilter, events }) {
  const toggleSet = (set, setter, key) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  const upcoming = events
    .map(e => ({...e, _d: parseYmd(e.date), _t: e.time}))
    .filter(e => e._d >= FROZEN_TODAY)
    .sort((a,b) => a._d - b._d || a._t.localeCompare(b._t))
    .slice(0, 5);

  return (
    <aside className="cal-side">
      <div className="cal-side-section">
        <MiniMonth cursor={cursor} setCursor={setCursor} events={events}/>
      </div>

      <div className="cal-side-section">
        <div className="cal-side-h">Productions</div>
        {Cal_PRODS.map(p => {
          const on = prodFilter.has(p.id);
          return (
            <label key={p.id} className="cal-filter">
              <input type="checkbox" checked={on}
                     onChange={() => toggleSet(prodFilter, setProdFilter, p.id)}/>
              <span className="cal-filter-swatch" style={{background: on ? p.color : "transparent",
                                                          borderColor: p.color}}/>
              <span className="cal-filter-label truncate">{p.title}</span>
            </label>
          );
        })}
        <label className="cal-filter">
          <input type="checkbox" checked={prodFilter.has("")}
                 onChange={() => toggleSet(prodFilter, setProdFilter, "")}/>
          <span className="cal-filter-swatch" style={{background: prodFilter.has("") ? "var(--ink-3)" : "transparent",
                                                      borderColor:"var(--ink-3)"}}/>
          <span className="cal-filter-label">Workspace · personal</span>
        </label>
      </div>

      <div className="cal-side-section">
        <div className="cal-side-h">Event types</div>
        {EVENT_TYPES.map(t => {
          const Ico = CalI[t.ico] || CalI.Info;
          const on = typeFilter.has(t.id);
          const bg = t.c === "accent" ? "var(--accent)" : (t.c ? `var(--c-${t.c})` : "var(--ink-3)");
          return (
            <label key={t.id} className="cal-filter">
              <input type="checkbox" checked={on}
                     onChange={() => toggleSet(typeFilter, setTypeFilter, t.id)}/>
              <span className="cal-filter-swatch" style={{background: on ? bg : "transparent", borderColor: bg}}/>
              <Ico size={12}/>
              <span className="cal-filter-label">{t.label}</span>
            </label>
          );
        })}
      </div>

      <div className="cal-side-section">
        <div className="cal-side-h">Upcoming</div>
        {upcoming.map(e => {
          const prod = Cal_PRODS.find(p => p.id === e.prod);
          return (
            <div key={e.id} className="cal-upcoming">
              <div className="cal-up-spine" style={{background: prod ? prod.color : "var(--ink-3)"}}/>
              <div className="cal-up-body">
                <div className="cal-up-when">
                  {e._d.toLocaleDateString(undefined,{weekday:"short", month:"short", day:"numeric"})}
                  {!e.allDay && ` · ${fmtTime(e.time)}`}
                </div>
                <div className="cal-up-title truncate">{e.title}</div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function MiniMonth({ cursor, setCursor, events }) {
  const [m, setM] = React.useState(startOfMonth(cursor));
  React.useEffect(() => setM(startOfMonth(cursor)), [cursor]);
  const first = startOfMonth(m);
  const startGrid = addDays(first, -first.getDay());
  const days = Array.from({length: 42}, (_,i) => addDays(startGrid, i));
  const eventDates = React.useMemo(() => new Set(events.map(e => e.date)), [events]);

  return (
    <div className="mini-month">
      <div className="mini-month-h">
        <button onClick={() => setM(new Date(m.getFullYear(), m.getMonth()-1, 1))}><CalI.ChevLeft size={12}/></button>
        <div>{MONTHS[m.getMonth()]} {m.getFullYear()}</div>
        <button onClick={() => setM(new Date(m.getFullYear(), m.getMonth()+1, 1))}><CalI.ChevRight size={12}/></button>
      </div>
      <div className="mini-month-wk">
        {["S","M","T","W","T","F","S"].map((d,i) => <span key={i}>{d}</span>)}
      </div>
      <div className="mini-month-grid">
        {days.map((d,i) => {
          const inMonth = d.getMonth() === m.getMonth();
          const isToday = sameYMD(d, FROZEN_TODAY);
          const isCursor = sameYMD(d, cursor);
          const hasEvents = eventDates.has(ymd(d));
          return (
            <button key={i} className="mini-day"
                    data-mute={!inMonth ? "1" : "0"}
                    data-today={isToday ? "1" : "0"}
                    data-active={isCursor ? "1" : "0"}
                    onClick={() => setCursor(d)}>
              {d.getDate()}
              {hasEvents && <span className="mini-day-pip"/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ───────────────────────────────────────────────────────
const HOUR_PX = 44;
const DAY_START_HOUR = 8;
const DAY_END_HOUR   = 23;

function WeekView({ cursor, events, onSelect }) {
  const start = startOfWeek(cursor);
  const days = Array.from({length:7}, (_,i) => addDays(start, i));
  const hours = Array.from({length: DAY_END_HOUR - DAY_START_HOUR + 1}, (_,i) => DAY_START_HOUR + i);

  return (
    <div className="week">
      <div className="week-head">
        <div className="week-gutter"/>
        {days.map((d,i) => {
          const isToday = sameYMD(d, FROZEN_TODAY);
          return (
            <div key={i} className="week-day-h" data-today={isToday?"1":"0"}>
              <span className="week-day-wd">{WEEKDAYS[d.getDay()]}</span>
              <span className="week-day-num">{d.getDate()}</span>
            </div>
          );
        })}
      </div>
      <div className="week-body">
        <div className="week-gutter">
          {hours.map(h => (
            <div key={h} className="hour-label" style={{height: HOUR_PX}}>
              {h === 12 ? "12 PM" : h > 12 ? `${h-12} PM` : `${h} AM`}
            </div>
          ))}
        </div>
        {days.map((d,i) => {
          const dayKey = ymd(d);
          const dayEvents = events.filter(e => e.date === dayKey && !e.allDay);
          const allDay   = events.filter(e => e.date === dayKey && e.allDay);
          const isToday = sameYMD(d, FROZEN_TODAY);
          return (
            <div key={i} className="week-col" data-today={isToday?"1":"0"}
                 style={{height: HOUR_PX * (DAY_END_HOUR - DAY_START_HOUR + 1)}}>
              {hours.map(h => <div key={h} className="hour-line" style={{height: HOUR_PX}}/>)}
              {isToday && <NowLine/>}
              {allDay.map(e => <AllDayEvent key={e.id} event={e} onClick={() => onSelect(e)}/>)}
              {dayEvents.map(e => <WeekEvent key={e.id} event={e} onClick={() => onSelect(e)}/>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NowLine() {
  // Frozen demo time: 4:48 PM = 16:48
  const mins = 16 * 60 + 48;
  const top = minToY(mins - DAY_START_HOUR*60, HOUR_PX);
  return (
    <div className="now-line" style={{top}}>
      <span className="now-dot"/>
      <span className="now-time">4:48 PM</span>
    </div>
  );
}

function WeekEvent({ event, onClick }) {
  const prod = Cal_PRODS.find(p => p.id === event.prod);
  const type = EVENT_TYPES.find(t => t.id === event.type);
  const [h,m] = event.time.split(":").map(Number);
  const startMin = h*60 + m;
  const top = minToY(startMin - DAY_START_HOUR*60, HOUR_PX);
  const height = Math.max(28, minToY(event.durMin, HOUR_PX) - 2);
  const color = event.prod ? prod.color : (type.c === "accent" ? "var(--accent)" : (type.c ? `var(--c-${type.c})` : "var(--ink-3)"));
  const isShort = event.durMin <= 45;
  return (
    <button className="week-event" style={{top, height, "--evt-color": color}}
            data-short={isShort?"1":"0"} data-conflict={event.conflict?"1":"0"}
            onClick={onClick}>
      <div className="week-event-spine"/>
      <div className="week-event-body">
        <div className="week-event-time">
          {fmtTime(event.time)}
          {event.conflict && <span className="week-event-conflict" title={`Conflict: ${event.conflict}`}><CalI.Alert size={10}/></span>}
        </div>
        <div className="week-event-title truncate">{event.title}</div>
        {!isShort && <div className="week-event-loc truncate">{event.loc}</div>}
      </div>
    </button>
  );
}

function AllDayEvent({ event, onClick }) {
  return (
    <button className="week-allday" onClick={onClick}>
      <CalI.Clock size={10}/> {event.title}
    </button>
  );
}

// ─── Month View ──────────────────────────────────────────────────────
function MonthView({ cursor, events, onSelect, jumpDay }) {
  const first = startOfMonth(cursor);
  const startGrid = addDays(first, -first.getDay());
  const days = Array.from({length: 42}, (_,i) => addDays(startGrid, i));

  return (
    <div className="month">
      <div className="month-head">
        {WEEKDAYS.map(d => <div key={d} className="month-h-cell">{d}</div>)}
      </div>
      <div className="month-grid">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = sameYMD(d, FROZEN_TODAY);
          const dayEvents = events.filter(e => e.date === ymd(d));
          return (
            <div key={i} className="month-cell" data-mute={!inMonth?"1":"0"} data-today={isToday?"1":"0"}>
              <div className="month-cell-h">
                <button className="month-cell-num" onClick={() => jumpDay(d)}>
                  {d.getDate() === 1 ? `${MONTHS[d.getMonth()].slice(0,3)} 1` : d.getDate()}
                </button>
              </div>
              <div className="month-cell-events">
                {dayEvents.slice(0,4).map(e => <MonthChip key={e.id} event={e} onClick={() => onSelect(e)}/>)}
                {dayEvents.length > 4 && (
                  <button className="month-more" onClick={() => jumpDay(d)}>+{dayEvents.length-4} more</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthChip({ event, onClick }) {
  const prod = Cal_PRODS.find(p => p.id === event.prod);
  const type = EVENT_TYPES.find(t => t.id === event.type);
  const color = event.prod ? prod.color : (type.c === "accent" ? "var(--accent)" : (type.c ? `var(--c-${type.c})` : "var(--ink-3)"));
  return (
    <button className="month-chip" onClick={onClick} data-anchor={event.anchor?"1":"0"}>
      <span className="month-chip-dot" style={{background: color}}/>
      <span className="month-chip-time mono">{event.allDay ? "all" : fmtTime(event.time).replace(" ", "")}</span>
      <span className="month-chip-title truncate">{event.title}</span>
    </button>
  );
}

// ─── Day View ────────────────────────────────────────────────────────
function DayView({ cursor, events, onSelect }) {
  const dayKey = ymd(cursor);
  const dayEvents = events.filter(e => e.date === dayKey && !e.allDay).sort((a,b) => a.time.localeCompare(b.time));
  const allDay = events.filter(e => e.date === dayKey && e.allDay);
  const hours = Array.from({length: DAY_END_HOUR - DAY_START_HOUR + 1}, (_,i) => DAY_START_HOUR + i);
  const isToday = sameYMD(cursor, FROZEN_TODAY);

  return (
    <div className="day">
      <div className="day-track">
        <div className="week-gutter">
          {hours.map(h => (
            <div key={h} className="hour-label" style={{height: HOUR_PX}}>
              {h === 12 ? "12 PM" : h > 12 ? `${h-12} PM` : `${h} AM`}
            </div>
          ))}
        </div>
        <div className="day-col" style={{height: HOUR_PX * (DAY_END_HOUR - DAY_START_HOUR + 1)}}>
          {hours.map(h => <div key={h} className="hour-line" style={{height: HOUR_PX}}/>)}
          {isToday && <NowLine/>}
          {dayEvents.map(e => <WeekEvent key={e.id} event={e} onClick={() => onSelect(e)}/>)}
        </div>
      </div>
      <aside className="day-side">
        <div className="day-side-h">
          <div className="day-side-wd">{WEEKDAYS[cursor.getDay()]}</div>
          <div className="day-side-num">{cursor.getDate()}</div>
          <div className="day-side-mon">{MONTHS[cursor.getMonth()]}</div>
        </div>
        {allDay.length > 0 && (
          <div className="day-side-section">
            <div className="cal-side-h">All-day</div>
            {allDay.map(e => (
              <div key={e.id} className="day-side-event" onClick={() => onSelect(e)}>
                <CalI.Clock size={12}/> {e.title}
              </div>
            ))}
          </div>
        )}
        <div className="day-side-section">
          <div className="cal-side-h">{dayEvents.length} event{dayEvents.length===1?"":"s"}</div>
          {dayEvents.map(e => {
            const prod = Cal_PRODS.find(p => p.id === e.prod);
            return (
              <button key={e.id} className="day-list-item" onClick={() => onSelect(e)}>
                <span className="day-list-spine" style={{background: prod ? prod.color : "var(--ink-3)"}}/>
                <div>
                  <div className="day-list-time mono">{fmtTime(e.time)}</div>
                  <div className="day-list-title">{e.title}</div>
                  <div className="day-list-loc">{e.loc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

// ─── Agenda View ─────────────────────────────────────────────────────
function AgendaView({ cursor, events, onSelect }) {
  // Group events by date, 14-day window starting from cursor
  const start = startOfWeek(cursor);
  const range = Array.from({length: 21}, (_,i) => addDays(start, i));
  return (
    <div className="agenda">
      {range.map(d => {
        const key = ymd(d);
        const list = events.filter(e => e.date === key).sort((a,b)=>a.time.localeCompare(b.time));
        if (list.length === 0) return null;
        const isToday = sameYMD(d, FROZEN_TODAY);
        return (
          <div key={key} className="agenda-day">
            <div className="agenda-day-h" data-today={isToday?"1":"0"}>
              <div className="agenda-day-num">{d.getDate()}</div>
              <div>
                <div className="agenda-day-wd">{WEEKDAYS[d.getDay()]}</div>
                <div className="agenda-day-mon">{MONTHS[d.getMonth()]}</div>
              </div>
              {isToday && <span className="agenda-today-pill">Today</span>}
            </div>
            <div className="agenda-list">
              {list.map(e => {
                const prod = Cal_PRODS.find(p => p.id === e.prod);
                const type = EVENT_TYPES.find(t => t.id === e.type);
                const Ico = CalI[type.ico] || CalI.Info;
                return (
                  <button key={e.id} className="agenda-item" onClick={() => onSelect(e)}>
                    <span className="agenda-spine" style={{background: prod ? prod.color : "var(--ink-3)"}}/>
                    <span className="agenda-time mono">
                      {e.allDay ? "all day" : fmtTime(e.time)}
                    </span>
                    <span className="agenda-type"><Ico size={11}/> {type.label}</span>
                    <span className="agenda-title">{e.title}</span>
                    <span className="agenda-loc truncate">{e.loc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Event Detail (drawer) ───────────────────────────────────────────
function EventDetail({ event, onClose }) {
  const prod = Cal_PRODS.find(p => p.id === event.prod);
  const type = EVENT_TYPES.find(t => t.id === event.type);
  const Ico = CalI[type.ico] || CalI.Info;
  const endTime = (() => {
    const [h,m] = event.time.split(":").map(Number);
    const total = h*60 + m + event.durMin;
    const eh = Math.floor(total/60), em = total%60;
    return fmtTime(`${String(eh%24).padStart(2,"0")}:${String(em).padStart(2,"0")}`);
  })();
  const cast = (event.cast || []).map(i => Cal_CAST.find(c => c.initials === i)).filter(Boolean);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="cal-scrim" onClick={onClose}/>
      <aside className="cal-drawer">
        <header className="cal-drawer-h">
          <span className="cal-drawer-type">
            <Ico size={12}/>{type.label}
          </span>
          <button className="btn ghost btn-icon" onClick={onClose}><CalI.X size={14}/></button>
        </header>
        <h2 className="cal-drawer-title">{event.title}</h2>
        {prod && (
          <div className="cal-drawer-prod">
            <span className="prod-dot" style={{background:prod.color}}/>
            {prod.title}
          </div>
        )}
        {!prod && <div className="cal-drawer-prod"><span className="prod-dot" style={{background:"var(--ink-3)"}}/>Workspace · personal</div>}

        <dl className="cal-drawer-meta">
          <dt>When</dt>
          <dd>{parseYmd(event.date).toLocaleDateString(undefined,{weekday:"long", month:"long", day:"numeric"})}
              <br/>{event.allDay ? "All day" : `${fmtTime(event.time)} – ${endTime}  ·  ${Math.floor(event.durMin/60)}h ${event.durMin%60 ? (event.durMin%60)+"m":""}`.trim()}</dd>

          <dt>Where</dt>
          <dd>{event.loc}</dd>

          {event.lead && (<><dt>Lead</dt><dd>{event.lead}</dd></>)}

          {event.called != null && (<>
            <dt>Called</dt>
            <dd>{event.called} of {event.total} ·{" "}
              <span className="muted">{event.total - event.called > 0 ? `${event.total - event.called} excused` : "full company"}</span>
            </dd>
          </>)}

          {cast.length > 0 && (<>
            <dt>Cast</dt>
            <dd>
              <div className="cal-drawer-cast">
                {cast.map(c => (
                  <span key={c.id} className="row gap-sm" style={{gap:6}}>
                    <span className="avatar" style={{width:22,height:22,fontSize:10,background:`var(--c-${c.color})`}}>{c.initials}</span>
                    <span style={{fontSize:12.5}}>{c.actor}</span>
                  </span>
                ))}
              </div>
            </dd>
          </>)}

          {event.conflict && (<>
            <dt><CalI.Alert size={12} style={{color:"var(--c-amber)"}}/> Conflict</dt>
            <dd style={{color: "var(--c-clay)"}}>Cast member {event.conflict} also called for a Pirates rehearsal at this time.</dd>
          </>)}
        </dl>

        <div className="cal-drawer-actions">
          <button className="btn primary"><CalI.Pencil size={13}/>Edit</button>
          <button className="btn"><CalI.Clipboard size={13}/>Open report</button>
          <button className="btn ghost"><CalI.Trash size={13}/></button>
        </div>
      </aside>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
function CalStyles() {
  return (
    <style>{`
      .cal{
        display:grid;
        grid-template-columns: 248px 1fr;
        gap: 18px;
        height: 100%; min-height: 0;
      }

      /* ─── Sidebar ─── */
      .cal-side{
        display:flex; flex-direction:column; gap: 22px;
        padding-right: 6px;
        overflow-y: auto;
        max-height: calc(100vh - 160px);
      }
      .cal-side-h{
        font-size: 11px; font-weight: 600;
        letter-spacing: .08em; text-transform: uppercase;
        color: var(--ink-4);
        margin-bottom: 10px;
      }
      .cal-side-section{ }
      .cal-filter{
        display:flex; align-items:center; gap: 8px;
        padding: 5px 4px;
        cursor: pointer;
        font-size: 12.5px;
        color: var(--ink-2);
        border-radius: var(--radius-s);
      }
      .cal-filter:hover{ background: var(--bg-muted); }
      .cal-filter input{ display:none; }
      .cal-filter-swatch{
        width: 12px; height: 12px;
        border-radius: 3px;
        border: 1.5px solid;
        flex-shrink: 0;
        transition: background .14s;
      }
      .cal-filter-label{ flex:1; min-width: 0; }
      .cal-filter .ico{ color: var(--ink-3); }

      .cal-upcoming{
        display:flex; gap: 8px;
        padding: 6px 0;
        border-top: 1px dashed var(--border);
      }
      .cal-upcoming:first-of-type{ border-top: 0; }
      .cal-up-spine{ width: 3px; border-radius: 2px; align-self: stretch; }
      .cal-up-body{ flex:1; min-width: 0; }
      .cal-up-when{
        font-size: 10.5px;
        color: var(--ink-3);
        letter-spacing: .04em;
        text-transform: uppercase;
        font-weight: 500;
      }
      .cal-up-title{ font-size: 12.5px; font-weight: 500; }

      /* ─── Mini month ─── */
      .mini-month{
        background: var(--bg-elev);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 10px;
      }
      .mini-month-h{
        display:flex; align-items:center; justify-content:space-between;
        font-size: 12px; font-weight: 500;
        padding: 0 4px 8px;
      }
      .mini-month-h button{
        background: none; border: 0; cursor: pointer;
        width: 18px; height: 18px; border-radius: 4px;
        color: var(--ink-3); display:grid; place-items:center;
      }
      .mini-month-h button:hover{ background: var(--bg-muted); color: var(--ink); }
      .mini-month-wk{
        display:grid; grid-template-columns: repeat(7, 1fr);
        font-size: 10px; color: var(--ink-4);
        text-align: center; font-weight: 500;
        margin-bottom: 4px;
      }
      .mini-month-grid{
        display:grid; grid-template-columns: repeat(7, 1fr);
        gap: 1px;
      }
      .mini-day{
        position: relative;
        appearance: none; border: 0; background: none; cursor: pointer;
        aspect-ratio: 1;
        font-size: 11px;
        color: var(--ink-2);
        border-radius: 4px;
        display:grid; place-items:center;
        font-family: inherit;
      }
      .mini-day:hover{ background: var(--bg-muted); }
      .mini-day[data-mute="1"]{ color: var(--ink-4); }
      .mini-day[data-today="1"]{
        background: var(--accent);
        color: white !important;
        font-weight: 600;
      }
      .mini-day[data-active="1"]:not([data-today="1"]){
        background: var(--accent-soft);
        color: var(--accent-ink) !important;
        font-weight: 500;
      }
      .mini-day-pip{
        position: absolute; bottom: 2px; left: 50%;
        transform: translateX(-50%);
        width: 3px; height: 3px; border-radius: 50%;
        background: var(--accent);
      }
      .mini-day[data-today="1"] .mini-day-pip{ background: white; }

      /* ─── Toolbar ─── */
      .cal-main{
        display: flex; flex-direction: column; min-height: 0;
        gap: 14px;
      }
      .cal-toolbar{
        display:flex; align-items:center; justify-content:space-between;
        gap: 16px; flex-wrap: wrap;
      }
      .cal-period{
        margin: 0 0 0 6px;
        font-family: var(--font-display);
        font-size: 22px; font-weight: 500;
        letter-spacing: -.012em;
      }
      .cal-view-seg{ }
      .cal-canvas{
        flex:1; min-height: 0;
        background: var(--bg-elev);
        border: 1px solid var(--border);
        border-radius: var(--radius-l);
        box-shadow: var(--shadow-1);
        overflow: hidden;
        display: flex; flex-direction: column;
      }

      /* ─── Week ─── */
      .week{ display:flex; flex-direction:column; height: 100%; min-height: 0; }
      .week-head{
        display: grid;
        grid-template-columns: 60px repeat(7, 1fr);
        border-bottom: 1px solid var(--border);
        background: var(--bg-elev);
      }
      .week-gutter{ width: 60px; flex-shrink: 0; }
      .week-day-h{
        padding: 12px 10px 10px;
        text-align: left;
        border-left: 1px solid var(--border);
        display:flex; align-items:baseline; gap: 8px;
      }
      .week-day-wd{
        font-size: 11px; font-weight: 600;
        letter-spacing: .08em; text-transform: uppercase;
        color: var(--ink-4);
      }
      .week-day-num{
        font-family: var(--font-display);
        font-size: 20px; font-weight: 500;
        color: var(--ink);
      }
      .week-day-h[data-today="1"] .week-day-num{
        color: var(--accent);
      }
      .week-day-h[data-today="1"] .week-day-wd{
        color: var(--accent-ink);
      }

      .week-body{
        flex: 1; min-height: 0;
        display: grid;
        grid-template-columns: 60px repeat(7, 1fr);
        overflow-y: auto;
        position: relative;
      }
      .week-body .week-gutter{
        position: sticky; left: 0;
        background: var(--bg-elev);
        z-index: 2;
      }
      .hour-label{
        font-size: 10.5px;
        color: var(--ink-4);
        font-variant-numeric: tabular-nums;
        padding: 2px 8px 0 0;
        text-align: right;
        border-top: 1px solid var(--border);
      }
      .hour-label:first-child{ border-top: 0; padding-top: 0; }

      .week-col{
        position: relative;
        border-left: 1px solid var(--border);
      }
      .hour-line{
        border-top: 1px solid var(--border);
      }
      .hour-line:first-child{ border-top: 0; }
      .week-col[data-today="1"]{
        background: color-mix(in oklch, var(--accent-soft) 30%, transparent);
      }

      .now-line{
        position: absolute; left: -4px; right: 0;
        height: 0; border-top: 1.5px solid var(--accent);
        z-index: 5;
        pointer-events: none;
      }
      .now-dot{
        position: absolute; left: -5px; top: -5px;
        width: 9px; height: 9px; border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 25%, transparent);
      }
      .now-time{
        position: absolute; left: -52px; top: -7px;
        font-size: 9.5px; font-weight: 600;
        background: var(--accent); color: white;
        padding: 1px 5px; border-radius: 3px;
        letter-spacing: .02em;
      }

      .week-event{
        position: absolute; left: 4px; right: 4px;
        appearance: none; cursor: pointer;
        background: color-mix(in oklch, var(--evt-color) 14%, var(--bg-elev));
        border: 1px solid color-mix(in oklch, var(--evt-color) 35%, var(--border));
        border-radius: 6px;
        padding: 4px 8px 4px 10px;
        text-align: left;
        overflow: hidden;
        z-index: 2;
        font-family: inherit; color: inherit;
        transition: transform .08s, box-shadow .14s;
      }
      .week-event:hover{
        transform: translateY(-1px);
        box-shadow: 0 4px 12px -2px rgba(40,30,15,.18);
        z-index: 4;
      }
      .week-event-spine{
        position: absolute; left: 0; top: 4px; bottom: 4px;
        width: 3px; background: var(--evt-color);
        border-radius: 0 2px 2px 0;
      }
      .week-event-time{
        font-size: 10px; font-weight: 600;
        color: color-mix(in oklch, var(--evt-color) 55%, var(--ink));
        letter-spacing: .02em;
        display:flex; align-items:center; gap: 4px;
      }
      .week-event-conflict{
        display:inline-flex; align-items:center;
        color: var(--c-clay);
      }
      .week-event-title{
        font-size: 12px; font-weight: 500;
        color: var(--ink);
        line-height: 1.25;
        margin-top: 1px;
      }
      .week-event-loc{
        font-size: 10.5px;
        color: var(--ink-3);
        margin-top: 2px;
      }
      .week-event[data-short="1"]{
        padding: 2px 6px 2px 10px;
      }
      .week-event[data-short="1"] .week-event-title{
        font-size: 11.5px; margin-top: 0;
      }

      .week-allday{
        position: relative;
        margin: 2px 4px;
        padding: 3px 8px;
        background: var(--bg-sunken);
        border: 1px dashed var(--border-strong);
        border-radius: 4px;
        font-size: 11px;
        color: var(--ink-3);
        display:flex; align-items:center; gap: 5px;
        cursor: pointer;
        font-family: inherit;
        appearance: none;
      }

      /* ─── Month ─── */
      .month{ display: flex; flex-direction: column; height: 100%; }
      .month-head{
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        border-bottom: 1px solid var(--border);
      }
      .month-h-cell{
        padding: 10px 12px;
        font-size: 11px; font-weight: 600;
        letter-spacing: .08em; text-transform: uppercase;
        color: var(--ink-4);
        border-left: 1px solid var(--border);
      }
      .month-h-cell:first-child{ border-left: 0; }

      .month-grid{
        flex: 1; min-height: 0;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-template-rows: repeat(6, 1fr);
        border-top: 1px solid var(--border);
        margin-top: -1px;
      }
      .month-cell{
        border-left: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        padding: 6px 6px 4px;
        overflow: hidden;
        display:flex; flex-direction:column; gap: 3px;
        min-height: 0;
      }
      .month-cell:nth-child(7n+1){ border-left: 0; }
      .month-cell[data-mute="1"]{ background: var(--bg-muted); }
      .month-cell[data-today="1"] .month-cell-num{
        background: var(--accent); color: white;
      }
      .month-cell-h{ display: flex; justify-content: flex-end; }
      .month-cell-num{
        appearance: none; background: none; border: 0; cursor: pointer;
        font-size: 11px; font-weight: 500; color: var(--ink-2);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: inherit;
        min-width: 22px;
      }
      .month-cell-num:hover{ background: var(--bg-sunken); }
      .month-cell[data-mute="1"] .month-cell-num{ color: var(--ink-4); }
      .month-cell-events{
        flex: 1; display:flex; flex-direction:column; gap: 2px; min-height: 0;
        overflow: hidden;
      }

      .month-chip{
        appearance: none; border: 0; background: none; cursor: pointer;
        display: grid;
        grid-template-columns: 6px auto 1fr;
        gap: 5px; align-items: center;
        padding: 2px 5px;
        border-radius: 3px;
        text-align: left;
        font-family: inherit; color: inherit;
        line-height: 1.25;
        min-height: 0;
      }
      .month-chip:hover{ background: var(--bg-sunken); }
      .month-chip[data-anchor="1"]{
        background: var(--accent-soft);
      }
      .month-chip-dot{ width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
      .month-chip-time{ font-size: 9.5px; color: var(--ink-3); }
      .month-chip-title{ font-size: 11px; color: var(--ink); font-weight: 500; }

      .month-more{
        appearance: none; border: 0; background: none; cursor: pointer;
        padding: 2px 5px; text-align: left;
        font-size: 10.5px; color: var(--ink-4);
        font-family: inherit;
        border-radius: 3px;
      }
      .month-more:hover{ background: var(--bg-sunken); color: var(--ink); }

      /* ─── Day ─── */
      .day{
        display: grid;
        grid-template-columns: 1fr 280px;
        height: 100%; min-height: 0;
      }
      .day-track{
        display: grid;
        grid-template-columns: 60px 1fr;
        overflow-y: auto;
        position: relative;
        border-right: 1px solid var(--border);
      }
      .day-col{
        position: relative;
        border-left: 1px solid var(--border);
      }
      .day-side{
        display: flex; flex-direction: column;
        padding: 18px 18px 18px;
        overflow-y: auto;
        gap: 18px;
      }
      .day-side-h{
        display: flex; align-items: baseline; gap: 8px;
        padding-bottom: 14px;
        border-bottom: 1px solid var(--border);
      }
      .day-side-wd{
        font-size: 11px; font-weight: 600;
        letter-spacing: .08em; text-transform: uppercase;
        color: var(--ink-4);
      }
      .day-side-num{
        font-family: var(--font-display);
        font-size: 36px; font-weight: 500;
        line-height: 1; letter-spacing: -.02em;
      }
      .day-side-mon{
        font-family: var(--font-display);
        font-size: 14px; font-style: italic;
        color: var(--ink-3);
      }
      .day-side-section{ }
      .day-side-event{
        padding: 8px 10px;
        background: var(--bg-sunken);
        border: 1px dashed var(--border-strong);
        border-radius: 4px;
        font-size: 12.5px;
        display:flex; align-items:center; gap: 6px;
        cursor: pointer;
        margin-bottom: 6px;
      }
      .day-list-item{
        appearance: none; background: none; border: 0; cursor: pointer;
        display: flex; gap: 10px; padding: 10px 0;
        text-align: left;
        font-family: inherit; color: inherit;
        border-top: 1px dashed var(--border);
        width: 100%;
      }
      .day-list-item:first-of-type{ border-top: 0; }
      .day-list-item:hover .day-list-title{ color: var(--accent-ink); }
      .day-list-spine{ width: 3px; border-radius: 2px; align-self: stretch; flex-shrink: 0; }
      .day-list-time{ font-size: 10.5px; color: var(--ink-3); font-weight: 600; letter-spacing: .04em; }
      .day-list-title{ font-size: 13px; font-weight: 500; margin-top: 2px; }
      .day-list-loc{ font-size: 11.5px; color: var(--ink-3); margin-top: 1px; }

      /* ─── Agenda ─── */
      .agenda{
        padding: 18px 24px;
        overflow-y: auto;
      }
      .agenda-day{ margin-bottom: 28px; }
      .agenda-day-h{
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 8px;
      }
      .agenda-day-num{
        font-family: var(--font-display);
        font-size: 30px; font-weight: 500;
        line-height: 1; min-width: 36px;
      }
      .agenda-day-h[data-today="1"] .agenda-day-num{ color: var(--accent); }
      .agenda-day-wd{
        font-size: 11px; font-weight: 600;
        letter-spacing: .08em; text-transform: uppercase;
        color: var(--ink-3);
      }
      .agenda-day-mon{
        font-size: 11px; font-style: italic;
        color: var(--ink-4);
      }
      .agenda-today-pill{
        margin-left: auto;
        font-size: 10.5px; font-weight: 500;
        background: var(--accent); color: white;
        padding: 2px 10px; border-radius: 999px;
      }
      .agenda-list{ display: flex; flex-direction: column; gap: 1px; }
      .agenda-item{
        appearance: none; border: 0; cursor: pointer;
        background: var(--bg-muted);
        border-radius: var(--radius-s);
        padding: 10px 14px;
        display: grid;
        grid-template-columns: 4px 76px 110px 1fr 180px;
        gap: 14px;
        align-items: center;
        text-align: left;
        font-family: inherit; color: inherit;
      }
      .agenda-item:hover{ background: var(--bg-sunken); }
      .agenda-spine{ height: 22px; border-radius: 2px; }
      .agenda-time{ font-size: 11.5px; color: var(--ink-3); font-weight: 500; }
      .agenda-type{
        display:inline-flex; align-items:center; gap: 5px;
        font-size: 11px; color: var(--ink-3);
        text-transform: uppercase; letter-spacing: .04em;
      }
      .agenda-title{ font-size: 13.5px; font-weight: 500; color: var(--ink); }
      .agenda-loc{ font-size: 12px; color: var(--ink-3); text-align: right; }

      /* ─── Drawer ─── */
      .cal-scrim{
        position: fixed; inset: 0;
        background: rgba(40,30,15,.25);
        z-index: 90;
        animation: fadeUp .15s ease-out both;
      }
      .cal-drawer{
        position: fixed; top: 0; right: 0; bottom: 0;
        width: 420px; max-width: 92vw;
        background: var(--bg-elev);
        border-left: 1px solid var(--border);
        box-shadow: var(--shadow-3);
        z-index: 100;
        padding: 22px 24px 24px;
        display: flex; flex-direction: column; gap: 14px;
        overflow-y: auto;
        animation: slideIn .2s ease-out both;
      }
      @keyframes slideIn{ from{transform: translateX(20px); opacity: 0;} to{transform: translateX(0); opacity:1;} }
      .cal-drawer-h{ display:flex; align-items:center; justify-content:space-between; }
      .cal-drawer-type{
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 11px; font-weight: 600;
        letter-spacing: .08em; text-transform: uppercase;
        color: var(--ink-3);
      }
      .cal-drawer-title{
        margin: 0;
        font-family: var(--font-display);
        font-size: 26px; font-weight: 500;
        letter-spacing: -.014em; line-height: 1.15;
      }
      .cal-drawer-prod{
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 13px; color: var(--ink-2);
        padding: 6px 10px;
        background: var(--bg-sunken);
        border-radius: 6px;
        align-self: flex-start;
      }
      .cal-drawer-meta{
        display: grid;
        grid-template-columns: 80px 1fr;
        gap: 6px 16px;
        margin: 4px 0;
        font-size: 13px;
      }
      .cal-drawer-meta dt{
        font-size: 10.5px; font-weight: 600;
        letter-spacing: .08em; text-transform: uppercase;
        color: var(--ink-4);
        padding-top: 4px;
      }
      .cal-drawer-meta dd{
        margin: 0; padding: 2px 0 10px;
        border-bottom: 1px dashed var(--border);
        color: var(--ink-2);
      }
      .cal-drawer-meta dt + dd{ border-bottom: 1px dashed var(--border); }
      .cal-drawer-cast{
        display:flex; flex-wrap: wrap; gap: 8px 14px;
      }
      .cal-drawer-actions{
        margin-top: auto;
        padding-top: 12px;
        display:flex; gap: 8px;
      }

      /* Responsive */
      @media (max-width: 980px){
        .cal{ grid-template-columns: 1fr; }
        .cal-side{ display: none; }
        .day{ grid-template-columns: 1fr; }
        .day-side{ display: none; }
        .agenda-item{ grid-template-columns: 4px 70px 1fr; }
        .agenda-type, .agenda-loc{ display: none; }
      }
    `}</style>
  );
}

window.TabCalendar = TabCalendar;
