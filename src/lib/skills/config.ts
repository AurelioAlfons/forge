import {
  PLAYBACK_FRAME_COUNT,
  SCROLL_LENGTH_VH,
  ZOOM_LEG_START_STEP,
  ZOOM_PLAYBACK_FRAME_COUNT,
  zoomPlaybackFrameIndex,
} from "@/lib/pc-sequence/config";
import type { Skill } from "./skills-data";

// ===== THE SPIN WINDOW =====

// measured every frame's lit bbox. 62 is the first one that's just fan on
// black, anything earlier still has case in shot. zero-based so it's 61.
const FAN_ONLY_ZOOM_FRAME = 61;

/** First playback step that lands on a fan-only frame. Walks the real mapping
 *  so retuning the spin cannot leave this value stale. */
function firstFanOnlyStep() {
  for (let step = 0; step < ZOOM_PLAYBACK_FRAME_COUNT; step += 1) {
    if (zoomPlaybackFrameIndex(step) >= FAN_ONLY_ZOOM_FRAME) return step;
  }
  return 0;
}

const LAST_STEP = PLAYBACK_FRAME_COUNT - 1;
const SPIN_START_STEP = ZOOM_LEG_START_STEP + firstFanOnlyStep();
const SPIN_END_STEP = ZOOM_LEG_START_STEP + ZOOM_PLAYBACK_FRAME_COUNT - 1;

export const SPIN_FORWARD_PROGRESS = {
  start: SPIN_START_STEP / LAST_STEP,
  end: SPIN_END_STEP / LAST_STEP,
} as const;

export const MATERIALIZE_FRACTION = 0.4;
export const HOLD_FRACTION = 0.2;
export const DEMATERIALIZE_FRACTION = 0.4;
export const HEX_TWEEN_DURATION = 0.08;

export function getSkillsAnchorScrollY(pcSection: HTMLElement) {
  const holdMidpoint =
    (SPIN_FORWARD_PROGRESS.start + SPIN_FORWARD_PROGRESS.end) / 2;
  return (
    pcSection.offsetTop + window.innerHeight * SCROLL_LENGTH_VH * holdMidpoint
  );
}

// ===== THE TWO BLOCKS =====

export const FRAME_WIDTH = 1920;
export const FRAME_HEIGHT = 1080;
export const FAN_RADIUS_IN_FRAME = 290;

const SQRT_3 = Math.sqrt(3);

// filled grids, so each block's outline is a clean rhombus.
// 9 and 8 don't fit the same rectangle, and a missing cell looks like a bug.
export const BLOCK_GRID = {
  left: { cols: 3, rows: 3 },
  right: { cols: 2, rows: 4 },
} as const;

const BLOCK_COLUMNS = Math.max(BLOCK_GRID.left.cols, BLOCK_GRID.right.cols);

// flat-top: 1.5 apart across, √3 apart down. the old √3/2 pair was pointy-top
// numbers on a column layout, which is why nothing ever touched.
const COLUMN_PITCH = 1.5;
const ROW_PITCH = SQRT_3;

// kept separate from tile size so i can move the blocks without shrinking
// every logo again.
export const FAN_CLEARANCE_IN_HEX_WIDTHS = 1;

/** Vertical span of one grid: its rows, what the lean adds across the columns,
 *  and a full hex height for the top and bottom overhangs. */
function blockSpan({ cols, rows }: { cols: number; rows: number }) {
  return (rows - 1) * ROW_PITCH + (cols - 1) * (ROW_PITCH / 2) + ROW_PITCH;
}

const BLOCK_HEIGHT_IN_HEX = Math.max(
  blockSpan(BLOCK_GRID.left),
  blockSpan(BLOCK_GRID.right),
);

/** How far past the fan's edge a block reaches: clearance, the first column's
 *  half-pitch, the rest of the columns, and half a hex for the outer tile. */
const BLOCK_REACH_IN_HEX =
  FAN_CLEARANCE_IN_HEX_WIDTHS * COLUMN_PITCH +
  COLUMN_PITCH / 2 +
  (BLOCK_COLUMNS - 1) * COLUMN_PITCH +
  1;

// the cap decides desktop size, not the room maths. that allows about 70 at
// 1440x900, so a lower cap just leaves the tiles small for nothing.
export const HEX_SIZE_PX = { min: 10, max: 72 } as const;

/**
 * Picks icon ink that survives on a given tile. Real brand fills mean a white
 * mark vanishes on Next.js or Vercel and turns unreadable on JavaScript yellow,
 * so the icon flips on the tile's own luminance.
 */
export function inkFor(color: string) {
  const n = Number.parseInt(color.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];

  return luminance > 0.34 ? "#0a0a12" : "#ffffff";
}

const EDGE_MARGIN_PX = 24;
const RULER_ZONE_PX = 60;

export type HoneycombGeometry = {
  hex: number;
  fanRadius: number;
  gap: number;
};

export type BlockOffset = {
  side: -1 | 1;
  x: number;
  y: number;
};

/** Places one cell. Column 0 sits beside the fan and grows outward, and each
 *  block centres on its own footprint. */
export function blockOffset(
  block: Skill["block"],
  col: number,
  row: number,
): BlockOffset {
  const side = block === "left" ? -1 : 1;
  const grid = BLOCK_GRID[block];
  const fromFan = COLUMN_PITCH / 2 + col * COLUMN_PITCH;

  // every column leans half a row below the last. alternating 0/+½/0 tiles
  // fine too, it just zigzags the outer edge. a constant lean stays a rhombus.
  const rawY = row * ROW_PITCH + col * (ROW_PITCH / 2);

  const centreY =
    ((grid.rows - 1) * ROW_PITCH + (grid.cols - 1) * (ROW_PITCH / 2)) / 2;
  return { side, x: fromFan, y: rawY - centreY };
}

export function computeHoneycombGeometry(
  stageWidth: number,
  stageHeight: number,
): HoneycombGeometry {
  const scale = Math.min(stageWidth / FRAME_WIDTH, stageHeight / FRAME_HEIGHT);
  const fanRadius = FAN_RADIUS_IN_FRAME * scale;
  const leftRoom = stageWidth / 2 - RULER_ZONE_PX - fanRadius;
  const rightRoom = stageWidth / 2 - EDGE_MARGIN_PX - fanRadius;
  const maxByWidth = Math.min(leftRoom, rightRoom) / BLOCK_REACH_IN_HEX;
  const maxByHeight = (stageHeight - EDGE_MARGIN_PX * 2) / BLOCK_HEIGHT_IN_HEX;
  const hex = Math.max(
    HEX_SIZE_PX.min,
    Math.min(HEX_SIZE_PX.max, maxByWidth, maxByHeight),
  );
  const gap = hex * COLUMN_PITCH * FAN_CLEARANCE_IN_HEX_WIDTHS;

  return { hex, fanRadius, gap };
}
