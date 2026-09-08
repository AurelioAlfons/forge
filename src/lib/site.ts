/**
 * Single source of truth for site-wide copy and metadata.
 * Edit here rather than hardcoding strings into components.
 */
export const site = {
  name: "Aurelio Hevi Alfons",
  displayName: "Aurelio Alfons",
  systemName: "Forge OS",
  role: "Software Developer",
  description: "I build web experiences, AI tools, and automation.",
  url: "https://forge.vercel.app",
  nav: [
    { href: "/#home", label: "Home" },
    { href: "/#projects", label: "Missions" },
    { href: "/#skills", label: "Loadout" },
    { href: "/#experience", label: "Log" },
    { href: "/#contact", label: "Contact" },
  ],
  social: {
    github: "https://github.com/AurelioAlfons",
    linkedin: "https://www.linkedin.com/in/aurelio-alfons",
    email: "yuroalfons0407@gmail.com",
  },
  // real pdf now lives in public/resume/, copied straight from the CV folder
  resume: {
    href: "/resume/Aurelio_Hevi_Alfons_CV.pdf",
    filename: "Aurelio_Hevi_Alfons_CV.pdf",
  },
} as const;
