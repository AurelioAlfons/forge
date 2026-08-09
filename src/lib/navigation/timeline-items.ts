export type TimelineItem = {
  id: "home" | "projects" | "skills" | "experience" | "contact";
  label: string;
  // placeholder fraction of total document scroll. "projects", "skills",
  // "experience" and "contact" all get resolved to a real position at
  // runtime (see page-timeline.tsx) — this number is only ever seen before
  // that first resolve runs. "home" is the only one that stays exactly 0.
  progress: number;
};

export const timelineItems = [
  { id: "home", label: "Home", progress: 0 },
  { id: "projects", label: "Projects", progress: 0.25 },
  { id: "skills", label: "Skills", progress: 0.5 },
  { id: "experience", label: "Experience", progress: 0.75 },
  { id: "contact", label: "Contact", progress: 1 },
] as const satisfies readonly TimelineItem[];
