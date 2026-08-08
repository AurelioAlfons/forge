"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MAX_DPR,
  PLAYBACK_FRAME_COUNT,
  REVEAL,
  SCROLL_LENGTH_VH,
  SCRUB,
  playbackFrameIndex,
} from "@/lib/pc-sequence/config";
import {
  DEMATERIALIZE_FRACTION,
  HEX_TWEEN_DURATION,
  MATERIALIZE_FRACTION,
  SPIN_FORWARD_PROGRESS,
  computeHoneycombGeometry,
} from "@/lib/skills/config";
import { SKILL_COUNT, skills } from "@/lib/skills/skills-data";
import { useIntro, useIntroHoldProgress } from "@/components/intro/use-intro";
import { SkillsOverlay } from "@/components/skills/skills-overlay";
import { ProjectsInterlude } from "@/components/projects/projects-interlude";
import {
  PROJECTS_PROGRESS,
  bloomSpreadPercent,
  canvasDimFilter,
  carouselProgress,
  transitionEnvelope,
} from "@/lib/projects/config";
import type { CarouselHandle } from "@/components/projects/projects-carousel";
import { DecorReadout } from "@/components/decor/decor-readout";
import { useFrameSequence } from "./use-frame-sequence";
import { ProfileOverlay } from "./profile-overlay";
import { BootLoader } from "./boot-loader";

gsap.registerPlugin(ScrollTrigger);

export function PcSequenceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readoutValueRef = useRef<HTMLSpanElement>(null);

  // scroll progress lives in a ref so scrubbing doesn't re-render the section
  const progressRef = useRef(0);
  const carouselRef = useRef<CarouselHandle | null>(null);
  const drawnIndexRef = useRef(-1);

  const { phase, reducedMotion, markFirstFrameReady, markRevealComplete } =
    useIntro();
  const holdProgress = useIntroHoldProgress();
  const { frames, ready } = useFrameSequence();

  // frame 01 is drawable => the fan has done its job, let the reveal start
  useEffect(() => {
    if (ready) markFirstFrameReady();
  }, [markFirstFrameReady, ready]);

  // ===== INTRO REVEAL =====
  // deliberately knows nothing about frame loading. if the cap fired because a
  // download stalled, the reveal still has to play — that cap is the whole
  // reason nobody gets stuck on a black screen.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage || phase !== "revealing" || reducedMotion) return;

    const profileIntro = stage.querySelector<HTMLElement>(
      "[data-profile-intro]",
    );
    const socialLinks = stage.querySelector<HTMLElement>("[data-social-links]");
    // the player and the timeline are siblings of this section, not children
    const musicPlayer = document.querySelector<HTMLElement>(
      "[data-music-player]",
    );
    const pageTimeline = document.querySelector<HTMLElement>(
      "[data-page-timeline]",
    );

    // everything shows up together, staggered, while frames keep streaming in
    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: markRevealComplete,
    });

    timeline.fromTo(
      canvas,
      { opacity: 0, scale: 0.965 },
      { opacity: 1, scale: 1, duration: REVEAL.canvas.duration },
      REVEAL.canvas.at,
    );

    if (musicPlayer) {
      timeline.fromTo(
        musicPlayer,
        { yPercent: -130, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: REVEAL.musicPlayer.duration },
        REVEAL.musicPlayer.at,
      );
    }
    if (profileIntro) {
      timeline.fromTo(
        profileIntro,
        { y: -48, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: REVEAL.profileIntro.duration },
        REVEAL.profileIntro.at,
      );
    }
    if (socialLinks) {
      timeline.fromTo(
        socialLinks,
        { x: 140, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: REVEAL.socialLinks.duration },
        REVEAL.socialLinks.at,
      );
    }
    if (pageTimeline) {
      timeline.fromTo(
        pageTimeline,
        { x: -24, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: REVEAL.pageTimeline.duration },
        REVEAL.pageTimeline.at,
      );
    }

    return () => {
      timeline.kill();
      for (const el of [
        canvas,
        musicPlayer,
        profileIntro,
        socialLinks,
        pageTimeline,
      ]) {
        if (el) gsap.set(el, { clearProps: "transform,opacity,visibility" });
      }
    };
  }, [markRevealComplete, phase, reducedMotion]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const section = sectionRef.current;
    if (!canvas || !stage || !section || phase === "booting") {
      return;
    }

    const profileIntro = stage.querySelector<HTMLElement>(
      "[data-profile-intro]",
    );
    const socialLinks = stage.querySelector<HTMLElement>("[data-social-links]");
    const projectsPanel = stage.querySelector<HTMLElement>(
      "[data-projects-interlude]",
    );
    const projectsBloom = stage.querySelector<HTMLElement>(
      "[data-projects-bloom]",
    );
    // sibling of this section, same as the boot reveal's own lookup above
    const pageTimelineNav = document.querySelector<HTMLElement>(
      "[data-page-timeline]",
    );

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const triggers: ScrollTrigger[] = [];
    let introTween: gsap.core.Tween | null = null;
    let socialTween: gsap.core.Tween | null = null;
    let navEntranceTween: gsap.core.Tween | null = null;
    // fires once per crossing into the window, not every frame inside it —
    // re-arms once you've scrolled back out past the start again
    let navEntranceArmed = true;
    let rafId = 0;
    let refreshRafId = 0;

    // ===== SKILLS HONEYCOMB =====
    // one paused timeline scrubbed by the frame loop below. a second
    // scrolltrigger here would just fight the pin over the same gesture.
    // three acts on one 0..1 timeline: tiles materialize one by one, hold
    // complete, then dematerialize in the same order. by the time the fan
    // starts pulling back out there's nothing left on screen.
    const skillTiles: HTMLElement[] = [];
    const skillsTimeline = gsap.timeline({ paused: true });
    const lastIndex = SKILL_COUNT - 1;
    // spread offsets so the final tween in each act lands on its boundary
    const materializeStep =
      lastIndex > 0
        ? (MATERIALIZE_FRACTION - HEX_TWEEN_DURATION) / lastIndex
        : 0;
    const dematerializeStart = 1 - DEMATERIALIZE_FRACTION;
    const dematerializeStep =
      lastIndex > 0
        ? (DEMATERIALIZE_FRACTION - HEX_TWEEN_DURATION) / lastIndex
        : 0;

    for (const skill of skills) {
      const tile = stage.querySelector<HTMLElement>(
        `[data-skill-hex="${skill.id}"]`,
      );
      if (!tile) continue;

      skillTiles.push(tile);
      const i = skill.order - 1;

      skillsTimeline.fromTo(
        tile,
        { opacity: 0, scale: 0.6 },
        {
          opacity: 1,
          scale: 1,
          duration: HEX_TWEEN_DURATION,
          ease: "back.out(1.7)",
        },
        i * materializeStep,
      );
      skillsTimeline.to(
        tile,
        {
          opacity: 0,
          scale: 0.6,
          duration: HEX_TWEEN_DURATION,
          ease: "back.in(1.4)",
        },
        dematerializeStart + i * dematerializeStep,
      );
    }

    // mapRange happily extrapolates past its bounds, so the clamp is load-bearing
    const toSkillProgress = gsap.utils.mapRange(
      SPIN_FORWARD_PROGRESS.start,
      SPIN_FORWARD_PROGRESS.end,
      0,
      1,
    );
    const clampUnit = gsap.utils.clamp(0, 1);
    let lastSkillProgress = -1;

    // ===== PROJECTS INTERLUDE =====
    // The PC stays on its final exploded frame while this panel rises, rests,
    // and clears upward. Reverse assembly only begins after the panel is gone.
    const toProjectsProgress = gsap.utils.mapRange(
      PROJECTS_PROGRESS.start,
      PROJECTS_PROGRESS.end,
      0,
      1,
    );
    let lastProjectsProgress = -1;

    // ===== SIZING =====
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = stage!.clientWidth;
      const h = stage!.clientHeight;

      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // the honeycomb is sized off the fan as it actually lands on screen, so
      // the cluster reads as tiled onto the disc, not stretched over the page
      const comb = computeHoneycombGeometry(w, h);
      stage!.style.setProperty("--skill-hex-s", `${comb.hex}px`);
      stage!.style.setProperty("--skill-fan-r", `${comb.fanRadius}px`);
      stage!.style.setProperty("--skill-gap", `${comb.gap}px`);

      drawnIndexRef.current = -1; // force a redraw at the new size
    }

    // ===== DRAW =====
    // contain-fit and centred, same scale as before the background cleanup
    function draw(index: number) {
      let drawableIndex = index;
      let img = frames[drawableIndex];

      // Fast scrolling can outrun the background preload. Keep the closest
      // available image visible and retry the requested frame on the next tick.
      if (!img?.naturalWidth) {
        for (let distance = 1; distance < frames.length; distance += 1) {
          const before = frames[index - distance];
          const after = frames[index + distance];
          if (before?.naturalWidth) {
            drawableIndex = index - distance;
            img = before;
            break;
          }
          if (after?.naturalWidth) {
            drawableIndex = index + distance;
            img = after;
            break;
          }
        }
      }

      if (!img || !img.naturalWidth) return;

      const w = stage!.clientWidth;
      const h = stage!.clientHeight;
      const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;

      ctx!.clearRect(0, 0, w, h);
      ctx!.drawImage(img, dx, dy, dw, dh);

      // Preserve the requested index when we used a fallback so tick() keeps
      // checking until the exact frame becomes available.
      drawnIndexRef.current = drawableIndex === index ? index : -1;
    }

    // ===== FRAME LOOP =====
    // explode, rebuild, zoom in, then rewind the zoom back home
    function tick() {
      const lastStep = PLAYBACK_FRAME_COUNT - 1;
      const step = Math.min(
        lastStep,
        Math.max(0, Math.round(progressRef.current * lastStep)),
      );
      const index = playbackFrameIndex(step);

      if (index !== drawnIndexRef.current) draw(index);

      // real playback position, not an invented number — same idea as the
      // loader's actual load percentage
      if (readoutValueRef.current) {
        readoutValueRef.current.textContent = `${String(step).padStart(4, "0")} / ${lastStep}`;
      }

      // the hexes ride the fan spin off the same progress value, just a
      // different slice of it
      if (!reducedMotion) {
        const projectsProgress = clampUnit(
          toProjectsProgress(progressRef.current),
        );

        // the nav ruler gets its own small arrival beat right as you cross
        // into the projects window — same idea as the cards sliding in, just
        // for an element that has to stay usable everywhere else on the
        // page, so it's a one-shot tween on the crossing rather than
        // something continuously bound to the envelope
        if (projectsProgress > 0 && navEntranceArmed) {
          navEntranceArmed = false;
          if (pageTimelineNav) {
            navEntranceTween?.kill();
            navEntranceTween = gsap.fromTo(
              pageTimelineNav,
              { x: 56, autoAlpha: 0.15 },
              {
                x: 0,
                autoAlpha: 1,
                duration: 0.6,
                ease: "power3.out",
                onComplete: () => {
                  gsap.set(pageTimelineNav, {
                    clearProps: "transform,opacity,visibility",
                  });
                },
              },
            );
          }
        } else if (projectsProgress === 0) {
          navEntranceArmed = true;
        }

        if (projectsProgress !== lastProjectsProgress) {
          // one envelope drives all three, so the light, the panel and the dim
          // can't drift out of step with each other
          const envelope = transitionEnvelope(projectsProgress);

          if (projectsBloom) {
            projectsBloom.style.opacity = envelope.toFixed(3);
            projectsBloom.style.setProperty(
              "--projects-bloom-spread",
              `${bloomSpreadPercent(envelope).toFixed(1)}%`,
            );
          }

          // lands fully opaque exactly as the bloom finishes, so there's no
          // seam to see, they're the same white by then
          if (projectsPanel) projectsPanel.style.opacity = envelope.toFixed(3);

          // anime.js gets seeked from this loop like everything else, rather
          // than running its own listener next to gsap's. same envelope that
          // drives the panel's own opacity gates whether the cards can be
          // clicked at all — opacity alone doesn't stop a click.
          carouselRef.current?.setProgress(
            carouselProgress(projectsProgress),
            envelope > 0.02,
          );

          // the pc settles as the light takes over, rather than being cut off
          canvas!.style.filter = canvasDimFilter(envelope);
          lastProjectsProgress = projectsProgress;
        }

        const skillProgress = clampUnit(toSkillProgress(progressRef.current));
        if (skillProgress !== lastSkillProgress) {
          skillsTimeline.progress(skillProgress);
          lastSkillProgress = skillProgress;
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);

    function installScrollMotion() {
      if (reducedMotion) return;

      if (profileIntro) {
        // the intro follows the scroll in both directions, so coming home
        // restores the exact authored position instead of replaying a reveal
        introTween = gsap.to(profileIntro, {
          yPercent: -220,
          autoAlpha: 0,
          ease: "none",
          paused: true,
        });

        triggers.push(
          ScrollTrigger.create({
            trigger: section!,
            start: "top top",
            end: () => `+=${window.innerHeight * 0.8}`,
            animation: introTween,
            scrub: SCRUB,
            invalidateOnRefresh: true,
          }),
        );
      }

      if (socialLinks) {
        socialTween = gsap.to(socialLinks, {
          x: () => window.innerWidth,
          autoAlpha: 0,
          ease: "none",
          paused: true,
        });

        triggers.push(
          ScrollTrigger.create({
            trigger: section!,
            start: "top top",
            end: () => `+=${window.innerHeight * 0.8}`,
            animation: socialTween,
            scrub: SCRUB,
            invalidateOnRefresh: true,
          }),
        );
      }
    }

    // ===== SCROLL =====
    // reduced motion gets a single frame and no pin
    if (reducedMotion) {
      progressRef.current = 0;
      draw(0);
      // no honeycomb at all here. frozen tiles over a static pc would just be
      // a sticker, and the sr-only list already covers this case
    } else if (phase === "ready") {
      // only pinned once the lock is off, otherwise the page measures short
      triggers.push(
        ScrollTrigger.create({
          trigger: section!,
          start: "top top",
          end: `+=${window.innerHeight * SCROLL_LENGTH_VH}`,
          pin: stage!,
          pinSpacing: false,
          scrub: SCRUB,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
        }),
      );
    }

    if (phase === "ready") {
      // the lock is already off by now, so give layout one frame to come back
      // before scrolltrigger caches any positions
      refreshRafId = requestAnimationFrame(() => {
        installScrollMotion();
        ScrollTrigger.refresh();
      });
    }

    // draw now, not next frame — resize() blanks the bitmap and this effect
    // re-runs when the phase flips, which was one black frame on the handoff
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(refreshRafId);
      window.removeEventListener("resize", resize);
      // only our own triggers — getAll() would kill anything else on the page
      for (const t of triggers) t.kill();

      // put the tiles back to the resting state react renders them at, rather
      // than clearProps, which would strip the inline opacity and flash them on
      skillsTimeline.kill();
      if (skillTiles.length) gsap.set(skillTiles, { opacity: 0, scale: 0.6 });
      if (projectsPanel) projectsPanel.style.opacity = "0";
      if (projectsBloom) {
        projectsBloom.style.opacity = "0";
        projectsBloom.style.removeProperty("--projects-bloom-spread");
      }
      // otherwise a remount could come back already dimmed
      canvas.style.filter = "";

      // only clear what this effect actually touched, so a late frame landing
      // mid-reveal can't wipe the other timeline's values
      if (introTween && profileIntro) {
        introTween.kill();
        gsap.set(profileIntro, { clearProps: "transform,opacity,visibility" });
      }
      if (socialTween && socialLinks) {
        socialTween.kill();
        gsap.set(socialLinks, { clearProps: "transform,opacity,visibility" });
      }
      if (navEntranceTween && pageTimelineNav) {
        navEntranceTween.kill();
        gsap.set(pageTimelineNav, {
          clearProps: "transform,opacity,visibility",
        });
      }
    };
  }, [frames, phase, reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="pc-sequence"
      style={{ height: `${(SCROLL_LENGTH_VH + 1) * 100}svh` }}
    >
      <div
        ref={stageRef}
        className="bg-bg relative h-svh w-full overflow-hidden"
      >
        {/* no filter, no background, no shadow on this one — any of them would
            draw the rectangle the whole cutout exists to avoid */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />

        <SkillsOverlay />

        <ProjectsInterlude carouselRef={carouselRef} />

        <ProfileOverlay phase={phase} />

        <DecorReadout
          label="Frame"
          value={`0000 / ${PLAYBACK_FRAME_COUNT - 1}`}
          valueRef={readoutValueRef}
          tone="on-dark"
          corner="top-right"
        />
      </div>

      {phase !== "ready" && (
        <BootLoader
          holdProgress={holdProgress}
          reducedMotion={reducedMotion}
          exiting={phase !== "booting"}
        />
      )}
    </section>
  );
}
