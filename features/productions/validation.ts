export type ProductionFormErrors = {
  title?: string;
  opening_date?: string;
  closing_date?: string;
};

export type ProductionFormData = {
  title: string;
  slug: string;
  status: string;
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

  const errors: ProductionFormErrors = {};

  if (!title || title.length === 0) {
    errors.title = "Title is required.";
  } else if (title.length > 200) {
    errors.title = "Title must be under 200 characters.";
  }

  if (openingDate && closingDate && openingDate > closingDate) {
    errors.closing_date = "Closing date cannot be before opening date.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    data: {
      title,
      slug,
      status,
      openingDate,
      closingDate,
    },
  };
}
