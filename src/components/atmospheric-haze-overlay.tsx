"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { startFluidSafely } from "@/lib/fluid/safe-fluid";
import { usePerformanceProfile } from "@/components/responsive/use-performance-profile";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, [role='slider'], [data-no-ripple], [data-boot-loader]";

export function AtmosphericHazeOverlay() {
  const hazeRef = useRef<HTMLDivElement>(null);
  const fluidRef = useRef<HTMLCanvasElement>(null);
  const profile = usePerformanceProfile();

  useEffect(() => {
    const canvas = fluidRef.current;
    if (!canvas) return;

    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    let teardown: ((releaseContext?: boolean) => void) | null = null;
    let requestId = 0;

    function sync() {
      const currentRequest = ++requestId;
      teardown?.(false);
      teardown = null;
      const blocked = motionQuery.matches || profile !== "desktop";
      canvas!.hidden = true;
      if (blocked) return;

      void startFluidSafely(canvas!, {
        palette: [
          { h: 0, s: 0, v: 0.75 },
          { h: 0, s: 0, v: 0.75 },
          { h: 0, s: 0, v: 0.48 },
        ],
        transparent: true,
        initialSplats: 0,
        idleSplats: false,
        ignoreSelector: INTERACTIVE_SELECTOR,
        tuning: {
          simResolution: 128,
          dyeResolution: 512,
          densityDissipation: 1.35,
          velocityDissipation: 0.32,
          curl: 22,
          splatRadius: 0.22,
          splatForce: 4200,
        },
      }).then((nextTeardown) => {
        if (currentRequest !== requestId) {
          nextTeardown?.(true);
          return;
        }
        teardown = nextTeardown;
        canvas!.hidden = !nextTeardown;
      });
    }

    sync();
    motionQuery.addEventListener("change", sync);
    return () => {
      motionQuery.removeEventListener("change", sync);
      requestId += 1;
      teardown?.(true);
    };
  }, [profile]);

  useEffect(() => {
    const haze = hazeRef.current;
    if (!haze) return;

    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    let frameId = 0;
    let fadeId = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let lastX = 0;
    let lastY = 0;
    let lastInputAt = 0;
    let hasPosition = false;

    function draw() {
      frameId = 0;
      const following = performance.now() - lastInputAt < 90;
      if (following) {
        velocityX += (targetX - currentX) * 0.11;
        velocityY += (targetY - currentY) * 0.11;
        velocityX *= 0.76;
        velocityY *= 0.76;
      } else {
        velocityX *= 0.93;
        velocityY *= 0.93;
      }
      currentX += velocityX;
      currentY += velocityY;
      haze!.style.setProperty("--haze-x", `${currentX}px`);
      haze!.style.setProperty("--haze-y", `${currentY}px`);

      if (
        following ||
        Math.abs(velocityX) > 0.08 ||
        Math.abs(velocityY) > 0.08
      ) {
        frameId = requestAnimationFrame(draw);
      }
    }

    function onPointerMove(event: PointerEvent) {
      const projectsPanel = document.querySelector<HTMLElement>(
        "[data-projects-interlude]",
      );
      const projectsRect = projectsPanel?.getBoundingClientRect();
      // the projects layer fills the screen even while invisible, so only let
      // it steal the haze once that white page has actually faded in
      const projectsVisible =
        projectsPanel &&
        Number.parseFloat(getComputedStyle(projectsPanel).opacity) > 0.01;
      const overProjects =
        projectsVisible &&
        projectsRect &&
        event.clientX >= projectsRect.left &&
        event.clientX <= projectsRect.right &&
        event.clientY >= projectsRect.top &&
        event.clientY <= projectsRect.bottom;

      if (overProjects) {
        haze!.style.opacity = "0";
        return;
      }

      if (
        event
          .composedPath()
          .some(
            (target) =>
              target instanceof Element && target.matches(INTERACTIVE_SELECTOR),
          )
      ) {
        return;
      }

      targetX = event.clientX;
      targetY = event.clientY;
      if (!hasPosition) {
        currentX = targetX;
        currentY = targetY;
        lastX = targetX;
        lastY = targetY;
        hasPosition = true;
      }

      velocityX = Math.max(
        -22,
        Math.min(22, velocityX + (targetX - lastX) * 0.16),
      );
      velocityY = Math.max(
        -22,
        Math.min(22, velocityY + (targetY - lastY) * 0.16),
      );
      lastX = targetX;
      lastY = targetY;
      lastInputAt = performance.now();
      haze!.style.opacity = "0.82";
      window.clearTimeout(fadeId);
      fadeId = window.setTimeout(() => {
        haze!.style.opacity = "0";
      }, 780);
      if (!frameId) frameId = requestAnimationFrame(draw);
    }

    function syncMotionPreference() {
      window.removeEventListener("pointermove", onPointerMove);
      haze!.style.opacity = "0";
      if (!motionQuery.matches && profile === "desktop") {
        window.addEventListener("pointermove", onPointerMove, {
          passive: true,
        });
      }
    }

    syncMotionPreference();
    motionQuery.addEventListener("change", syncMotionPreference);
    return () => {
      motionQuery.removeEventListener("change", syncMotionPreference);
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(frameId);
      window.clearTimeout(fadeId);
    };
  }, [profile]);

  return (
    <>
      <canvas
        ref={fluidRef}
        data-fluid-smoke
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-5 h-full w-full max-sm:hidden"
        style={{ filter: "blur(4px) brightness(1.38)", opacity: 0.2 }}
      />
      <div
        ref={hazeRef}
        data-atmospheric-haze
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-6 h-full w-full opacity-0 transition-opacity duration-700 max-sm:hidden"
        style={
          {
            "--haze-x": "50vw",
            "--haze-y": "50vh",
            backdropFilter:
              "blur(9px) hue-rotate(206deg) saturate(0.87) brightness(0.9)",
            WebkitBackdropFilter:
              "blur(9px) hue-rotate(206deg) saturate(0.87) brightness(0.9)",
            maskImage:
              "radial-gradient(ellipse 250px 185px at var(--haze-x) var(--haze-y), black 0%, rgba(0, 0, 0, 0.7) 42%, transparent 76%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 250px 185px at var(--haze-x) var(--haze-y), black 0%, rgba(0, 0, 0, 0.7) 42%, transparent 76%)",
          } as CSSProperties
        }
      />
    </>
  );
}
