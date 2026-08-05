"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIntro } from "@/components/intro/use-intro";
import { getSkillsAnchorScrollY } from "@/lib/skills/config";
import { getProjectsAnchorScrollY } from "@/lib/projects/config";
import {
  timelineItems,
  type TimelineItem,
} from "@/lib/navigation/timeline-items";
import { TimelineRuler } from "./timeline-ruler";

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const LEAVE_DELAY_MS = 150;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

// "skills" doesn't have a fixed fraction — it rides the fan spin, so its real
// position depends on document height like everything else. every other stop
// stays a static guess until step 0's full architecture pass.
type DynamicProgress = { projects: number; skills: number };

function resolvedProgress(item: TimelineItem, dynamic: DynamicProgress) {
  if (item.id === "projects") return dynamic.projects;
  if (item.id === "skills") return dynamic.skills;
  return item.progress;
}

// nearest by nudged position, not by index. index-rounding assumed the five
// stops sit at even fractions, which skills no longer does once resolved.
function nearestItem(progress: number, dynamic: DynamicProgress): TimelineItem {
  let closest: TimelineItem = timelineItems[0];
  let closestDistance = Infinity;

  for (const item of timelineItems) {
    const distance = Math.abs(progress - resolvedProgress(item, dynamic));
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = item;
    }
  }

  return closest;
}

export function PageTimeline() {
  const rootRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const maxScrollRef = useRef(0);
  // starts at the old static guess so nothing breaks before the first measure
  const skillsProgressRef = useRef<number>(
    timelineItems.find((item) => item.id === "skills")?.progress ?? 0.5,
  );
  const projectsProgressRef = useRef<number>(
    timelineItems.find((item) => item.id === "projects")?.progress ?? 0.25,
  );
  const trackRectRef = useRef<DOMRect | null>(null);
  const activeIdRef = useRef<TimelineItem["id"]>(timelineItems[0].id);
  const pointerIdRef = useRef<number | null>(null);
  const previousUserSelectRef = useRef("");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressFocusOpenRef = useRef(false);
  const reducedMotionRef = useRef(false);

  const [activeId, setActiveId] = useState<TimelineItem["id"]>("home");
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // dead to input until the reveal is done, same as the player
  const { phase } = useIntro();
  const introRunning = phase !== "ready";

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current === null) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const openLabels = useCallback(() => {
    clearCloseTimer();
    setIsOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, LEAVE_DELAY_MS);
  }, [clearCloseTimer]);

  const measure = useCallback(() => {
    maxScrollRef.current = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    trackRectRef.current = trackRef.current?.getBoundingClientRect() ?? null;

    const pcSection = document.getElementById("pc-sequence");
    if (pcSection && maxScrollRef.current > 0) {
      projectsProgressRef.current = clamp(
        getProjectsAnchorScrollY(pcSection) / maxScrollRef.current,
      );
      skillsProgressRef.current = clamp(
        getSkillsAnchorScrollY(pcSection) / maxScrollRef.current,
      );
    }
  }, []);

  const applyProgress = useCallback((nextProgress: number) => {
    const progress = clamp(nextProgress);
    progressRef.current = progress;

    if (markerRef.current) markerRef.current.style.top = `${progress * 100}%`;
    sliderRef.current?.setAttribute(
      "aria-valuenow",
      String(Math.round(progress * 100)),
    );

    const nextItem = nearestItem(progress, {
      projects: projectsProgressRef.current,
      skills: skillsProgressRef.current,
    });
    if (nextItem.id === activeIdRef.current) return;
    activeIdRef.current = nextItem.id;
    setActiveId(nextItem.id);
  }, []);

  const syncFromPage = useCallback(() => {
    const maxScroll = maxScrollRef.current;
    applyProgress(maxScroll > 0 ? window.scrollY / maxScroll : 0);
  }, [applyProgress]);

  const scrollToProgress = useCallback(
    (nextProgress: number, behavior: ScrollBehavior = "auto") => {
      measure();
      const progress = clamp(nextProgress);
      applyProgress(progress);
      window.scrollTo({
        top: progress * maxScrollRef.current,
        behavior,
      });
    },
    [applyProgress, measure],
  );

  // measures first so a resized/rescrolled page resolves "skills" against
  // where it actually sits right now, not a stale reading from last measure
  const scrollToItem = useCallback(
    (item: TimelineItem, behavior: ScrollBehavior = "auto") => {
      measure();
      scrollToProgress(
        resolvedProgress(item, {
          projects: projectsProgressRef.current,
          skills: skillsProgressRef.current,
        }),
        behavior,
      );
    },
    [measure, scrollToProgress],
  );

  const progressFromPointer = useCallback(
    (clientY: number) => {
      if (!trackRectRef.current) measure();
      const rect = trackRectRef.current;
      if (!rect || rect.height === 0) return progressRef.current;
      return clamp((clientY - rect.top) / rect.height);
    },
    [measure],
  );

  useEffect(() => {
    let scrollRaf = 0;
    let settleRaf = 0;
    let finalSettleRaf = 0;
    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);

    function updateMotionPreference() {
      reducedMotionRef.current = motionQuery.matches;
    }

    function scheduleSync() {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        syncFromPage();
      });
    }

    function refreshMeasurements() {
      measure();
      scheduleSync();
    }

    function restoreSupportedHash() {
      const hash = window.location.hash.slice(1);
      const item = timelineItems.find((entry) => entry.id === hash);
      if (item) scrollToItem(item, "auto");
      else syncFromPage();
    }

    updateMotionPreference();
    measure();
    syncFromPage();

    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", refreshMeasurements);
    window.addEventListener("orientationchange", refreshMeasurements);
    motionQuery.addEventListener("change", updateMotionPreference);
    ScrollTrigger.addEventListener("refresh", refreshMeasurements);

    const resizeObserver = new ResizeObserver(refreshMeasurements);
    resizeObserver.observe(document.documentElement);

    // Wait for the intro lock to release before restoring a deep link. During
    // boot the temporary locked layout can report a false section offset.
    if (phase === "ready") {
      settleRaf = requestAnimationFrame(() => {
        finalSettleRaf = requestAnimationFrame(restoreSupportedHash);
      });
    }

    return () => {
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", refreshMeasurements);
      window.removeEventListener("orientationchange", refreshMeasurements);
      motionQuery.removeEventListener("change", updateMotionPreference);
      ScrollTrigger.removeEventListener("refresh", refreshMeasurements);
      resizeObserver.disconnect();
      cancelAnimationFrame(scrollRaf);
      cancelAnimationFrame(settleRaf);
      cancelAnimationFrame(finalSettleRaf);
    };
  }, [measure, phase, scrollToItem, syncFromPage]);

  useEffect(() => {
    if (!isOpen) return;

    function closeFromOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeFromOutside);
    return () => document.removeEventListener("pointerdown", closeFromOutside);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
      if (pointerIdRef.current !== null) {
        document.body.style.userSelect = previousUserSelectRef.current;
      }
    };
  }, [clearCloseTimer]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    measure();

    pointerIdRef.current = event.pointerId;
    previousUserSelectRef.current = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    scrollToProgress(progressFromPointer(event.clientY), "auto");
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      pointerIdRef.current !== event.pointerId ||
      !event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      return;
    }

    event.preventDefault();
    scrollToProgress(progressFromPointer(event.clientY), "auto");
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    pointerIdRef.current = null;
    document.body.style.userSelect = previousUserSelectRef.current;
    setIsDragging(false);
  }

  function handleSliderKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    let nextProgress: number | null = null;

    switch (event.key) {
      case "ArrowUp":
        nextProgress = progressRef.current - 0.05;
        break;
      case "ArrowDown":
        nextProgress = progressRef.current + 0.05;
        break;
      case "PageUp":
        nextProgress = progressRef.current - 0.25;
        break;
      case "PageDown":
        nextProgress = progressRef.current + 0.25;
        break;
      case "Home":
        nextProgress = 0;
        break;
      case "End":
        nextProgress = 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    scrollToProgress(nextProgress, "auto");
  }

  function handleLinkActivate(
    event: ReactMouseEvent<HTMLAnchorElement>,
    item: TimelineItem,
  ) {
    event.preventDefault();
    const behavior = reducedMotionRef.current ? "auto" : "smooth";
    scrollToItem(item, behavior);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#${item.id}`,
    );

    if (!window.matchMedia(FINE_POINTER_QUERY).matches) setIsOpen(false);
  }

  function handlePointerEnter() {
    if (window.matchMedia(FINE_POINTER_QUERY).matches) openLabels();
  }

  function handlePointerLeave() {
    if (window.matchMedia(FINE_POINTER_QUERY).matches) scheduleClose();
  }

  function handleFocus(event: ReactFocusEvent<HTMLDivElement>) {
    if (suppressFocusOpenRef.current) return;
    if (event.currentTarget.contains(event.target)) openLabels();
  }

  function handleBlur(event: ReactFocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      scheduleClose();
    }
  }

  function handleRootKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    clearCloseTimer();
    suppressFocusOpenRef.current = true;
    sliderRef.current?.focus({ preventScroll: true });
    setIsOpen(false);
    requestAnimationFrame(() => {
      suppressFocusOpenRef.current = false;
    });
  }

  return (
    <div
      ref={rootRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
      onKeyDownCapture={handleRootKeyDown}
      data-page-timeline
      inert={introRunning}
      className={`fixed top-1/2 left-[max(env(safe-area-inset-left),0.5rem)] z-40 -translate-y-1/2 ${introRunning ? "pointer-events-none" : ""}`}
    >
      <TimelineRuler
        sliderRef={sliderRef}
        trackRef={trackRef}
        markerRef={markerRef}
        activeId={activeId}
        isOpen={isOpen}
        isDragging={isDragging}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerEnd={handlePointerEnd}
        onKeyDown={handleSliderKeyDown}
        onToggle={() => setIsOpen((open) => !open)}
        onLinkActivate={handleLinkActivate}
      />
    </div>
  );
}
