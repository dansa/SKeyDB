import type {Tag} from '@/domain/tags'

export type TrailDirection = 'up' | 'down'

interface KeyedTrailEntry {
  key: string
  rect?: DOMRect
}

export interface SkillTrailEntry extends KeyedTrailEntry {
  kind: 'skill'
  name: string
  label: string
  description: string
}

export interface TagTrailEntry extends KeyedTrailEntry {
  kind: 'tag'
  tag: Tag
}

export interface ScalingTrailEntry extends KeyedTrailEntry {
  kind: 'scaling'
  values: number[]
  suffix: string
  stat: string | null
  currentLevel?: number
}

export type TrailEntry = SkillTrailEntry | TagTrailEntry | ScalingTrailEntry

const TRAIL_MIN_BELOW_SPACE = 260
export const TRAIL_MOBILE_MAX_WIDTH = 767

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

export function pushTrailEntry<T extends {key: string}>(stack: T[], next: T): T[] {
  const existingIndex = stack.findIndex((entry) => entry.key === next.key)
  if (existingIndex === -1) {
    return [...stack, next]
  }
  return [...stack.slice(0, existingIndex), next]
}

export function closeTrailTop<T>(stack: T[]): T[] {
  if (stack.length === 0) {
    return stack
  }
  return stack.slice(0, -1)
}

export function closeTrailFromIndex<T>(stack: T[], index: number): T[] {
  if (index <= 0) {
    return []
  }
  if (index >= stack.length) {
    return stack
  }
  return stack.slice(0, index)
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
