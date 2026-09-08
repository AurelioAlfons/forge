export type TimelineItem = {
  id: "home" | "projects" | "skills" | "experience" | "contact";
  label: string;
  // the authored slot on the visible ruler. real page positions stay uneven;
  // page-timeline remaps each live chapter gap into one equal slot at runtime.
  progress: number;
};

export const timelineItems = [
  { id: "home", label: "Home", progress: 0 },
  { id: "projects", label: "Missions", progress: 0.25 },
  { id: "skills", label: "Loadout", progress: 0.5 },
  { id: "experience", label: "Log", progress: 0.75 },
  { id: "contact", label: "Contact", progress: 1 },
] as const satisfies readonly TimelineItem[];
