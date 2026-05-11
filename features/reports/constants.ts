import type { IconName } from "@/components/ui/icon";

type DemoColor = "sage" | "sand" | "clay" | "plum" | "amber" | "dusk" | "accent" | "";

export const DEPARTMENTS = [
  { key: "deptScenery", field: "dept_scenery", label: "Scenery / Set", icon: "Layout", c: "sage" },
  { key: "deptProps", field: "dept_props", label: "Props", icon: "Layers", c: "sand" },
  { key: "deptCostumes", field: "dept_costumes", label: "Costumes", icon: "Tag", c: "clay" },
  { key: "deptHairMakeup", field: "dept_hair_makeup", label: "Hair & Makeup", icon: "Scissors", c: "plum" },
  { key: "deptLighting", field: "dept_lighting", label: "Lighting", icon: "Lightbulb", c: "amber" },
  { key: "deptSound", field: "dept_sound", label: "Sound", icon: "Volume2", c: "dusk" },
  { key: "deptSoundEffects", field: "dept_sound_effects", label: "Sound Effects", icon: "Volume2", c: "dusk" },
  { key: "deptMusic", field: "dept_music", label: "Music", icon: "Music", c: "plum" },
  { key: "deptChoreography", field: "dept_choreography", label: "Choreography", icon: "Footprints", c: "sage" },
  { key: "deptVideo", field: "dept_video", label: "Video / Projection", icon: "Video", c: "dusk" },
  { key: "deptCrew", field: "dept_crew", label: "Crew", icon: "Users", c: "sand" },
  { key: "deptOther", field: "dept_other", label: "Other", icon: "FileText", c: "" },
] as const satisfies ReadonlyArray<{
  key: string;
  field: string;
  label: string;
  icon: IconName;
  c: DemoColor;
}>;

export type DepartmentKey = (typeof DEPARTMENTS)[number]["key"];
export type DepartmentField = (typeof DEPARTMENTS)[number]["field"];
