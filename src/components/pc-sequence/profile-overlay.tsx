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
    <div className="pointer-events-none absolute inset-10 z-10">
      <section
        data-profile-intro
        aria-labelledby="intro-heading"
        className="absolute top-[clamp(6rem,13svh,8rem)] left-4 w-[min(26rem,calc(100vw-2rem))] sm:left-[clamp(4.75rem,6vw,6rem)]"
      >
        <h1
          id="intro-heading"
          className="text-fg max-w-[9ch] text-[clamp(2.75rem,4.7vw,4.75rem)] leading-[0.88] font-semibold tracking-[-0.055em]"
        >
          Aurelio Hevi
          <br />
          Alfons
        </h1>
        <p className="text-muted mt-m max-w-100 text-sm leading-relaxed sm:text-lg">
          {site.description}
        </p>
      </section>

      <nav
        data-social-links
        aria-label="Social profiles"
        className="pointer-events-auto absolute bottom-[max(env(safe-area-inset-bottom),1.5rem)] left-16 flex items-center gap-10.5 sm:left-[clamp(5.75rem,6vw,6rem)]"
      >
        {socialLinks.map(({ href, label, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            title={label}
            className="text-muted grid size-13 place-items-center rounded-sm transition-all duration-200 hover:text-[#dfa812]"
          >
            <Icon aria-hidden="true" className="size-25" />
          </a>
        ))}
      </nav>
    </div>
  );
}
