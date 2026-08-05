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
  block: "left" | "right";
  /** Columns count outward from the fan. */
  col: number;
  row: number;
  order: number;
};

// both grids sit filled solid, left 3x3 and right 2x4, so the outline is a
// rhombus instead of a staircase. column 0 is nearest the fan, so the stack
// i'd actually get hired on lands closest and shows up first.
export const skills = [
  // ===== LEFT, COLUMN 0 (nearest the fan) =====
  {
    id: "react",
    name: "React",
    icon: SiReact,
    color: "#61DAFB",
    block: "left",
    col: 0,
    row: 0,
    order: 1,
  },
  {
    id: "nextjs",
    name: "Next.js",
    icon: SiNextdotjs,
    color: "#FFFFFF",
    block: "left",
    col: 0,
    row: 1,
    order: 3,
  },
  {
    id: "nodejs",
    name: "Node.js",
    icon: SiNodedotjs,
    color: "#5FA04E",
    block: "left",
    col: 0,
    row: 2,
    order: 5,
  },
  // ===== LEFT, COLUMN 1 =====
  {
    id: "python",
    name: "Python",
    icon: SiPython,
    color: "#3776AB",
    block: "left",
    col: 1,
    row: 0,
    order: 7,
  },
  {
    id: "tailwindcss",
    name: "Tailwind CSS",
    icon: SiTailwindcss,
    color: "#06B6D4",
    block: "left",
    col: 1,
    row: 1,
    order: 9,
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    icon: SiPostgresql,
    color: "#4169E1",
    block: "left",
    col: 1,
    row: 2,
    order: 11,
  },
  // ===== LEFT, COLUMN 2 (outermost) =====
  {
    id: "supabase",
    name: "Supabase",
    icon: SiSupabase,
    color: "#3FCF8E",
    block: "left",
    col: 2,
    row: 0,
    order: 13,
  },
  {
    id: "css",
    name: "CSS3",
    icon: SiCss,
    color: "#663399",
    block: "left",
    col: 2,
    row: 1,
    order: 15,
  },
  {
    id: "r",
    name: "R",
    icon: SiR,
    color: "#276DC3",
    block: "left",
    col: 2,
    row: 2,
    order: 17,
  },
  // ===== RIGHT, COLUMN 0 (nearest the fan) =====
  {
    id: "typescript",
    name: "TypeScript",
    icon: SiTypescript,
    color: "#3178C6",
    block: "right",
    col: 0,
    row: 0,
    order: 2,
  },
  {
    id: "javascript",
    name: "JavaScript",
    icon: SiJavascript,
    color: "#F7DF1E",
    block: "right",
    col: 0,
    row: 1,
    order: 4,
  },
  {
    id: "java",
    name: "Java",
    icon: SiOpenjdk,
    color: "#F89820",
    block: "right",
    col: 0,
    row: 2,
    order: 6,
  },
  {
    id: "mysql",
    name: "MySQL",
    icon: SiMysql,
    color: "#4479A1",
    block: "right",
    col: 0,
    row: 3,
    order: 8,
  },
  // ===== RIGHT, COLUMN 1 (outermost) =====
  {
    id: "flutter",
    name: "Flutter",
    icon: SiFlutter,
    color: "#02569B",
    block: "right",
    col: 1,
    row: 0,
    order: 10,
  },
  {
    id: "html5",
    name: "HTML5",
    icon: SiHtml5,
    color: "#E34F26",
    block: "right",
    col: 1,
    row: 1,
    order: 12,
  },
  {
    id: "vercel",
    name: "Vercel",
    icon: SiVercel,
    color: "#FFFFFF",
    block: "right",
    col: 1,
    row: 2,
    order: 14,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    icon: FaSalesforce,
    color: "#00A1E0",
    block: "right",
    col: 1,
    row: 3,
    order: 16,
  },
] as const satisfies readonly Skill[];

// next and vercel ship pure black marks that vanish here, so their tiles go
// white and inkFor() flips the logo dark. java's is black too, so it gets the
// classic orange instead.
export const SKILL_COUNT = skills.length;
