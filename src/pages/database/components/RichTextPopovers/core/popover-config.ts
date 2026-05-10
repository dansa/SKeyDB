export const POPOVER_LAYOUT = {
  MARGIN: 12,
  GAP: 6,
  MAX_WIDTH: 600,
  BASE_Z_INDEX: 950,
  MAX_CONTENT_HEIGHT: 240,
  ANIMATION_SLIDE_OFFSET: 12,
} as const

export const POPOVER_TIMINGS = {
  HOVER_DELAY: 300,
  ANIMATION_DURATION: 150,
} as const

export type PopoverLayout = typeof POPOVER_LAYOUT
export type PopoverTimings = typeof POPOVER_TIMINGS
