import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="flex-1">
        <section className="container-page py-3xl">
          <p className="text-accent text-step--1 font-mono tracking-widest uppercase">
            {site.role}
          </p>
          <h1 className="mt-xs text-step-5 max-w-[15ch] font-semibold tracking-tight">
            {site.name}
          </h1>
          <p className="mt-m max-w-measure text-step-1 text-muted">
            Placeholder hero copy. Everything on this page scales fluidly
            between a 320px phone and a 1440px desktop — no breakpoint jumps.
          </p>
        </section>

        <section id="work" className="container-page py-2xl">
          <h2 className="text-step-3 font-semibold tracking-tight">Work</h2>
          <p className="mt-s max-w-measure text-muted">Projects go here.</p>
        </section>

        <section id="about" className="container-page py-2xl">
          <h2 className="text-step-3 font-semibold tracking-tight">About</h2>
          <p className="mt-s max-w-measure text-muted">Bio goes here.</p>
        </section>

        <section id="contact" className="container-page py-2xl">
          <h2 className="text-step-3 font-semibold tracking-tight">Contact</h2>
          <a
            href={`mailto:${site.social.email}`}
            className="text-accent mt-s inline-block underline underline-offset-4"
          >
            {site.social.email}
          </a>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
