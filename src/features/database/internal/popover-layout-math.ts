/**
 * Bounded viewport screen size dimensions.
 */
export interface ViewportSize {
  width: number
  height: number
}

/**
 * Coordinate offsets representation.
 */
export interface Point {
  x: number
  y: number
}

/**
 * Bounding client rectangle coordinates map.
 */
export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * Parameter configuration for calculateBasePosition.
 */
export interface BasePositionParams {
  /** The anchor bounding client rect details. */
  anchorRect: Rect
  /** Total offset width of the popover. */
  popoverWidth: number
  /** Total offset height of the popover. */
  popoverHeight: number
  /** Preferred alignment direction. */
  direction: 'up' | 'down'
  /** Stack level order of the popover. */
  zIndex: number
  /** Dimensions of the viewport boundaries. */
  viewport: ViewportSize
  /** Bounded element layout gaps. */
  gap: number
  /** Outer viewport safety margin constraint. */
  margin: number
}

/**
 * Computes default alignment coordinates for a popover aligning to its anchor.
 * Ensures the popover stays fully inside the screen boundaries.
 * @returns Bounded coordinates top and left.
 */
export function calculateBasePosition({
  anchorRect,
  popoverWidth,
  popoverHeight,
  direction,
  zIndex,
  viewport,
  gap,
  margin,
}: BasePositionParams): {top: number; left: number} {
  let left = anchorRect.left
  if (left + popoverWidth > viewport.width - margin) {
    left = viewport.width - popoverWidth - margin
  }
  if (left < margin) {
    left = margin
  }

  const isNested = zIndex > 0
  const verticalGap = isNested ? 2 : gap

  let top =
    direction === 'up'
      ? anchorRect.top - verticalGap - popoverHeight
      : anchorRect.bottom + verticalGap

  if (top + popoverHeight > viewport.height - margin) {
    top = viewport.height - popoverHeight - margin
  }
  if (top < margin) {
    top = margin
  }

  return {
    top: Math.round(top),
    left: Math.round(left),
  }
}

/**
 * Parameters for clampOffset constraint calculation.
 */
export interface ClampOffsetParams {
  /** Ideal horizontal position. */
  targetLeft: number
  /** Ideal vertical position. */
  targetTop: number
  /** Popover element width. */
  popoverWidth: number
  /** Popover element height. */
  popoverHeight: number
  /** Bounded screen viewport sizes. */
  viewport: ViewportSize
  /** Safety padding constraint. */
  margin: number
  /** Base horizontal position coordinates. */
  layoutLeft: number
  /** Base vertical position coordinates. */
  layoutTop: number
}

/**
 * Restricts drag coordinate adjustments to ensure the popover cannot be dragged off screen.
 * @returns Relative position offset point.
 */
export function clampOffset({
  targetLeft,
  targetTop,
  popoverWidth,
  popoverHeight,
  viewport,
  margin,
  layoutLeft,
  layoutTop,
}: ClampOffsetParams): Point {
  const limitX = viewport.width - popoverWidth - margin
  const minLeft = Math.min(margin, limitX)
  const maxLeft = Math.max(margin, limitX)
  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, targetLeft))

  const limitY = viewport.height - popoverHeight - margin
  const minTop = Math.min(margin, limitY)
  const maxTop = Math.max(margin, limitY)
  const clampedTop = Math.max(minTop, Math.min(maxTop, targetTop))

  return {
    x: clampedLeft - layoutLeft,
    y: clampedTop - layoutTop,
  }
}
