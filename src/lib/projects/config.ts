import {
  ASSEMBLY_FRAME_COUNT,
  PLAYBACK_FRAME_COUNT,
  PROJECTS_PLAYBACK_FRAMES,
  SCROLL_LENGTH_VH,
} from "@/lib/pc-sequence/config";

const LAST_STEP = PLAYBACK_FRAME_COUNT - 1;
const PROJECTS_START_STEP = ASSEMBLY_FRAME_COUNT - 1;
const PROJECTS_END_STEP = PROJECTS_START_STEP + PROJECTS_PLAYBACK_FRAMES;

export const PROJECTS_PROGRESS = {
  start: PROJECTS_START_STEP / LAST_STEP,
  end: PROJECTS_END_STEP / LAST_STEP,
} as const;

/** The panel spends the middle half of its window fully covering the PC. */
export const PROJECTS_REVEAL_FRACTION = 0.25;
export const PROJECTS_EXIT_FRACTION = 0.75;

export function projectsPanelYPercent(progress: number) {
  if (progress <= PROJECTS_REVEAL_FRACTION) {
    return 100 - (progress / PROJECTS_REVEAL_FRACTION) * 100;
  }
  if (progress < PROJECTS_EXIT_FRACTION) return 0;
  return (
    -((progress - PROJECTS_EXIT_FRACTION) / (1 - PROJECTS_EXIT_FRACTION)) * 100
  );
}

export function getProjectsAnchorScrollY(pcSection: HTMLElement) {
  const holdMidpoint = (PROJECTS_PROGRESS.start + PROJECTS_PROGRESS.end) / 2;
  return (
    pcSection.offsetTop + window.innerHeight * SCROLL_LENGTH_VH * holdMidpoint
  );
}
