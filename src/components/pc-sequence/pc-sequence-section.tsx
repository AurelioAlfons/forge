"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MAX_DPR,
  PLAYBACK_FRAME_COUNT,
  SCROLL_LENGTH_VH,
  SCRUB,
  playbackFrameIndex,
} from "@/lib/pc-sequence/config";
import {
  DEMATERIALIZE_FRACTION,
  HEX_TWEEN_DURATION,
  MATERIALIZE_FRACTION,
  SPIN_FORWARD_PROGRESS,
} from "@/lib/skills/config";
import {
  RING1_COUNT,
  RING2_COUNT,
  computeOrbitGeometry,
  phaseShiftForIndex,
  ringAngleTurns,
  type OrbitGeometry,
} from "@/lib/skills/orbit";
import { SKILL_COUNT, skills } from "@/lib/skills/skills-data";
import { useIntro } from "@/components/intro/use-intro";
import { SkillsOrbit } from "@/components/skills/skills-orbit";
import { ScrollStory } from "@/components/typography/scroll-story";
import { storyBeats } from "@/lib/typography/story-data";
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
import { usePerformanceSettings } from "@/components/responsive/use-performance-profile";
import { scrollLengthForProfile } from "@/lib/responsive/performance-profile";
import { useFrameSequence } from "./use-frame-sequence";
import { ProfileOverlay } from "./profile-overlay";
import { PcPoster } from "./pc-poster";
import { StaticChapters } from "./static-chapters";

gsap.registerPlugin(ScrollTrigger);

// how much the rendered fan visually shrinks during the skills orbit, on
// top of the orbit geometry's own smaller fan-clearance radius — an actual
// zoom out on the canvas, not just more room for the rings around it. each
// cut has been relative to the last: 0.65 -> 0.52 -> 0.416 -> 0.3744 (10% off)
const FAN_SHRINK_SCALE = 0.3744;

export function PcSequenceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readoutValueRef = useRef<HTMLSpanElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // scroll progress lives in a ref so scrubbing doesn't re-render the section
  const progressRef = useRef(0);
  const carouselRef = useRef<CarouselHandle | null>(null);
  const drawnIndexRef = useRef(-1);
  const posterRef = useRef<HTMLImageElement>(null);

  const { markEnhanced } = useIntro();
  const settings = usePerformanceSettings();
  const {
    staticContent,
    reducedMotion,
    orbitMotion,
    profile: performanceProfile,
  } = settings;
  const loader = useFrameSequence(posterRef);
  const scrollLengthVh = scrollLengthForProfile(
    SCROLL_LENGTH_VH,
    performanceProfile,
  );

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const section = sectionRef.current;
    const poster = posterRef.current;
    if (!canvas || !stage || !section || staticContent) {
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
    const pageTimelineNav = document.querySelector<HTMLElement>(
      "[data-page-timeline]",
    );

    const ctx = canvas.getContext("2d");
    const loading = loadingRef.current;
    let canvasLost = false;
    function showPreview(message = "Loading PC animation…") {
      canvas!.style.opacity = "0";
      if (poster) {
        poster.style.opacity = "1";
        poster.style.zIndex = "25";
      }
      stage!.dataset.pcReady = "false";
      if (loading) {
        loading.hidden = false;
        if (loading.textContent !== message) loading.textContent = message;
      }
    }
    function onContextLost(event: Event) {
      event.preventDefault();
      canvasLost = true;
      showPreview("Restoring PC animation…");
    }
    function onContextRestored() {
      canvasLost = false;
      drawnIndexRef.current = -1;
      resize();
    }
    canvas.addEventListener("contextlost", onContextLost);
    canvas.addEventListener("contextrestored", onContextRestored);
    showPreview();
    const loadingTimeout = window.setTimeout(() => {
      if (stage!.dataset.pcReady !== "true")
        showPreview("PC preview · animation still loading");
    }, 8000);

    const triggers: ScrollTrigger[] = [];
    let introTween: gsap.core.Tween | null = null;
    let socialTween: gsap.core.Tween | null = null;
    let navEntranceTween: gsap.core.Tween | null = null;
    // fires once per crossing into the window, not every frame inside it —
    // re-arms once you've scrolled back out past the start again
    let navEntranceArmed = true;
    let rafId = 0;
    let refreshRafId = 0;

    // ===== TYPOGRAPHY STORY =====
    // one silent 0..1 clock keeps these absolute positions tied to the pc's
    // own progress. each phrase crosses the stage toward its authored spot:
    // lower phrases travel down, upper phrases travel up.
    const storyClock = { value: 0 };
    const storyTimeline = gsap.timeline({ paused: true });
    storyTimeline.to(storyClock, { value: 1, duration: 1, ease: "none" }, 0);

    if (!reducedMotion) {
      for (const beat of storyBeats) {
        const statement = stage.querySelector<HTMLElement>(
          `[data-story-statement="${beat.id}"]`,
        );
        if (!statement) continue;

        const targetIsLower = () =>
          statement.offsetTop + statement.offsetHeight / 2 >=
          stage.clientHeight / 2;
        const aboveViewport = () =>
          -(statement.offsetTop + statement.offsetHeight + 24);
        const belowViewport = () =>
          stage.clientHeight - statement.offsetTop + 24;
        const enterFromOppositeEdge = () =>
          targetIsLower() ? aboveViewport() : belowViewport();
        const exitPastNearestEdge = () =>
          targetIsLower() ? belowViewport() : aboveViewport();
        const enterSpan = beat.enterEnd - beat.start;
        const exitSpan = beat.end - beat.exitStart;

        storyTimeline.fromTo(
          statement,
          {
            y: enterFromOppositeEdge,
            autoAlpha: 0,
          },
          {
            y: 0,
            autoAlpha: 1,
            duration: enterSpan,
            ease: "power3.out",
          },
          beat.start,
        );

        storyTimeline.to(
          statement,
          {
            y: exitPastNearestEdge,
            autoAlpha: 0,
            duration: exitSpan,
            ease: "none",
          },
          beat.exitStart,
        );
      }
    }

    const storyStatements = stage.querySelectorAll<HTMLElement>(
      "[data-story-statement]",
    );
    let lastStoryProgress = -1;

    // ===== SKILLS ORBIT =====
    // one paused timeline scrubbed by the frame loop below. a second
    // scrolltrigger here would just fight the pin over the same gesture.
    // three acts on one 0..1 timeline: icons materialize one by one, hold
    // complete, then dematerialize in the same order. by the time the fan
    // starts pulling back out there's nothing left on screen. position is a
    // separate concern entirely — the icon's own translate, written every
    // tick below, not part of this timeline at all.
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

    // phase per icon is just its place in its own ring — simpler than
    // hand-picking a shift per skill, and re-ringing one later needs no re-tuning
    type SkillOrbitEntry = { el: HTMLElement; ring: 1 | 2; phaseShift: number };
    const skillOrbitEntries: SkillOrbitEntry[] = [];
    let ring1Index = 0;
    let ring2Index = 0;

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

      const orbitEl = stage.querySelector<HTMLElement>(
        `[data-skill-orbit="${skill.id}"]`,
      );
      if (orbitEl) {
        const indexInRing = skill.ring === 1 ? ring1Index++ : ring2Index++;
        const ringCount = skill.ring === 1 ? RING1_COUNT : RING2_COUNT;
        skillOrbitEntries.push({
          el: orbitEl,
          ring: skill.ring,
          phaseShift: phaseShiftForIndex(indexInRing, ringCount),
        });
      }
    }

    // the two ring outlines fade with the icon cluster as a whole, not
    // per-icon staggered like the tiles above — one shared visual element,
    // so it gets one fade in and one fade out instead of 17 of them
    const ringGlows = stage.querySelectorAll<HTMLElement>("[data-skill-ring]");
    if (ringGlows.length) {
      skillsTimeline.fromTo(
        ringGlows,
        { opacity: 0 },
        { opacity: 1, duration: MATERIALIZE_FRACTION, ease: "power1.out" },
        0,
      );
      skillsTimeline.to(
        ringGlows,
        { opacity: 0, duration: DEMATERIALIZE_FRACTION, ease: "power1.in" },
        dematerializeStart,
      );
    }

    // Temporary restrained reveal until Aurelio supplies the final text-motion
    // reference. It shares the exact Skills window, so reversing scroll also
    // reverses the title without a separate ScrollTrigger.
    const skillsTitle = stage.querySelector<HTMLElement>("[data-skills-title]");
    if (skillsTitle) {
      skillsTimeline.fromTo(
        skillsTitle,
        { opacity: 0, x: -32 },
        {
          opacity: 1,
          x: 0,
          duration: MATERIALIZE_FRACTION,
          ease: "power2.out",
        },
        0,
      );
      skillsTimeline.to(
        skillsTitle,
        {
          opacity: 0,
          x: -32,
          duration: DEMATERIALIZE_FRACTION,
          ease: "power2.in",
        },
        dematerializeStart,
      );
    }

    // an actual visual zoom-out on the rendered fan itself, not just more
    // clearance in the ring maths — shrinks in step with the icons
    // materializing, holds small through the orbit, grows back to full
    // size as they dematerialize, same timeline everything else here rides.
    // sine.inOut on both ends (gentler than the power2 curve before it) so
    // it reads as one continuous, controlled glide rather than a snap in
    // either direction
    skillsTimeline.fromTo(
      canvas,
      { scale: 1 },
      {
        scale: FAN_SHRINK_SCALE,
        duration: MATERIALIZE_FRACTION,
        ease: "sine.inOut",
      },
      0,
    );
    skillsTimeline.to(
      canvas,
      { scale: 1, duration: DEMATERIALIZE_FRACTION, ease: "sine.inOut" },
      dematerializeStart,
    );

    // mapRange happily extrapolates past its bounds, so the clamp is load-bearing
    const toSkillProgress = gsap.utils.mapRange(
      SPIN_FORWARD_PROGRESS.start,
      SPIN_FORWARD_PROGRESS.end,
      0,
      1,
    );
    const clampUnit = gsap.utils.clamp(0, 1);
    let lastSkillProgress = -1;
    let orbitGeometry: OrbitGeometry = {
      icon: 0,
      iconVisual: 0,
      fanRadius: 0,
      ring1Radius: 0,
      ring2Radius: 0,
    };
    // rotation runs on its own clock, independent of scroll — reveal
    // (materialize/hold/dematerialize above) still rides skillProgress,
    // only the spin itself doesn't
    const spinStartedAt = performance.now();

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
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      showPreview();

      // the rings are sized off the fan as it actually lands on screen, so
      // the orbit reads as tiled onto the disc, not stretched over the page
      orbitGeometry = computeOrbitGeometry(w, h);
      // visual size, not the spacing size — ring radii below still use
      // orbitGeometry.icon so bumping this doesn't silently move the rings
      stage!.style.setProperty(
        "--skill-icon-s",
        `${orbitGeometry.iconVisual}px`,
      );
      stage!.style.setProperty("--skill-fan-r", `${orbitGeometry.fanRadius}px`);
      stage!.style.setProperty(
        "--skill-ring1-r",
        `${orbitGeometry.ring1Radius}px`,
      );
      stage!.style.setProperty(
        "--skill-ring2-r",
        `${orbitGeometry.ring2Radius}px`,
      );

      // offscreen story distances depend on the live stage and text size.
      storyTimeline.invalidate();
      lastStoryProgress = -1;
      drawnIndexRef.current = -1; // force a redraw at the new size
    }

    // ===== DRAW =====
    // contain-fit and centred, same scale as before the background cleanup
    function draw(index: number) {
      const decoded = loader?.nearest(index)?.frame;
      if (!decoded || !ctx || canvasLost || ctx.isContextLost()) {
        showPreview();
        return;
      }
      const img = decoded.image;

      const w = stage!.clientWidth;
      const h = stage!.clientHeight;
      const scale = Math.min(w / decoded.width, h / decoded.height);
      const dw = decoded.width * scale;
      const dh = decoded.height * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;

      try {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, dx, dy, dw, dh);
      } catch {
        // a rejected bitmap must never strand the page behind an empty canvas.
        showPreview("PC preview · retrying animation");
        drawnIndexRef.current = -1;
        return;
      }

      // a new loader revision redraws a fallback when a closer frame arrives.
      drawnIndexRef.current = index;
      canvas!.style.opacity = "1";
      if (posterRef.current) {
        posterRef.current.style.opacity = "0";
        posterRef.current.style.removeProperty("z-index");
      }
      stage!.dataset.pcReady = "true";
      if (loading) loading.hidden = true;
    }

    // ===== FRAME LOOP =====
    // explode, rebuild, zoom in, then rewind the zoom back home
    let loadedRevision = -1;
    let requestedIndex = -1;
    function tick() {
      rafId = requestAnimationFrame(tick);
      const lastStep = PLAYBACK_FRAME_COUNT - 1;
      const step = Math.min(
        lastStep,
        Math.max(0, Math.round(progressRef.current * lastStep)),
      );
      const index = playbackFrameIndex(step);

      if (index !== requestedIndex) {
        loader?.request(index);
        requestedIndex = index;
      }
      if (
        index !== drawnIndexRef.current ||
        loadedRevision !== loader?.revision ||
        canvasLost ||
        ctx?.isContextLost()
      ) {
        draw(index);
        loadedRevision = loader?.revision ?? -1;
      }

      // the readout follows the real playback step.
      if (readoutValueRef.current) {
        readoutValueRef.current.textContent = `${String(step).padStart(4, "0")} / ${lastStep}`;
      }

      // the hexes ride the fan spin off the same progress value, just a
      // different slice of it
      if (!reducedMotion) {
        if (progressRef.current !== lastStoryProgress) {
          storyTimeline.progress(progressRef.current);
          lastStoryProgress = progressRef.current;
        }

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
            projectsBloom.hidden = envelope <= 0;
            projectsBloom.style.opacity = envelope.toFixed(3);
            projectsBloom.style.visibility =
              envelope > 0 ? "visible" : "hidden";
            projectsBloom.style.setProperty(
              "--projects-bloom-spread",
              `${bloomSpreadPercent(envelope).toFixed(1)}%`,
            );
          }

          // lands fully opaque exactly as the bloom finishes, so there's no
          // seam to see, they're the same white by then
          if (projectsPanel) {
            projectsPanel.hidden = envelope <= 0;
            projectsPanel.style.opacity = envelope.toFixed(3);
            projectsPanel.style.visibility =
              envelope > 0 ? "visible" : "hidden";
            projectsPanel.inert = envelope <= 0.02;
            const active = String(envelope > 0.02);
            if (projectsPanel.dataset.active !== active)
              projectsPanel.dataset.active = active;
          }

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

        // position is separate from the timeline above — an icon's ring
        // radius plus its own turning angle, written straight to its own
        // translate so gsap's opacity/scale tween on the child never fights
        // it. runs every frame, not just when scroll moves — the spin is on
        // its own clock now
        const elapsedSeconds = orbitMotion
          ? (performance.now() - spinStartedAt) / 1000
          : 0;
        for (const entry of skillOrbitEntries) {
          const radius =
            entry.ring === 1
              ? orbitGeometry.ring1Radius
              : orbitGeometry.ring2Radius;
          const turns = ringAngleTurns(
            entry.ring,
            elapsedSeconds,
            entry.phaseShift,
          );
          const angle = turns * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          entry.el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
        }
      }
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
      // no orbit at all here. frozen icons over a static pc would just be
      // a sticker, and the sr-only list already covers this case
    } else {
      // only pinned once the lock is off, otherwise the page measures short
      triggers.push(
        ScrollTrigger.create({
          trigger: section!,
          start: "top top",
          end: () => `+=${window.innerHeight * scrollLengthVh}`,
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

    {
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
      window.clearTimeout(loadingTimeout);
      canvas.removeEventListener("contextlost", onContextLost);
      canvas.removeEventListener("contextrestored", onContextRestored);
      window.removeEventListener("resize", resize);
      // only our own triggers — getAll() would kill anything else on the page
      for (const t of triggers) t.kill();

      // put the tiles back to the resting state react renders them at, rather
      // than clearProps, which would strip the inline opacity and flash them on
      skillsTimeline.kill();
      storyTimeline.kill();
      if (storyStatements.length && !reducedMotion) {
        gsap.set(storyStatements, {
          opacity: 0,
          clearProps: "transform,visibility",
        });
      }
      if (skillTiles.length) gsap.set(skillTiles, { opacity: 0, scale: 0.6 });
      if (ringGlows.length) gsap.set(ringGlows, { opacity: 0 });
      if (skillsTitle) gsap.set(skillsTitle, { opacity: 0, x: -32 });
      if (projectsPanel) {
        projectsPanel.style.opacity = "0";
        projectsPanel.style.visibility = "hidden";
        projectsPanel.hidden = true;
      }
      if (projectsBloom) {
        projectsBloom.style.opacity = "0";
        projectsBloom.style.visibility = "hidden";
        projectsBloom.hidden = true;
        projectsBloom.style.removeProperty("--projects-bloom-spread");
      }
      // otherwise a remount could come back already dimmed or still shrunk
      canvas.style.filter = "";
      canvas.style.opacity = "0";
      if (poster) {
        poster.style.opacity = "1";
        poster.style.removeProperty("z-index");
      }
      gsap.set(canvas, { clearProps: "transform" });

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
  }, [loader, staticContent, reducedMotion, orbitMotion, scrollLengthVh]);

  return (
    <>
      <span id="home" />
      <section
        ref={sectionRef}
        id="pc-sequence"
        data-pinned-sequence={!staticContent}
        style={{
          height: staticContent ? "100svh" : `${(scrollLengthVh + 1) * 100}svh`,
        }}
      >
        <div
          ref={stageRef}
          data-pc-ready="false"
          className="bg-bg relative h-svh w-full overflow-hidden"
        >
          {/* no filter, no background, no shadow on this one — any of them would
            draw the rectangle the whole cutout exists to avoid */}
          <PcPoster imageRef={posterRef} onReady={markEnhanced} />
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
            data-pc-canvas
          />

          {!staticContent && <ScrollStory reducedMotion={reducedMotion} />}

          {!staticContent && (
            <SkillsOrbit reducedMotion={reducedMotion} compact={false} />
          )}

          {!staticContent && <ProjectsInterlude carouselRef={carouselRef} />}

          <ProfileOverlay />

          {!staticContent && (
            <div
              ref={loadingRef}
              role="status"
              aria-live="polite"
              className="absolute right-6 bottom-6 z-30 rounded border border-white/20 bg-black/85 px-4 py-3 font-mono text-xs text-white"
            >
              Loading PC animation…
            </div>
          )}

          {!staticContent && (
            <DecorReadout
              label="Frame"
              value={`0000 / ${PLAYBACK_FRAME_COUNT - 1}`}
              valueRef={readoutValueRef}
              tone="on-dark"
              corner="top-right"
            />
          )}
        </div>
      </section>
      {staticContent && <StaticChapters />}
    </>
  );
}
