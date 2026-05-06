import { DEPARTMENTS } from "./constants";

export type ReportFormErrors = {
  report_date?: string;
  general_notes?: string;
};

export type ReportFormData = {
  reportDate: string;
  generalNotes: string;
  scheduledCall: string | null;
  actualStart: string | null;
  endTime: string | null;
  nextRehearsalDate: string | null;
  nextRehearsalTime: string | null;
  nextRehearsalLocation: string | null;
  nextRehearsalNotes: string | null;
  departments: Record<string, string | null>;
};

function nullableText(formData: FormData, name: string): string | null {
  const v = (formData.get(name) as string | null)?.trim();
  return v ? v : null;
}

export function validateReportForm(formData: FormData): {
  data?: ReportFormData;
  errors?: ReportFormErrors;
} {
  const reportDate = (formData.get("report_date") as string)?.trim();
  const generalNotes = (formData.get("general_notes") as string)?.trim() ?? "";

  const errors: ReportFormErrors = {};

  if (!reportDate) {
    errors.report_date = "Report date is required.";
  }

  if (!generalNotes) {
    errors.general_notes = "General notes are required.";
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
      generalNotes,
      scheduledCall: nullableText(formData, "scheduled_call"),
      actualStart: nullableText(formData, "actual_start"),
      endTime: nullableText(formData, "end_time"),
      nextRehearsalDate: nullableText(formData, "next_rehearsal_date"),
      nextRehearsalTime: nullableText(formData, "next_rehearsal_time"),
      nextRehearsalLocation: nullableText(formData, "next_rehearsal_location"),
      nextRehearsalNotes: nullableText(formData, "next_rehearsal_notes"),
      departments,
    },
  };
}
