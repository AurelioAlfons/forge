import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";
import { site } from "@/lib/site";

// same icon source ProfileOverlay already uses for GitHub/LinkedIn — email
// just rides along on the same package instead of pulling in a second one
const socialLinks = [
  { href: site.social.github, label: "GitHub", icon: FaGithub },
  { href: site.social.linkedin, label: "LinkedIn", icon: FaLinkedin },
  { href: `mailto:${site.social.email}`, label: "Email", icon: FaEnvelope },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-border mt-5xl border-t">
      <div className="container-page py-l">
        <div className="text-step--1 text-muted gap-y-s flex flex-col items-start sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Social profiles" className="gap-m flex items-center">
            {socialLinks.map(({ href, label, icon: Icon }) => {
              const isMailto = href.startsWith("mailto:");
              return (
                <a
                  key={label}
                  href={href}
                  target={isMailto ? undefined : "_blank"}
                  rel={isMailto ? undefined : "noreferrer"}
                  aria-label={label}
                  title={label}
                  className="text-muted transition-colors hover:text-[#dfa812]"
                >
                  <Icon aria-hidden="true" className="size-14" />
                </a>
              );
            })}
          </nav>

          <p>Built with React, Next.js, TailwindCSS</p>
        </div>

        <p className="text-step--1 text-muted mt-s text-center">
          Copyright © {new Date().getFullYear()} {site.name}. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
