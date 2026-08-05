export type Project = {
  slug: string;
  title: string;
  blurb: string;
  stack: readonly string[];
  /** Repo or live URL. */
  link: string;
  /** Lives in public/projects/. Gets cropped into every slot shape, so a
   *  square-ish source survives better than a wide one. */
  thumbnail: string;
};

// placeholders so the carousel is buildable and checkable before the real
// work goes in. swap the entries, nothing else needs touching.
export const projects = [
  {
    slug: "pokesim",
    title: "PokeSim",
    blurb: "A full-stack Pokemon battle simulator with a real turn-based engine.",
    stack: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    link: "https://github.com/AurelioAlfons",
    thumbnail: "/projects/placeholder.svg",
  },
  {
    slug: "recommender",
    title: "Recommendation App",
    blurb: "An AI-powered recommendation app that only suggests real, verified titles.",
    stack: ["Next.js", "TypeScript", "Claude API"],
    link: "https://github.com/AurelioAlfons",
    thumbnail: "/projects/placeholder.svg",
  },
  {
    slug: "capstone",
    title: "Council Capstone",
    blurb: "A community reporting tool built with and for a local council.",
    stack: ["Flutter", "Supabase", "MySQL"],
    link: "https://github.com/AurelioAlfons",
    thumbnail: "/projects/placeholder.svg",
  },
  {
    slug: "forge",
    title: "Forge",
    blurb: "This site. One scroll-driven sequence instead of stacked sections.",
    stack: ["Next.js", "GSAP", "Tailwind CSS"],
    link: "https://github.com/AurelioAlfons/forge",
    thumbnail: "/projects/placeholder.svg",
  },
] as const satisfies readonly Project[];

export const PROJECT_COUNT = projects.length;
