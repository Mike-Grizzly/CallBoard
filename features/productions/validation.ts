import { isValidProductionColor } from "./constants";

/** Turn a title into a URL slug. Not uniqueness-checked — callers that need
 *  org-unique slugs should disambiguate (see generateUniqueSlug in actions). */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type ProductionFormErrors = {
  title?: string;
  opening_date?: string;
  closing_date?: string;
};

// Sanity limit on how long after OPENING a closing date may sit. This is pure
// typo protection (catching a fat-fingered 2099), NOT a billing lever: the
// closing date doesn't affect the trial at all, which is anchored to
// first-production creation and locks at day 90 regardless of show dates.
//
// Open-ended / TBD runs are fully supported — leave the closing date blank and
// nothing here fires. The limit only applies when BOTH dates are set, and it's
// generous enough (18 months past opening) that no real production trips it.
export const MAX_RUN_MONTHS = 18;

export function closingDateBeyondCap(
  openingDate: string | null,
  closingDate: string | null,
): boolean {
  if (!openingDate || !closingDate) return false;
  const cap = new Date(openingDate);
  cap.setMonth(cap.getMonth() + MAX_RUN_MONTHS);
  return new Date(closingDate).getTime() > cap.getTime();
}

export type ProductionFormData = {
  title: string;
  slug: string;
  status: string;
  color: string | null;
  openingDate: string | null;
  closingDate: string | null;
};

export function validateProductionForm(formData: FormData): {
  data?: ProductionFormData;
  errors?: ProductionFormErrors;
} {
  const title = (formData.get("title") as string)?.trim();
  const openingDate = (formData.get("opening_date") as string) || null;
  const closingDate = (formData.get("closing_date") as string) || null;
  const status = (formData.get("status") as string) || "draft";
  const rawColor = (formData.get("color") as string) || null;
  const color = isValidProductionColor(rawColor) ? rawColor : null;

  const errors: ProductionFormErrors = {};

  if (!title || title.length === 0) {
    errors.title = "Title is required.";
  } else if (title.length > 200) {
    errors.title = "Title must be under 200 characters.";
  }

  if (openingDate && closingDate && openingDate > closingDate) {
    errors.closing_date = "Closing date cannot be before opening date.";
  } else if (closingDateBeyondCap(openingDate, closingDate)) {
    errors.closing_date = `Closing date can't be more than ${MAX_RUN_MONTHS} months after opening.`;
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const slug = slugify(title);

  return {
    data: {
      title,
      slug,
      status,
      color,
      openingDate,
      closingDate,
    },
  };
}
