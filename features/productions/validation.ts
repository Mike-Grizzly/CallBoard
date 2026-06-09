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

// Hard sanity cap on how far out a closing date may be set. The free-trial
// operational lock at day 90 already caps free usage regardless of the closing
// date (it's keyed to the immutable trial anchor, not the show dates), so this
// is purely data hygiene — it blocks absurd values (e.g. a 2099 closing), and
// no real production ever approaches it.
export const MAX_CLOSING_MONTHS = 18;

export function closingDateBeyondCap(
  closingDate: string | null,
  from: Date = new Date(),
): boolean {
  if (!closingDate) return false;
  const cap = new Date(from);
  cap.setMonth(cap.getMonth() + MAX_CLOSING_MONTHS);
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
  } else if (closingDateBeyondCap(closingDate)) {
    errors.closing_date = `Closing date can't be more than ${MAX_CLOSING_MONTHS} months out.`;
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
