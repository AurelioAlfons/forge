"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MAX_DPR,
  PLAYBACK_FRAME_COUNT,
  REDUCED_MOTION_QUERY,
  SCROLL_LENGTH_VH,
  SCRUB,
  playbackFrameIndex,
} from "@/lib/pc-sequence/config";
import { useFrameSequence } from "./use-frame-sequence";
import { useMediaQuery } from "./use-media-query";
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
  const [bootState, setBootState] = useState<"pending" | "reveal" | "ready">(
    "pending",
  );
  const [showBootLoader, setShowBootLoader] = useState(true);

  const reduced = useMediaQuery(REDUCED_MOTION_QUERY);
  const { frames, ready, progress } = useFrameSequence();

  useLayoutEffect(() => {
    if (sessionStorage.getItem("forge-boot-seen")) {
      queueMicrotask(() => {
        setShowBootLoader(false);
        setBootState("ready");
      });
    }
  }, []);

  const finishBoot = useCallback(() => {
    setShowBootLoader(false);
    setBootState(reduced ? "ready" : "reveal");
  }, [reduced]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const section = sectionRef.current;
    if (!canvas || !stage || !section || !ready || bootState === "pending") {
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
    let revealTimeline: gsap.core.Timeline | null = null;
    let rafId = 0;

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
      if (reduced) return;

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
    if (reduced) {
      progressRef.current = 0;
      draw(0);
    } else {
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

    if (bootState === "reveal" && !reduced) {
      revealTimeline = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          setBootState("ready");
          installScrollMotion();
          ScrollTrigger.refresh();
        },
      });
      if (profileIntro) {
        revealTimeline.fromTo(
          profileIntro,
          { yPercent: -115, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.9 },
          0,
        );
      }
      if (socialLinks) {
        revealTimeline.fromTo(
          socialLinks,
          { x: window.innerWidth, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.9 },
          0.12,
        );
      }
    } else {
      installScrollMotion();
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      // only our own triggers — getAll() would kill anything else on the page
      for (const t of triggers) t.kill();
      introTween?.kill();
      socialTween?.kill();
      revealTimeline?.kill();
      if (profileIntro) {
        gsap.set(profileIntro, {
          clearProps: "transform,opacity,visibility",
        });
      }
      if (socialLinks) {
        gsap.set(socialLinks, {
          clearProps: "transform,opacity,visibility",
        });
      }
    };
  }, [bootState, frames, ready, reduced]);

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

        <ProfileOverlay hidden={bootState === "pending"} />

        {!ready && (
          <div className="text-muted text-step--1 bottom-l absolute inset-x-0 text-center font-mono">
            {Math.round(progress * 100)}%
          </div>
        )}
      </div>

      {showBootLoader && (
        <BootLoader
          loadProgress={progress}
          reducedMotion={reduced}
          onComplete={finishBoot}
        />
      )}
    </section>
  );
}
