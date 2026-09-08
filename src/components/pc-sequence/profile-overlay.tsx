import { FaGithub, FaLinkedin } from "react-icons/fa";
import { site } from "@/lib/site";

const socialLinks = [
  {
    href: site.social.github,
    label: "GitHub",
    icon: FaGithub,
  },
  {
    href: site.social.linkedin,
    label: "LinkedIn",
    icon: FaLinkedin,
  },
] as const;

export function ProfileOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <section
        data-profile-intro
        aria-labelledby="intro-heading"
        className="hero-identity absolute"
      >
        <p className="system-label mb-5">
          <span className="system-indicator" aria-hidden="true" />
          {site.systemName}{" "}
          <span className="text-white/55">/ Developer profile</span>
        </p>

        <h1
          id="intro-heading"
          className="hero-name text-fg font-semibold tracking-[-0.055em] uppercase"
        >
          {site.displayName}
        </h1>
        <p className="system-label mt-4">{site.role}</p>
        <p className="hero-description text-muted mt-3 text-sm leading-relaxed sm:text-base">
          {site.description}
        </p>
        {/* both links use the ruler's existing anchor mapping. */}
        <nav
          aria-label="Profile actions"
          className="hero-actions pointer-events-auto"
        >
          <a href="#projects" className="system-action system-action-primary">
            View missions <span aria-hidden="true">↗</span>
          </a>
          <a href="#contact" className="system-action">
            Contact
          </a>
        </nav>
      </section>

      <nav
        data-social-links
        aria-label="Social profiles"
        className={`pointer-events-auto absolute bottom-[max(env(safe-area-inset-bottom),2.5rem)] left-14 flex items-center gap-6 sm:left-[clamp(5rem,8.8vw,8rem)]`}
      >
        {socialLinks.map(({ href, label, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${label} (opens in a new tab)`}
            title={label}
            className="text-muted grid size-11 place-items-center rounded-sm transition-colors duration-200 hover:text-[#dfa812]"
          >
            <Icon aria-hidden="true" className="size-9" />
          </a>
        ))}
      </nav>
    </div>
  );
}
