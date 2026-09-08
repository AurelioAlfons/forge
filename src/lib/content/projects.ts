import type { CaseStudy } from "./types";

// these facts came from the portfolio; missing fields stay explicit.
export const caseStudies: readonly CaseStudy[] = [
  {
    slug: "pokesim",
    title: "PokeSim",
    blurb: "Gen 4 Pokemon battle simulator built with React and FastAPI.",
    stack: ["React", "FastAPI", "Python"],
    thumbnail: "/projects/pokesim.png",
    collection: "flagship",
    status: null,
    problem: null,
    role: null,
    built: [
      {
        text: "I built a Gen 4 Pokemon battle simulator with React and FastAPI.",
        source: "Existing portfolio project descriptions at e8de811",
      },
    ],
    evidence: [
      {
        text: "A turn-based combat engine.",
        source:
          "Owner writing guide: grimoire/writing-guidelines/ANTI_AI_WRITING_STYLE.md",
      },
    ],
    outcome: null,
    links: [
      {
        kind: "live",
        url: "https://poke-sim-two.vercel.app",
      },
    ],
    ownerInputs: [
      "problem",
      "role",
      "technical-decision",
      "outcome",
      "source-url",
      "status",
    ],
  },
  {
    slug: "smart-foot-traffic",
    title: "Smart Foot Traffic",
    blurb:
      "Interactive heatmap system with filtering, built for a council capstone.",
    stack: ["Python", "Flutter"],
    thumbnail: "/projects/smart-foot-traffic.jpg",
    collection: "flagship",
    status: "CAPSTONE",
    problem: null,
    role: null,
    built: [
      {
        text: "I built an interactive heatmap system with filtering for a council capstone.",
        source: "Existing portfolio project descriptions at e8de811",
      },
    ],
    evidence: [],
    outcome: null,
    links: [
      {
        kind: "case-study",
        url: "https://www.linkedin.com/posts/aurelio-alfons_uidesign-frontendmagic-flutterdev-ugcPost-7351905548038033408-BzZO",
      },
    ],
    ownerInputs: [
      "problem",
      "role",
      "technical-decision",
      "outcome",
      "source-url",
      "cover",
    ],
  },
  {
    slug: "watchwise-ai",
    title: "WatchWise AI",
    blurb: "AI movie recommendations powered by Gemini and TMDB.",
    stack: ["React", "TypeScript", "Tailwind", "Gemini"],
    thumbnail: "/projects/watchwise-ai.jpeg",
    collection: "flagship",
    status: null,
    problem: null,
    role: null,
    built: [
      {
        text: "I built movie recommendations powered by Gemini and TMDB.",
        source: "Existing portfolio project descriptions at e8de811",
      },
    ],
    evidence: [],
    outcome: null,
    links: [
      {
        kind: "live",
        url: "https://watchwise-ai-puce.vercel.app",
      },
    ],
    ownerInputs: [
      "problem",
      "role",
      "technical-decision",
      "outcome",
      "source-url",
      "status",
      "cover",
    ],
  },
  {
    slug: "archive",
    title: "Archive",
    blurb:
      "A multi-agent workspace: named agents run daily tasks, track job applications and keep a live mission log.",
    stack: ["TypeScript"],
    thumbnail: "/projects/archive.png",
    collection: "flagship",
    status: null,
    problem: null,
    role: null,
    built: [
      {
        text: "I built a workspace where named agents run daily tasks, track job applications, and keep a live mission log.",
        source: "Existing portfolio project descriptions at e8de811",
      },
    ],
    evidence: [],
    outcome: null,
    links: [
      {
        kind: "case-study",
        url: "https://lnkd.in/p/grZn-yGc",
      },
    ],
    ownerInputs: [
      "problem",
      "role",
      "technical-decision",
      "outcome",
      "source-url",
      "status",
      "public-demo",
    ],
  },
  {
    slug: "portfolio",
    title: "Portfolio",
    blurb:
      "My previous personal site: a WebGL fluid background, a live Spotify player, and scroll-driven motion throughout.",
    stack: ["Next.js", "TypeScript", "Tailwind", "GLSL"],
    thumbnail: "/projects/portfolio.webp",
    collection: "more-builds",
    status: "PREVIOUS PORTFOLIO",
    problem: null,
    role: null,
    built: [
      {
        text: "I built a personal site with a WebGL fluid background, a live Spotify player, and scroll-driven motion.",
        source: "Existing portfolio project descriptions at e8de811",
      },
    ],
    evidence: [],
    outcome: null,
    links: [
      {
        kind: "live",
        url: "https://aurelioalfons-portfolio.vercel.app/#home",
      },
    ],
    ownerInputs: [
      "problem",
      "role",
      "technical-decision",
      "outcome",
      "source-url",
    ],
  },
];

export const flagshipProjects = caseStudies.filter(
  (project) => project.collection === "flagship",
);
export const moreBuilds = caseStudies.filter(
  (project) => project.collection === "more-builds",
);

// the current carousel keeps its five slots until the mission archive gate.
export type Project = CaseStudy & { link: string };
export const projects: readonly Project[] = [
  ...moreBuilds,
  ...flagshipProjects,
].map((project) => ({ ...project, link: project.links[0].url }));
export const PROJECT_COUNT = projects.length;
