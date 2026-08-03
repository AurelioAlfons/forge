/**
 * Single source of truth for site-wide copy and metadata.
 * Edit here rather than hardcoding strings into components.
 */
export const site = {
  name: "Aurelio Alfons",
  role: "Software Engineer",
  description: "Portfolio and personal site of Aurelio Alfons.",
  url: "https://forge.vercel.app",
  nav: [
    { href: "/#work", label: "Work" },
    { href: "/#about", label: "About" },
    { href: "/#contact", label: "Contact" },
  ],
  social: {
    github: "https://github.com/AurelioAlfons",
    // linkedin sits out until i've got the real slug, dead link is worse than none
    email: "yuroalfons0407@gmail.com",
  },
} as const;
