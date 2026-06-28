// Geometry + tuning constants shared by layout and the SVG forest.

export const DEFAULT_N = 12
export const MIN_N = 4
export const MAX_N = 50

/** Chip (node) radius in SVG user units. */
export const NODE_R = 22
/** Min horizontal gap between sibling chip centers. */
export const NODE_GAP_X = 64
/** Vertical gap between tree levels (center to center). */
export const LEVEL_GAP_Y = 88
/** Padding inside a component's bounding box. */
export const BOX_PAD = 26
/** Gap between packed component boxes when shelf-packing. */
export const BOX_GUTTER = 34

/** 10 component palette slots; chip color = chipSlot(rootId). */
export const PALETTE_SLOTS = 10
export function chipSlot(rootId: number): number {
  return (((rootId % PALETTE_SLOTS) + PALETTE_SLOTS) % PALETTE_SLOTS) + 1
}

/** Playback speed multipliers offered by the transport. */
export const SPEED_STEPS = [0.25, 0.5, 1, 1.5, 2, 4] as const
export const DEFAULT_SPEED = 1
/** Base milliseconds per step at 1x. */
export const BASE_STEP_MS = 900
