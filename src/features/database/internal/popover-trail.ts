import type {AwakenerEnlightenRecord} from '@/domain/awakener-source-schema'

import type {DatabaseReferenceEntry} from './database-reference-entry'

export type TrailDirection = 'up' | 'down'

interface KeyedTrailEntry {
  key: string
}

export type TrailEntry = KeyedTrailEntry &
  DatabaseReferenceEntry & {
    referenceId?: string
    selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  }

const TRAIL_MIN_BELOW_SPACE = 260
const TRAIL_MOBILE_MAX_WIDTH = 767

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

export function isTrailMobileLayout(viewportWidth: number): boolean {
  return viewportWidth <= TRAIL_MOBILE_MAX_WIDTH
}

export function insertTrailEntryAfterIndex<T extends {key: string}>(
  stack: T[],
  index: number,
  next: T,
): T[] {
  const existingIndex = stack.findIndex((entry) => entry.key === next.key)
  if (existingIndex !== -1) {
    return stack
  }

  const nextIndex = Math.max(-1, Math.min(index, stack.length - 1)) + 1
  return [...stack.slice(0, nextIndex), next, ...stack.slice(nextIndex)]
}

export function closeTrailFromIndex<T>(stack: T[], index: number): T[] {
  if (index < 0 || index >= stack.length) {
    return stack
  }
  return stack.filter((_, entryIndex) => entryIndex !== index)
}

export function isSameTrailRoot(stack: KeyedTrailEntry[], nextRootKey: string): boolean {
  return stack.length > 0 && stack[0].key === nextRootKey
}

export function openTrailRoot<T extends {key: string}>(stack: T[], next: T): T[] {
  if (isSameTrailRoot(stack, next.key)) {
    return stack
  }
  return [next]
}
