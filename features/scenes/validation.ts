export type SceneFormErrors = {
  title?: string;
  actNumber?: string;
  sceneNumber?: string;
};

export type SceneFormData = {
  productionId: string;
  actNumber: number;
  sceneNumber: number;
  title: string;
  orderIndex: number;
};

export function validateSceneForm(formData: FormData): {
  data?: SceneFormData;
  errors?: SceneFormErrors;
} {
  const errors: SceneFormErrors = {};
  const productionId = formData.get("production_id") as string;
  const title = (formData.get("title") as string)?.trim();
  const actNumber = parseInt(formData.get("act_number") as string, 10);
  const sceneNumber = parseInt(formData.get("scene_number") as string, 10);
  const orderIndex = parseInt(
    (formData.get("order_index") as string) ?? "0",
    10,
  );

  if (!title) errors.title = "Scene title is required.";
  if (isNaN(actNumber) || actNumber < 1) errors.actNumber = "Act number must be at least 1.";
  if (isNaN(sceneNumber) || sceneNumber < 1) errors.sceneNumber = "Scene number must be at least 1.";

  if (Object.keys(errors).length > 0) return { errors };

  return {
    data: {
      productionId,
      actNumber,
      sceneNumber,
      title,
      orderIndex: isNaN(orderIndex) ? 0 : orderIndex,
    },
  };
}

export type BeatFormErrors = {
  label?: string;
};

export function validateBeatForm(formData: FormData): {
  data?: { sceneId: string; label: string; orderIndex: number };
  errors?: BeatFormErrors;
} {
  const errors: BeatFormErrors = {};
  const sceneId = formData.get("scene_id") as string;
  const label = (formData.get("label") as string)?.trim();
  const orderIndex = parseInt(
    (formData.get("order_index") as string) ?? "0",
    10,
  );

  if (!label) errors.label = "Beat label is required.";
  if (Object.keys(errors).length > 0) return { errors };

  return {
    data: {
      sceneId,
      label,
      orderIndex: isNaN(orderIndex) ? 0 : orderIndex,
    },
  };
}
