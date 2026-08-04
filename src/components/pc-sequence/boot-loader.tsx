"use client";

import { useEffect, useRef, useState } from "react";

const MINIMUM_LOAD_MS = 5000;
const EXIT_MS = 550;

type BootLoaderProps = {
  loadProgress: number;
  reducedMotion: boolean;
  onComplete: () => void;
};

export function BootLoader({
  loadProgress,
  reducedMotion,
  onComplete,
}: BootLoaderProps) {
  const startedAt = useRef(0);
  const completedRef = useRef(false);
  const [timeProgress, setTimeProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    startedAt.current = Date.now();
    const previousRootOverflow = document.documentElement.style.overflow;
    const previousBodyOverflowY = document.body.style.overflowY;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflowY = "hidden";
    let rafId = 0;

    // five seconds is the floor; the real downloads still get the final say
    function tick() {
      setTimeProgress(
        Math.min(1, (Date.now() - startedAt.current) / MINIMUM_LOAD_MS),
      );
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.style.overflow = previousRootOverflow;
      document.body.style.overflowY = previousBodyOverflowY;
    };
  }, []);

  const visibleProgress = Math.min(loadProgress, timeProgress);

  useEffect(() => {
    if (visibleProgress < 1 || completedRef.current) return;
    completedRef.current = true;
    sessionStorage.setItem("forge-boot-seen", "1");
    setExiting(true);

    const exitTimer = window.setTimeout(
      onComplete,
      reducedMotion ? 0 : EXIT_MS,
    );
    return () => window.clearTimeout(exitTimer);
  }, [onComplete, reducedMotion, visibleProgress]);

  const percentage = Math.round(visibleProgress * 100);

  return (
    <div
      data-boot-loader
      className={`fixed inset-0 z-100 grid place-items-center bg-black transition-[opacity,transform] duration-500 ease-out ${
        exiting ? "pointer-events-none -translate-y-full opacity-0" : ""
      } ${reducedMotion ? "transition-none" : ""}`}
    >
      <div className="relative grid size-[clamp(11rem,24vw,16rem)] place-items-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 120 120"
          className="absolute inset-0 size-full -rotate-90"
        >
          <circle
            cx="60"
            cy="60"
            r="56"
            pathLength="1"
            fill="none"
            stroke="rgb(55 55 55)"
            strokeWidth="1.5"
          />
          <circle
            cx="60"
            cy="60"
            r="56"
            pathLength="1"
            fill="none"
            stroke="#dfa812"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="1"
            strokeDashoffset={1 - visibleProgress}
            className="transition-[stroke-dashoffset] duration-150 ease-out"
          />
        </svg>

        <div className="relative grid size-[64%] place-items-center rounded-full border border-[#dfa812]/50 bg-[#0a0a0a] shadow-[0_0_3rem_rgba(223,168,18,0.14)]">
          <div className="absolute inset-[12%] rounded-full [animation-duration:700ms] [background:repeating-conic-gradient(from_8deg,#dfa812_0deg_13deg,#6e5108_14deg_29deg,#111_30deg_44deg)] motion-safe:animate-spin" />
          <div className="absolute inset-[28%] rounded-full border border-[#dfa812]/70 bg-[#080808] shadow-[0_0_1.25rem_rgba(223,168,18,0.4)]" />
          <div className="absolute size-[14%] rounded-full bg-[#dfa812] shadow-[0_0_1rem_rgba(223,168,18,0.8)]" />
        </div>

        <p
          role="status"
          aria-live="polite"
          className="text-muted absolute -bottom-10 font-mono text-xs tracking-[0.24em]"
        >
          LOADING {percentage}%
        </p>
      </div>
    </div>
  );
}
