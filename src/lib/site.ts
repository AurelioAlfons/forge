/**
 * Single source of truth for site-wide copy and metadata.
 * Edit here rather than hardcoding strings into components.
 */
export const site = {
  name: "Aurelio Hevi Alfons",
  role: "Emerging Software Developer",
  description:
    "Emerging software developer who enjoys building cool projects and exploring AI, LLMs, and automation. Always learning, experimenting.",
  url: "https://forge.vercel.app",
  nav: [
    { href: "/#work", label: "Work" },
    { href: "/#about", label: "About" },
    { href: "/#contact", label: "Contact" },
  ],
  social: {
    github: "https://github.com/AurelioAlfons",
    linkedin: "https://www.linkedin.com/in/aurelio-alfons",
    email: "yuroalfons0407@gmail.com",
  },
} as const;
