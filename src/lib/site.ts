/**
 * Single source of truth for site-wide copy and metadata.
 * Edit here rather than hardcoding strings into components.
 */
export const site = {
  name: "Aurelio Alfons",
  role: "Software Engineer",
  description: "Portfolio and personal site of Aurelio Alfons.",
  url: "https://example.com", // TODO: swap for the real domain
  nav: [
    { href: "/#work", label: "Work" },
    { href: "/#about", label: "About" },
    { href: "/#contact", label: "Contact" },
  ],
  social: {
    github: "https://github.com/",
    linkedin: "https://linkedin.com/in/",
    email: "yuroalfons0407@gmail.com",
  },
} as const;
