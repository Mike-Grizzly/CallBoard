export type ReportStatus = "draft" | "distributed";

export type BreakKind = "5-min" | "10-min" | "Meal";

export type Break = {
  start: string;
  end: string;
  kind: BreakKind;
};

export type SceneWorked = {
  label: string;
  pages: string;
  time: string;
};

export type ScheduleChange = {
  who: string;
  what: string;
  c?: string;
};

export type AttendanceNote = {
  who: string;
  note: string;
};

export type LineNote = {
  who: string;
  line: string;
  issue: string;
};

export type Injury = {
  who: string;
  time: string;
  text: string;
};
