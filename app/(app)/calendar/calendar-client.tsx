"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { useIsPhone } from "@/lib/use-is-phone";
import {
  type CalendarView,
  type CalEvent,
  MONTHS,
  addDays,
  parseDateParam,
  parseView,
  startOfWeek,
  ymd,
} from "./utils";
import { CalSidebar } from "./calendar-sidebar";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { DayView } from "./day-view";
import { AgendaView } from "./agenda-view";
import { EventDrawer } from "./event-drawer";
import { DaySheet } from "./day-sheet";
import { CallTray } from "./call-tray";

export type Production = {
  id: string;
  title: string;
  slug: string;
  colorVar: string;
};

const VIEWS: CalendarView[] = ["month", "week", "day", "agenda"];

export function CalendarClient({
  events,
  productions,
  initialView,
  initialDate,
  canEdit,
  scopedSlug,
}: {
  events: CalEvent[];
  productions: Production[];
  initialView: string | undefined;
  initialDate: string | undefined;
  canEdit: boolean;
  /** When the calendar is scoped to one production, new calls go straight
   *  there. On the workspace calendar this is undefined and we pick. */
  scopedSlug?: string;
}) {
  const router = useRouter();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [cursor, setCursor] = useState<Date>(() => parseDateParam(initialDate));
  const [view, setView] = useState<CalendarView>(() => parseView(initialView));
  const [prodFilter, setProdFilter] = useState<Set<string>>(
    () => new Set(productions.map((p) => p.id)),
  );
  const [selected, setSelected] = useState<CalEvent | null>(null);
  // Phone widths use a bottom day-detail sheet for month-view taps
  // instead of jumping the whole view to "day".
  const isPhone = useIsPhone();
  const [openDay, setOpenDay] = useState<Date | null>(null);

  const visibleEvents = useMemo(
    () => events.filter((e) => prodFilter.has(e.productionId)),
    [events, prodFilter],
  );

  const dayEvents = useMemo(() => {
    if (!openDay) return [] as CalEvent[];
    const key = ymd(openDay);
    return visibleEvents.filter((e) => e.date === key);
  }, [openDay, visibleEvents]);

  const goPrev = () => {
    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    else if (view === "week") setCursor(addDays(cursor, -7));
    else setCursor(addDays(cursor, -1));
  };
  const goNext = () => {
    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
    else if (view === "week") setCursor(addDays(cursor, 7));
    else setCursor(addDays(cursor, 1));
  };
  const goToday = () => setCursor(today);

  const periodLabel = (() => {
    if (view === "month") return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (view === "week") {
      const start = startOfWeek(cursor);
      const end = addDays(start, 6);
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
      }
      return `${MONTHS[start.getMonth()].slice(0, 3)} ${start.getDate()} – ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getDate()}, ${end.getFullYear()}`;
    }
    if (view === "day") {
      return cursor.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()} agenda`;
  })();

  const jumpDay = (d: Date) => {
    if (isPhone) {
      setOpenDay(d);
      return;
    }
    setCursor(d);
    setView("day");
  };

  // New-call entry point opens a slide-in tray over the calendar. Scoped views
  // (and single-production workspaces) go straight to that production; the
  // multi-production workspace picks one first.
  const [pickOpen, setPickOpen] = useState(false);
  const [tray, setTray] = useState<{ slug: string; title?: string } | null>(
    null,
  );
  const directSlug =
    scopedSlug ?? (productions.length === 1 ? productions[0].slug : null);
  const openTray = (slug: string) => {
    setPickOpen(false);
    setTray({ slug, title: productions.find((p) => p.slug === slug)?.title });
  };
  const startNewCall = () => {
    if (directSlug) openTray(directSlug);
    else setPickOpen(true);
  };

  return (
    <div className="cal-page anim-in">
      <div className="cal">
        <CalSidebar
          cursor={cursor}
          setCursor={setCursor}
          today={today}
          productions={productions}
          prodFilter={prodFilter}
          setProdFilter={setProdFilter}
          events={visibleEvents}
        />

        <main className="cal-main">
          <header className="cal-toolbar">
            <div className="row gap-sm">
              <button
                className="btn ghost btn-icon"
                onClick={goPrev}
                title="Previous"
              >
                <Icon name="ChevronLeft" className="ico" />
              </button>
              <button
                className="btn ghost btn-icon"
                onClick={goNext}
                title="Next"
              >
                <Icon name="ChevronRight" className="ico" />
              </button>
              <button
                className="btn ghost"
                onClick={goToday}
                style={{ height: 32, padding: "0 12px" }}
              >
                Today
              </button>
              <h2 className="cal-period">{periodLabel}</h2>
            </div>
            <div className="row gap-sm">
              <div className="seg">
                {VIEWS.map((v) => (
                  <button
                    key={v}
                    data-on={view === v}
                    onClick={() => setView(v)}
                  >
                    {v[0].toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
              {canEdit && (
                <button
                  className="btn primary cal-new"
                  onClick={startNewCall}
                  title="Schedule a call"
                >
                  <Icon name="Plus" className="ico" />
                  <span className="cal-new-label">Schedule call</span>
                </button>
              )}
            </div>
          </header>

          <div className="cal-canvas">
            {view === "week" && (
              <WeekView
                cursor={cursor}
                today={today}
                events={visibleEvents}
                onSelect={setSelected}
              />
            )}
            {view === "month" && (
              <MonthView
                cursor={cursor}
                today={today}
                events={visibleEvents}
                onSelect={setSelected}
                jumpDay={jumpDay}
              />
            )}
            {view === "day" && (
              <DayView
                cursor={cursor}
                today={today}
                events={visibleEvents}
                onSelect={setSelected}
              />
            )}
            {view === "agenda" && (
              <AgendaView
                cursor={cursor}
                today={today}
                events={visibleEvents}
                onSelect={setSelected}
              />
            )}
          </div>
        </main>

        {canEdit && (
          <button
            className="cal-fab"
            onClick={startNewCall}
            aria-label="Schedule a call"
          >
            <Icon name="Plus" className="ico" />
          </button>
        )}

        {pickOpen && (
          <div className="cal-pick-scrim" onClick={() => setPickOpen(false)}>
            <div className="cal-pick" onClick={(e) => e.stopPropagation()}>
              <div className="cal-pick-h">New call — choose a production</div>
              {productions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="cal-pick-item"
                  onClick={() => openTray(p.slug)}
                >
                  <span
                    className="cal-pick-dot"
                    style={{ background: p.colorVar }}
                  />
                  <span>{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <EventDrawer
            event={selected}
            canEdit={canEdit}
            onClose={() => setSelected(null)}
          />
        )}

        {openDay && (
          <DaySheet
            day={openDay}
            events={dayEvents}
            onClose={() => setOpenDay(null)}
            onSelectEvent={(e) => {
              setOpenDay(null);
              setSelected(e);
            }}
          />
        )}

        {tray && (
          <CallTray
            slug={tray.slug}
            productionTitle={tray.title}
            date={ymd(cursor)}
            onClose={() => setTray(null)}
            onCreated={() => {
              setTray(null);
              router.refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}
