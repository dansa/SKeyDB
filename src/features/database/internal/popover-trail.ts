import type {AwakenerEnlightenRecord} from '@/domain/awakener-source-schema'

import type {DatabaseReferenceEntry} from './database-reference-entry'

/**
 * Alignment flow directions relative to the target anchor.
 */
export type TrailDirection = 'up' | 'down'

interface KeyedTrailEntry {
  key: string
}

/**
 * Visual model mapping trailing popovers active context, coordinates, and positions.
 */
export type TrailEntry = KeyedTrailEntry &
  DatabaseReferenceEntry & {
    referenceId?: string
    selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
    pinnedLayoutPos?: {top: number; left: number}
    rect?: DOMRect
    direction?: 'up' | 'down'
    parentKey?: string
  }

const TRAIL_MIN_BELOW_SPACE = 260
const TRAIL_MOBILE_MAX_WIDTH = 767

/**
 * Decides whether the popover trail segment should stack 'up' or 'down' relative to the anchor bounds.
 * @param anchorRect Target bounds.
 * @param viewportHeight Dimensions of screen height.
 * @returns 'up' or 'down'.
 */
export function decideTrailDirection(
  anchorRect: Pick<DOMRect, 'top' | 'bottom'>,
  viewportHeight: number,
): TrailDirection {
  const margin = 12
  const gap = 6
  const below = viewportHeight - anchorRect.bottom - margin - gap
  const above = anchorRect.top - margin - gap
  if (below >= TRAIL_MIN_BELOW_SPACE) {
    return 'down'
  }
  return above > below ? 'up' : 'down'
}

/**
 * Checks if the screen viewport matches a mobile device layout size limits.
 * @param viewportWidth Screen width dimension.
 * @returns True if viewport size matches mobile layout rules.
 */
export function isTrailMobileLayout(viewportWidth: number): boolean {
  return viewportWidth <= TRAIL_MOBILE_MAX_WIDTH
}

/**
 * Replaces or appends a popover segment inside an active trailing stack.
 * @param stack Core active popovers list.
 * @param index Target stack insertion position.
 * @param next The new entry to incorporate.
 * @returns Modified stack list.
 */
export function insertTrailEntryAfterIndex<T extends {key: string}>(
  stack: T[],
  index: number,
  next: T,
): T[] {
  const existingIndex = stack.findIndex((entry) => entry.key === next.key)
  if (existingIndex !== -1) {
    const nextStack = stack.slice(0, existingIndex + 1)
    nextStack[existingIndex] = next
    return nextStack
  }
  const nextIndex = Math.max(-1, Math.min(index, stack.length - 1)) + 1
  return [...stack.slice(0, nextIndex), next]
}

/**
 * Closes trailing elements starting from a specific index depth.
 * @param stack Core active popovers.
 * @param index Anchor index from which child windows are closed.
 * @returns Bounded sliced list.
 */
export function closeTrailFromIndex<T>(stack: T[], index: number): T[] {
  if (index < 0 || index >= stack.length) {
    return stack
  }
  return stack.slice(0, index)
}

/**
 * Checks if the first popover entry matches the next target root key.
 */
export function isSameTrailRoot(stack: KeyedTrailEntry[], nextRootKey: string): boolean {
  return stack.length > 0 && stack[0].key === nextRootKey
}

/**
 * Resolves opening a new root trail popover.
 * @param stack Core active popovers.
 * @param next The new root popover segment details.
 * @returns Rewritten list stack.
 */
export function openTrailRoot<T extends {key: string}>(stack: T[], next: T): T[] {
  if (isSameTrailRoot(stack, next.key)) {
    const nextStack = [...stack]
    nextStack[0] = next
    return nextStack
  }
  return [next]
}
