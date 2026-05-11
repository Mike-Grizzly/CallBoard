import { DEPARTMENTS } from "./constants";
import type {
  ReportStatus,
  Break,
  BreakKind,
  SceneWorked,
  ScheduleChange,
  AttendanceNote,
  LineNote,
  Injury,
} from "./types";

export type ReportFormErrors = {
  report_date?: string;
  general_notes?: string;
  status?: string;
};

export type ReportFormData = {
  reportDate: string;
  status: ReportStatus;
  generalNotes: string;
  scheduledCall: string | null;
  actualStart: string | null;
  endTime: string | null;
  nextRehearsalDate: string | null;
  nextRehearsalTime: string | null;
  nextRehearsalLocation: string | null;
  nextRehearsalNotes: string | null;
  attendancePresent: number;
  attendanceAbsent: number;
  attendanceLate: number;
  breaks: Break[];
  scenesWorked: SceneWorked[];
  scheduleChanges: ScheduleChange[];
  attendanceNotes: AttendanceNote[];
  lineNotes: LineNote[];
  injuries: Injury[];
  departments: Record<string, string | null>;
};

function nullableText(formData: FormData, name: string): string | null {
  const v = (formData.get(name) as string | null)?.trim();
  return v ? v : null;
}

function intValue(formData: FormData, name: string): number {
  const raw = (formData.get(name) as string | null)?.trim();
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseJsonArray<T>(
  formData: FormData,
  name: string,
  isItem: (x: unknown) => x is T,
): T[] {
  const raw = formData.get(name);
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isItem);
  } catch {
    return [];
  }
}

const BREAK_KINDS: BreakKind[] = ["5-min", "10-min", "Meal"];

function isBreak(x: unknown): x is Break {
  return (
    typeof x === "object" &&
    x !== null &&
    "start" in x &&
    "end" in x &&
    "kind" in x &&
    typeof (x as Break).start === "string" &&
    typeof (x as Break).end === "string" &&
    BREAK_KINDS.includes((x as Break).kind)
  );
}

function isSceneWorked(x: unknown): x is SceneWorked {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as SceneWorked).label === "string" &&
    typeof (x as SceneWorked).pages === "string" &&
    typeof (x as SceneWorked).time === "string"
  );
}

function isScheduleChange(x: unknown): x is ScheduleChange {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as ScheduleChange).who === "string" &&
    typeof (x as ScheduleChange).what === "string"
  );
}

function isAttendanceNote(x: unknown): x is AttendanceNote {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as AttendanceNote).who === "string" &&
    typeof (x as AttendanceNote).note === "string"
  );
}

function isLineNote(x: unknown): x is LineNote {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as LineNote).who === "string" &&
    typeof (x as LineNote).line === "string" &&
    typeof (x as LineNote).issue === "string"
  );
}

function isInjury(x: unknown): x is Injury {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as Injury).who === "string" &&
    typeof (x as Injury).time === "string" &&
    typeof (x as Injury).text === "string"
  );
}

export function validateReportForm(formData: FormData): {
  data?: ReportFormData;
  errors?: ReportFormErrors;
} {
  const reportDate = (formData.get("report_date") as string)?.trim();
  const generalNotes = (formData.get("general_notes") as string)?.trim() ?? "";
  const rawStatus = (formData.get("status") as string | null)?.trim() ?? "draft";
  const status: ReportStatus =
    rawStatus === "distributed" ? "distributed" : "draft";

  const errors: ReportFormErrors = {};

  if (!reportDate) {
    errors.report_date = "Report date is required.";
  }

  if (status === "distributed" && !generalNotes) {
    errors.general_notes = "General notes are required to distribute.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const departments: Record<string, string | null> = {};
  for (const dept of DEPARTMENTS) {
    departments[dept.key] = nullableText(formData, dept.field);
  }

  return {
    data: {
      reportDate,
      status,
      generalNotes,
      scheduledCall: nullableText(formData, "scheduled_call"),
      actualStart: nullableText(formData, "actual_start"),
      endTime: nullableText(formData, "end_time"),
      nextRehearsalDate: nullableText(formData, "next_rehearsal_date"),
      nextRehearsalTime: nullableText(formData, "next_rehearsal_time"),
      nextRehearsalLocation: nullableText(formData, "next_rehearsal_location"),
      nextRehearsalNotes: nullableText(formData, "next_rehearsal_notes"),
      attendancePresent: intValue(formData, "attendance_present"),
      attendanceAbsent: intValue(formData, "attendance_absent"),
      attendanceLate: intValue(formData, "attendance_late"),
      breaks: parseJsonArray<Break>(formData, "breaks_json", isBreak),
      scenesWorked: parseJsonArray<SceneWorked>(
        formData,
        "scenes_worked_json",
        isSceneWorked,
      ),
      scheduleChanges: parseJsonArray<ScheduleChange>(
        formData,
        "schedule_changes_json",
        isScheduleChange,
      ),
      attendanceNotes: parseJsonArray<AttendanceNote>(
        formData,
        "attendance_notes_json",
        isAttendanceNote,
      ),
      lineNotes: parseJsonArray<LineNote>(formData, "line_notes_json", isLineNote),
      injuries: parseJsonArray<Injury>(formData, "injuries_json", isInjury),
      departments,
    },
  };
}
