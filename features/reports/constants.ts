export const DEPARTMENTS = [
  { key: "deptScenery", field: "dept_scenery", label: "Scenery / Set" },
  { key: "deptProps", field: "dept_props", label: "Props" },
  { key: "deptCostumes", field: "dept_costumes", label: "Costumes" },
  { key: "deptHairMakeup", field: "dept_hair_makeup", label: "Hair & Makeup" },
  { key: "deptLighting", field: "dept_lighting", label: "Lighting" },
  { key: "deptSound", field: "dept_sound", label: "Sound" },
  { key: "deptSoundEffects", field: "dept_sound_effects", label: "Sound Effects" },
  { key: "deptMusic", field: "dept_music", label: "Music" },
  { key: "deptChoreography", field: "dept_choreography", label: "Choreography" },
  { key: "deptVideo", field: "dept_video", label: "Video / Projection" },
  { key: "deptCrew", field: "dept_crew", label: "Crew" },
  { key: "deptOther", field: "dept_other", label: "Other" },
] as const;

export type DepartmentKey = (typeof DEPARTMENTS)[number]["key"];
export type DepartmentField = (typeof DEPARTMENTS)[number]["field"];
