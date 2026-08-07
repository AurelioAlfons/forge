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

// pulled from the old portfolio's ProjectSection.tsx, plus archive and this
// site's own predecessor. cat-mail dropped on request.
export const projects = [
  {
    slug: "pokesim",
    title: "PokeSim",
    blurb: "Gen 4 Pokemon battle simulator built with React and FastAPI.",
    stack: ["React", "FastAPI", "Python"],
    link: "https://poke-sim-two.vercel.app",
    thumbnail: "/projects/pokesim.png",
  },
  {
    slug: "smart-foot-traffic",
    title: "Smart Foot Traffic",
    blurb:
      "Interactive heatmap system with filtering, built for a council capstone.",
    stack: ["Python", "Flutter"],
    link: "https://www.linkedin.com/posts/aurelio-alfons_uidesign-frontendmagic-flutterdev-ugcPost-7351905548038033408-BzZO",
    // TODO: swap for the real heatmap screenshot once it is on disk
    thumbnail: "/projects/smart-foot-traffic.jpg",
  },
  {
    slug: "watchwise-ai",
    title: "WatchWise AI",
    blurb: "AI movie recommendations powered by Gemini and TMDB.",
    stack: ["React", "TypeScript", "Tailwind", "Gemini"],
    link: "https://watchwise-ai-puce.vercel.app",
    // TODO: swap for the real mood-picker screenshot once it is on disk
    thumbnail: "/projects/watchwise-ai.jpeg",
  },
  {
    slug: "archive",
    title: "Archive",
    blurb:
      "A multi-agent workspace: named agents run daily tasks, track job applications and keep a live mission log.",
    stack: ["TypeScript"],
    link: "https://lnkd.in/p/grZn-yGc",
    thumbnail: "/projects/archive.png",
  },
  {
    slug: "portfolio",
    title: "Portfolio",
    blurb:
      "My previous personal site: a WebGL fluid background, a live Spotify player, and scroll-driven motion throughout.",
    stack: ["Next.js", "TypeScript", "Tailwind", "GLSL"],
    link: "https://aurelioalfons-portfolio.vercel.app/#home",
    thumbnail: "/projects/portfolio.webp",
  },
] as const satisfies readonly Project[];

export const PROJECT_COUNT = projects.length;
