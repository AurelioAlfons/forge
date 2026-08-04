export type TimelineItem = {
  id: "home" | "projects" | "skills" | "resume" | "contact";
  label: string;
  progress: number;
};

export const timelineItems = [
  { id: "home", label: "Home", progress: 0 },
  { id: "projects", label: "Projects", progress: 0.25 },
  { id: "skills", label: "Skills", progress: 0.5 },
  { id: "resume", label: "Resume", progress: 0.75 },
  { id: "contact", label: "Contact", progress: 1 },
] as const satisfies readonly TimelineItem[];
