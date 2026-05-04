export type ReportFormErrors = {
  report_date?: string;
  general_notes?: string;
};

export type ReportFormData = {
  reportDate: string;
  generalNotes: string;
  scheduleNotes: string;
};

export function validateReportForm(formData: FormData): {
  data?: ReportFormData;
  errors?: ReportFormErrors;
} {
  const reportDate = (formData.get("report_date") as string)?.trim();
  const generalNotes = (formData.get("general_notes") as string)?.trim() ?? "";
  const scheduleNotes =
    (formData.get("schedule_notes") as string)?.trim() ?? "";

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

  return {
    data: { reportDate, generalNotes, scheduleNotes },
  };
}
