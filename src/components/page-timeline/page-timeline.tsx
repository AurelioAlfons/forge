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
import { getSectionAnchorScrollY } from "@/lib/navigation/anchors";
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

// none of the four sit at a fixed fraction — projects/skills ride the pinned
// pc sequence, experience/contact are real sections whose offset moves
// whenever the page grows. "home" is the only stop that's actually always 0.
type DynamicProgress = {
  projects: number;
  skills: number;
  experience: number;
  contact: number;
};

function resolvedProgress(item: TimelineItem, dynamic: DynamicProgress) {
  if (item.id === "projects") return dynamic.projects;
  if (item.id === "skills") return dynamic.skills;
  if (item.id === "experience") return dynamic.experience;
  if (item.id === "contact") return dynamic.contact;
  return item.progress;
}

// every real chapter interval gets one equal slice of the visible ruler. long
// chapters run faster, short ones slow down, and every big bar still lands true.
function timelineProgressFromPage(
  pageProgress: number,
  dynamic: DynamicProgress,
) {
  const progress = clamp(pageProgress);

  for (let index = 1; index < timelineItems.length; index += 1) {
    const previous = timelineItems[index - 1];
    const next = timelineItems[index];
    const pageStart = resolvedProgress(previous, dynamic);
    const pageEnd = resolvedProgress(next, dynamic);

    if (progress > pageEnd && index < timelineItems.length - 1) continue;
    if (pageEnd <= pageStart) return next.progress;

    const localProgress = clamp((progress - pageStart) / (pageEnd - pageStart));
    return (
      previous.progress + (next.progress - previous.progress) * localProgress
    );
  }

  return 1;
}

// dragging uses the same road backwards, so an equal-looking ruler still
// scrolls to the real uneven chapter positions underneath it.
function pageProgressFromTimeline(
  timelineProgress: number,
  dynamic: DynamicProgress,
) {
  const progress = clamp(timelineProgress);

  for (let index = 1; index < timelineItems.length; index += 1) {
    const previous = timelineItems[index - 1];
    const next = timelineItems[index];

    if (progress > next.progress && index < timelineItems.length - 1) continue;

    const localProgress = clamp(
      (progress - previous.progress) / (next.progress - previous.progress),
    );
    const pageStart = resolvedProgress(previous, dynamic);
    const pageEnd = resolvedProgress(next, dynamic);
    return pageStart + (pageEnd - pageStart) * localProgress;
  }

  return dynamic.contact;
}

function nearestItem(progress: number): TimelineItem {
  let closest: TimelineItem = timelineItems[0];
  let closestDistance = Infinity;

  for (const item of timelineItems) {
    const distance = Math.abs(progress - item.progress);
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
  const experienceProgressRef = useRef<number>(
    timelineItems.find((item) => item.id === "experience")?.progress ?? 0.75,
  );
  const contactProgressRef = useRef<number>(
    timelineItems.find((item) => item.id === "contact")?.progress ?? 1,
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

    // plain sections in normal flow — no pin math needed, just where they sit
    if (maxScrollRef.current > 0) {
      const experienceSection = document.getElementById("experience");
      if (experienceSection) {
        experienceProgressRef.current = clamp(
          getSectionAnchorScrollY(experienceSection) / maxScrollRef.current,
        );
      }

      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactProgressRef.current = clamp(
          getSectionAnchorScrollY(contactSection) / maxScrollRef.current,
        );
      }
    }
  }, []);

  const applyPageProgress = useCallback((nextPageProgress: number) => {
    const dynamic = {
      projects: projectsProgressRef.current,
      skills: skillsProgressRef.current,
      experience: experienceProgressRef.current,
      contact: contactProgressRef.current,
    };
    const timelineProgress = timelineProgressFromPage(
      nextPageProgress,
      dynamic,
    );
    progressRef.current = timelineProgress;

    if (markerRef.current) {
      markerRef.current.style.top = `${timelineProgress * 100}%`;
    }
    sliderRef.current?.setAttribute(
      "aria-valuenow",
      String(Math.round(timelineProgress * 100)),
    );

    const nextItem = nearestItem(timelineProgress);
    if (nextItem.id === activeIdRef.current) return;
    activeIdRef.current = nextItem.id;
    setActiveId(nextItem.id);
  }, []);

  const syncFromPage = useCallback(() => {
    const maxScroll = maxScrollRef.current;
    applyPageProgress(maxScroll > 0 ? window.scrollY / maxScroll : 0);
  }, [applyPageProgress]);

  const scrollToProgress = useCallback(
    (nextProgress: number, behavior: ScrollBehavior = "auto") => {
      measure();
      const timelineProgress = clamp(nextProgress);
      const pageProgress = pageProgressFromTimeline(timelineProgress, {
        projects: projectsProgressRef.current,
        skills: skillsProgressRef.current,
        experience: experienceProgressRef.current,
        contact: contactProgressRef.current,
      });
      applyPageProgress(pageProgress);
      window.scrollTo({
        top: pageProgress * maxScrollRef.current,
        behavior,
      });
    },
    [applyPageProgress, measure],
  );

  // the item owns the ruler slot; the inverse mapper finds its live page spot
  const scrollToItem = useCallback(
    (item: TimelineItem, behavior: ScrollBehavior = "auto") => {
      scrollToProgress(item.progress, behavior);
    },
    [scrollToProgress],
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
