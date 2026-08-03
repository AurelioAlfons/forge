import { site } from "@/lib/site";

export function ContactSection() {
  return (
    <section id="contact" className="container-page py-2xl">
      <h2 className="text-step-3 font-semibold tracking-tight">Contact</h2>
      <a
        href={`mailto:${site.social.email}`}
        className="text-accent mt-s inline-block underline underline-offset-4"
      >
        {site.social.email}
      </a>
    </section>
  );
}
