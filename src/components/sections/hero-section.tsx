import { site } from "@/lib/site";

export function HeroSection() {
  return (
    <section className="container-page py-3xl">
      <p className="text-accent text-step--1 font-mono tracking-widest uppercase">
        {site.role}
      </p>
      <h1 className="mt-xs text-step-5 max-w-[15ch] font-semibold tracking-tight">
        {site.name}
      </h1>
      <p className="mt-m max-w-measure text-step-1 text-muted">
        Placeholder hero copy. Everything on this page scales fluidly between a
        320px phone and a 1440px desktop — no breakpoint jumps.
      </p>
    </section>
  );
}
