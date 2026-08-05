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
import { useIntro, useIntroHoldProgress } from "@/components/intro/use-intro";
import { useFrameSequence } from "./use-frame-sequence";
import { ProfileOverlay } from "./profile-overlay";
import { BootLoader } from "./boot-loader";

gsap.registerPlugin(ScrollTrigger);

export function PcSequenceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // scroll progress lives in a ref so scrubbing doesn't re-render the section
  const progressRef = useRef(0);
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

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const triggers: ScrollTrigger[] = [];
    let introTween: gsap.core.Tween | null = null;
    let socialTween: gsap.core.Tween | null = null;
    let rafId = 0;
    let refreshRafId = 0;

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
    };
  }, [frames, phase, reducedMotion]);

  return (
    <section
      ref={sectionRef}
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

        <ProfileOverlay phase={phase} />
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
