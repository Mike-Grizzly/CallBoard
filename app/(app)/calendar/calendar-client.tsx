"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  type CalendarView,
  type CalEvent,
  MONTHS,
  addDays,
  parseDateParam,
  parseView,
  startOfWeek,
} from "./utils";
import { CalSidebar } from "./calendar-sidebar";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { DayView } from "./day-view";
import { AgendaView } from "./agenda-view";
import { EventDrawer } from "./event-drawer";

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
}: {
  events: CalEvent[];
  productions: Production[];
  initialView: string | undefined;
  initialDate: string | undefined;
}) {
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

  const visibleEvents = useMemo(
    () => events.filter((e) => prodFilter.has(e.productionId)),
    [events, prodFilter],
  );

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
    setCursor(d);
    setView("day");
  };

  return (
    <div className="page cal-page">
      <div className="cal anim-in">
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

        {selected && (
          <EventDrawer event={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
