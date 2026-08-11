import type { IconType } from "react-icons";
import { FaSalesforce } from "react-icons/fa";
import {
  SiCss,
  SiFlutter,
  SiHtml5,
  SiJavascript,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiOpenjdk,
  SiPostgresql,
  SiPython,
  SiR,
  SiReact,
  SiSupabase,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
} from "react-icons/si";

export type Skill = {
  id: string;
  name: string;
  icon: IconType;
  color: string;
  /** Inner ring (6, the headline stack) or outer ring (11, everything else). */
  ring: 1 | 2;
  order: number;
};

// order still drives the materialize/dematerialize sequence in
// pc-sequence-section.tsx — untouched by the ring rework, ring is purely
// about where an icon orbits, not when it appears.
export const skills = [
  {
    id: "react",
    name: "React",
    icon: SiReact,
    color: "#61DAFB",
    ring: 1,
    order: 1,
  },
  {
    id: "typescript",
    name: "TypeScript",
    icon: SiTypescript,
    color: "#3178C6",
    ring: 1,
    order: 2,
  },
  {
    id: "nextjs",
    name: "Next.js",
    icon: SiNextdotjs,
    color: "#FFFFFF",
    ring: 1,
    order: 3,
  },
  {
    id: "javascript",
    name: "JavaScript",
    icon: SiJavascript,
    color: "#F7DF1E",
    ring: 2,
    order: 4,
  },
  {
    id: "nodejs",
    name: "Node.js",
    icon: SiNodedotjs,
    color: "#5FA04E",
    ring: 1,
    order: 5,
  },
  {
    id: "java",
    name: "Java",
    icon: SiOpenjdk,
    color: "#F89820",
    ring: 2,
    order: 6,
  },
  {
    id: "python",
    name: "Python",
    icon: SiPython,
    color: "#3776AB",
    ring: 1,
    order: 7,
  },
  {
    id: "mysql",
    name: "MySQL",
    icon: SiMysql,
    color: "#4479A1",
    ring: 2,
    order: 8,
  },
  {
    id: "tailwindcss",
    name: "Tailwind CSS",
    icon: SiTailwindcss,
    color: "#06B6D4",
    ring: 1,
    order: 9,
  },
  {
    id: "flutter",
    name: "Flutter",
    icon: SiFlutter,
    color: "#02569B",
    ring: 2,
    order: 10,
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    icon: SiPostgresql,
    color: "#4169E1",
    ring: 2,
    order: 11,
  },
  {
    id: "html5",
    name: "HTML5",
    icon: SiHtml5,
    color: "#E34F26",
    ring: 2,
    order: 12,
  },
  {
    id: "supabase",
    name: "Supabase",
    icon: SiSupabase,
    color: "#3FCF8E",
    ring: 2,
    order: 13,
  },
  {
    id: "vercel",
    name: "Vercel",
    icon: SiVercel,
    color: "#FFFFFF",
    ring: 2,
    order: 14,
  },
  {
    id: "css",
    name: "CSS3",
    icon: SiCss,
    color: "#663399",
    ring: 2,
    order: 15,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    icon: FaSalesforce,
    color: "#00A1E0",
    ring: 2,
    order: 16,
  },
  {
    id: "r",
    name: "R",
    icon: SiR,
    color: "#276DC3",
    ring: 2,
    order: 17,
  },
] as const satisfies readonly Skill[];

// next and vercel ship pure black marks that vanish here, so their badges go
// white and the icon renders in its own brand colour against the dark tint.
export const SKILL_COUNT = skills.length;
