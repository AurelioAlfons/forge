"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { animate, splitText, stagger } from "animejs";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/lib/site";
import { useMediaQuery } from "@/components/pc-sequence/use-media-query";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const GOLD = "#dfa812";

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const formTextRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // both panels sit side by side now, so one shared fade-up reads better
  // than the old stacked stagger did — same scrub idiom the pc intro rides
  useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    if (!section || !grid || reducedMotion) return;

    gsap.set(grid, { opacity: 0, y: 32 });
    const tween = gsap.to(grid, {
      opacity: 1,
      y: 0,
      ease: "none",
      paused: true,
    });

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 85%",
      end: "top 50%",
      animation: tween,
      scrub: 0.3,
      invalidateOnRefresh: true,
    });

    return () => {
      trigger.kill();
      tween.kill();
      gsap.set(grid, { clearProps: "opacity,transform" });
    };
  }, [reducedMotion]);

  // the contact heading + subtitle keep sliding words in and out on their
  // own clock, one word after another — no trigger, just idles forever
  useEffect(() => {
    const wrap = formTextRef.current;
    if (!wrap || reducedMotion) return;

    // one splitter per element — feeding both the heading and the
    // paragraph in as a single NodeList only ever split the first one
    const targets = wrap.querySelectorAll("[data-split-text]");
    const splitters = Array.from(targets, (target) =>
      splitText(target, { words: { wrap: "clip" } }),
    );
    const words = splitters.flatMap((splitter) => splitter.words);

    const animation = animate(words, {
      y: [{ to: ["100%", "0%"] }, { to: "-100%", delay: 750, ease: "in(3)" }],
      duration: 750,
      ease: "out(3)",
      delay: stagger(100),
      loop: true,
    });

    return () => {
      animation.pause();
      for (const splitter of splitters) splitter.revert();
    };
  }, [reducedMotion]);

  // no backend to post to yet, so submit just hands off to whatever mail
  // app is already set up on the visitor's machine, pre-filled
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = `From: ${email}\n\n${message}`;
    const params = new URLSearchParams({ subject, body });
    window.location.href = `mailto:${site.social.email}?${params.toString()}`;
  }

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="container-page py-2xl relative isolate"
    >
      {/* Fill the deliberate content gap above Contact with black as well, so
          once this chapter enters the viewport no strip of Experience white
          remains visible. The layout gap itself is still preserved. */}
      <div
        aria-hidden="true"
        className="absolute -top-[clamp(12rem,24vh,20rem)] right-1/2 bottom-0 left-1/2 -z-10 -mx-[50vw] w-screen bg-black"
      />

      <div ref={gridRef} className="gap-m grid lg:grid-cols-2">
        <div className="border-border p-l rounded-2xl border bg-white/[0.03]">
          <div ref={formTextRef}>
            <h2
              data-split-text
              className="text-step-3 font-bold tracking-tight"
            >
              Contact
            </h2>
            <p data-split-text className="text-muted mt-2xs">
              Have a question or a project in mind? Feel free to reach out.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-l gap-s grid">
            <input
              aria-label="Your email"
              name="email"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="placeholder:text-muted px-s py-2xs rounded-md border border-white/10 bg-white/5"
            />
            <input
              aria-label="Subject"
              name="subject"
              type="text"
              placeholder="Subject"
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="placeholder:text-muted px-s py-2xs rounded-md border border-white/10 bg-white/5"
            />
            <textarea
              aria-label="Message"
              name="message"
              placeholder="Message"
              required
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="placeholder:text-muted px-s py-2xs rounded-md border border-white/10 bg-white/5"
            />

            <button
              type="submit"
              className="mt-2xs py-2xs w-full rounded-md bg-white/10 font-medium transition-colors hover:bg-white/15"
            >
              Submit
            </button>
          </form>
        </div>

        {/* same gold-glow language as the skill hex tiles and the social
            hover, just as a soft radial glow behind the icon instead of a
            border/shadow — this card's whole point is that glow */}
        <div className="border-border p-l flex flex-col rounded-2xl border bg-white/[0.03]">
          <p className="text-step--1 text-muted font-mono tracking-[0.3em] uppercase">
            Resume
          </p>

          <div className="my-l grid place-items-center">
            <div className="border-border gap-s p-xl flex w-fit flex-col items-center rounded-2xl border">
              <div className="relative grid place-items-center">
                <div
                  aria-hidden="true"
                  className="absolute size-24 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`,
                    filter: "blur(20px)",
                    opacity: 0.6,
                  }}
                />
                <FileText
                  aria-hidden="true"
                  className="relative size-12"
                  style={{ color: GOLD }}
                />
              </div>
              <p className="max-w-40 truncate font-mono text-sm font-semibold">
                {site.resume.filename}
              </p>
            </div>
          </div>

          <p className="text-muted">
            Grab a copy of my resume for the full rundown of my experience and
            skills.
          </p>

          <div className="mt-l gap-s flex">
            <a
              href={site.resume.href}
              target="_blank"
              rel="noreferrer"
              className="border-border gap-2xs px-l py-2xs flex flex-1 items-center justify-center rounded-full border font-medium transition-colors hover:bg-white/5"
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              View
            </a>

            {/* stays a real link with a download attribute, not a click
                handler — that's what makes it a save instead of a
                navigation */}
            <a
              href={site.resume.href}
              download={site.resume.filename}
              className="gap-2xs px-l py-2xs flex flex-1 items-center justify-center rounded-full bg-white font-medium text-black transition-opacity hover:opacity-90"
            >
              <Download aria-hidden="true" className="size-4" />
              Download
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
