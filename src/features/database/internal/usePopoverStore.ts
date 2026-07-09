import {createContext, createElement, useContext, useMemo, useState, type ReactNode} from 'react'

import {useStore} from 'zustand'
import {devtools} from 'zustand/middleware'
import {createStore, type StoreApi} from 'zustand/vanilla'

import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  FullStats,
} from '@/domain/awakener-source-schema.ts'
import type {
  DatabaseReferenceInfo,
  ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer.ts'
import {hydrateGlobalDatabaseReferenceInfo} from '@/domain/global-database-reference-layer.ts'
import type {PublicFormulaContext} from '@/domain/public-formula-context.ts'

import {
  buildOverlayEntry,
  buildOverlayFallbackEntry,
  buildTrailEntry,
  needsLazyReferenceHydration,
  resolveOverlayReference,
  resolveReferenceByName,
  withDescriptionRankContext,
  withInheritedReferenceLayerOverride,
} from './database-popover-controller-model'
import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {
  closeTrailFromIndex,
  insertTrailEntryAfterIndex,
  openTrailRoot,
  type TrailEntry,
} from './popover-trail'

/**
 * Event wrapper for anchor elements triggering popovers.
 */
export interface DatabasePopoverAnchorEvent {
  /** The target element that triggered the popover. */
  currentTarget: HTMLElement
  /** Stop propagation callback to prevent parent handlers from firing. */
  stopPropagation: () => void
}

/**
 * Progression rank configuration for a popover description view.
 */
export interface DatabasePopoverDescriptionRankContext {
  /** The active skill/overlay rank (e.g. current level). */
  descriptionRank?: number
  /** The maximum achievable rank for the skill/overlay. */
  descriptionMaxRank?: number
  /** The ranking behavior mode: static value or dynamic current tracking. */
  descriptionRankMode?: 'static' | 'current'
}

/**
 * Event with targetRect or currentTarget wrapper type.
 */
export type EventWithRect = {targetRect: DOMRect} | {currentTarget: Element}

/**
 * Zustand Store state schema representing all active database popovers,
 * their coordinates, layout states, and contextual dependency layers.
 */
export interface PopoverState extends PopoverStateData, PopoverActions {
  /** Grouped action methods for cleaner usePopoverActions usage. */
  actions: Omit<PopoverActions, 'setDatabaseContext'>
}

/**
 * The data properties (state) stored inside the Popover Store.
 */
export interface PopoverStateData {
  /** The stack of nested popovers currently displaying in a path (trail). */
  trail: TrailEntry[]
  /** The set of pinned/floating popovers currently positioned in the viewport. */
  floating: TrailEntry[]
  /** The owner ID currently claiming ownership of the active popover trail. */
  ownerId: string | null
  /** Map of popover offsets relative to their base layout position. */
  offsets: Record<string, {x: number; y: number}>
  /** Map of popover pinning states (pinned vs unpinned/trailing). */
  pinnedStates: Record<string, boolean>
  /** Map of popover override levels/ranks by record ID. */
  activeLevels: Record<string, number>
  /** Boolean indicating if the active trail path was spawned from a floating item. */
  isFromFloating: boolean
  /** Array of popover keys ordered from back to front (highest z-index is last). */
  zIndexOrder: string[]
  /** Counter used to track and cancel stale root preloads/hydration requests. */
  rootHydrationRequestCounter: number
  /** Map of nested popover hydration request counters by source parent key. */
  nestedHydrationRequestCounters: Record<string, number>
  /** Element reference that anchored the active popover root. */
  anchorElement: HTMLElement | null
  /** Bound box rect of the root anchor element. */
  anchorRect: DOMRect | null

  /** Resolved database references and info layer. */
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  /** Context values for dynamic database formula calculations. */
  formulaContext: PublicFormulaContext | null
  /** Current stats of the active context. */
  stats: FullStats | null
  /** The active slot selected for enlightens. */
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
  /** Active progression rank context. */
  currentDescriptionRankContext: DatabasePopoverDescriptionRankContext | null
  /** Visibility toggle for tag icons inside popover text. */
  showTagIcons: boolean
  /** Visibility toggle for scaling math breakdowns. */
  showVisibleScaling: boolean
}

/**
 * The action methods (mutators and orchestrators) in the Popover Store.
 */
export interface PopoverActions {
  /** Sets the shared database contextual fields in the popover store. */
  setDatabaseContext: (
    ctx: Partial<
      Pick<
        PopoverStateData,
        | 'ownerId'
        | 'referenceLayer'
        | 'formulaContext'
        | 'stats'
        | 'selectedEnlightenSlot'
        | 'currentDescriptionRankContext'
        | 'showTagIcons'
        | 'showVisibleScaling'
      >
    >,
  ) => void

  /** Spawns a new popover trail root claimed by a specific owner ID. */
  openRoot: (ownerId: string, entry: TrailEntry) => void
  /** Pushes a nested popover into the stack relative to a parent index. */
  pushNested: (index: number, entry: TrailEntry) => void
  /** Toggles the pinning state of a popover between trailing and floating. */
  togglePin: (key: string, rect?: DOMRect) => void
  /** Brings a popover and its child trail to the front of the z-index order. */
  bringToFront: (key: string) => void
  /** Closes all popovers at and after a specific index. */
  closeFrom: (index: number) => void
  /** Updates the drag-and-drop offset coordinates of a popover. */
  updateOffset: (key: string, x: number, y: number) => void
  /** Clears all popovers, offsets, and pinning states completely. */
  clear: () => void
  /** Clears the active trailing popovers while preserving floating popovers. */
  clearTrail: () => void
  /** Clears the active trail without modifying anchor element coordinates. */
  clearTrailOnly: () => void
  /** Updates the active display level of a popover's scaling grid. */
  updatePopoverLevel: (recordId: string, level: number) => void

  /** Opens a root popover with a pre-configured reference entry. */
  openRootInfo: (
    entry: KeyedDatabaseReferenceEntry,
    event: DatabasePopoverAnchorEvent,
    ownerIdOverride?: string,
  ) => void
  /** Resolves reference info by name and opens it as a root popover. */
  openRootReferenceByName: (
    name: string,
    event: DatabasePopoverAnchorEvent,
    ownerIdOverride?: string,
  ) => void
  /** Resolves overlay details and opens them as a root popover. */
  openRootOverlay: (
    overlay: AwakenerOverlayRecord,
    event: DatabasePopoverAnchorEvent,
    rankContext?: DatabasePopoverDescriptionRankContext,
    ownerIdOverride?: string,
  ) => void

  /** Opens a nested popover by name relative to the top-most active element. */
  openNestedReferenceByName: (name: string, event?: EventWithRect) => void
  /** Opens a nested overlay popover relative to the top-most active element. */
  openNestedOverlay: (
    overlay: AwakenerOverlayRecord,
    rankContext?: DatabasePopoverDescriptionRankContext,
    event?: EventWithRect,
  ) => void
  /** Opens a nested reference popover from a specific index in the stack. */
  openNestedInfoFrom: (
    sourceIndex: number,
    entry: KeyedDatabaseReferenceEntry,
    event?: EventWithRect,
  ) => void
  /** Opens a nested named reference popover from a specific index in the stack. */
  openNestedReferenceByNameFrom: (sourceIndex: number, name: string, event?: EventWithRect) => void
  /** Opens a nested overlay popover from a specific index in the stack. */
  openNestedOverlayFrom: (
    sourceIndex: number,
    overlay: AwakenerOverlayRecord,
    rankContext?: DatabasePopoverDescriptionRankContext,
    event?: EventWithRect,
  ) => void
}

/**
 * User-defined type guard to check if a value is a plain object record.
 */
function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

/**
 * Generic helper to filter a record object, retaining only the keys present in the allowed set.
 */
function filterRecord<T>(record: Record<string, T>, allowedKeys: Set<string>): Record<string, T> {
  const nextRecord: Record<string, T> = {}
  const keys = Object.keys(record)
  let changed = false
  for (const key of keys) {
    if (allowedKeys.has(key)) {
      nextRecord[key] = record[key]
    } else {
      changed = true
    }
  }
  return changed ? nextRecord : record
}

/**
 * Returns the combined length of the active floating and trailing popover stacks.
 */
function getEntriesLength(floating: readonly TrailEntry[], trail: readonly TrailEntry[]): number {
  return floating.length + trail.length
}

/**
 * Retrieves a popover entry safely from either the floating or trailing stacks using a unified index.
 * Avoids allocating a new merged array.
 */
function getEntryAtIndex(
  floating: readonly TrailEntry[],
  trail: readonly TrailEntry[],
  index: number,
): TrailEntry | undefined {
  if (index < 0) return undefined
  if (index < floating.length) {
    return floating[index]
  }
  const trailIndex = index - floating.length
  return trail[trailIndex]
}

/**
 * Finds the virtual index of a popover entry by its key within the combined arrays.
 * Avoids allocating a new merged array.
 */
function findEntryIndex(
  floating: readonly TrailEntry[],
  trail: readonly TrailEntry[],
  key: string,
): number {
  const fIndex = floating.findIndex((e) => e.key === key)
  if (fIndex !== -1) return fIndex
  const tIndex = trail.findIndex((e) => e.key === key)
  if (tIndex !== -1) return floating.length + tIndex
  return -1
}

/**
 * Returns true if a popover with the given key is currently active in either stack.
 */
function hasEntryWithKey(
  floating: readonly TrailEntry[],
  trail: readonly TrailEntry[],
  key: string,
): boolean {
  return floating.some((e) => e.key === key) || trail.some((e) => e.key === key)
}

/**
 * Deep equality helper function to verify changes in state values.
 * Supports basic arrays, DOMRects, and plain object records.
 */
const isDeepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true
  }
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false
    }
    return a.every((val, index) => isDeepEqual(val, b[index]))
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return false
  }

  if (a instanceof DOMRect && b instanceof DOMRect) {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  }

  if (isRecord(a) && isRecord(b)) {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) {
      return false
    }
    return keysA.every((k) => isDeepEqual(a[k], b[k]))
  }

  return false
}

/**
 * Retrieves all unique database record/reference IDs active across both stacks.
 */
function getActiveRecordIds(
  floating: readonly TrailEntry[],
  trail: readonly TrailEntry[],
): Set<string> {
  const ids = new Set<string>()
  const addEntry = (e: TrailEntry) => {
    if (e.referenceId) ids.add(e.referenceId)
    if (e.record?.id) ids.add(e.record.id)
    if (e.scalingSourceRecordId) ids.add(e.scalingSourceRecordId)
    ids.add(e.key)
  }
  floating.forEach(addEntry)
  trail.forEach(addEntry)
  return ids
}

/**
 * Calculates the updated z-index render order list, bringing the newly opened popover to the front.
 */
function getNextZIndexOrder(
  zIndexOrder: readonly string[],
  activeKeys: Set<string>,
  newKey: string,
): string[] {
  return [...zIndexOrder.filter((k) => activeKeys.has(k) && k !== newKey), newKey]
}

/**
 * Retrieves all children and descendants spawned by a parent popover.
 * Avoids generating temporary merged arrays where possible.
 */
function getDescendants(
  parentKey: string,
  floating: readonly TrailEntry[],
  trail: readonly TrailEntry[],
): TrailEntry[] {
  const descendants: TrailEntry[] = []
  const queue = [parentKey]
  const visited = new Set<string>([parentKey])
  const floatingKeys = new Set(floating.map((e) => e.key))

  while (queue.length > 0) {
    const current = queue.shift()
    if (current === undefined) {
      break
    }
    const checkEntry = (entry: TrailEntry) => {
      if (entry.parentKey === current && !visited.has(entry.key)) {
        if (floatingKeys.has(entry.key)) {
          return
        }
        visited.add(entry.key)
        descendants.push(entry)
        queue.push(entry.key)
      }
    }
    floating.forEach(checkEntry)
    trail.forEach(checkEntry)
  }
  return descendants
}

/**
 * Focuses a floating popover and drags its children trail to the top z-index.
 */
function bringFloatingToFront(state: PopoverState, key: string): Partial<PopoverState> {
  const descendantEntries = getDescendants(key, state.floating, state.trail)
  const keysToMove = [...descendantEntries.map((e) => e.key), key]
  const nextZIndexOrder = [
    ...state.zIndexOrder.filter((k) => !keysToMove.includes(k)),
    ...keysToMove,
  ]
  const index = state.floating.findIndex((e) => e.key === key)
  let nextFloating = state.floating

  if (index !== -1) {
    const clickedEntry = state.floating[index]
    const floatingDescendants = descendantEntries.filter((e) =>
      state.floating.some((f) => f.key === e.key),
    )
    const floatingKeysToMove = new Set<string>([key])
    for (const desc of floatingDescendants) {
      floatingKeysToMove.add(desc.key)
    }
    nextFloating = [
      ...state.floating.filter((e) => !floatingKeysToMove.has(e.key)),
      clickedEntry,
      ...floatingDescendants,
    ]
  }
  return {
    zIndexOrder: nextZIndexOrder,
    floating: nextFloating,
  }
}

/**
 * Builds a state patch containing cleaned offsets, zIndexOrder,
 * and pinnedStates based on the current active floating and trailing popover keys.
 */
function getCleanupStatePatch(
  floating: readonly TrailEntry[],
  trail: readonly TrailEntry[],
  offsets: Record<string, {x: number; y: number}>,
  zIndexOrder: string[],
  pinnedStates: Record<string, boolean>,
  activeLevels: Record<string, number>,
  nestedHydrationRequestCounters: Record<string, number>,
): Partial<PopoverState> {
  const activeKeys = new Set<string>()
  floating.forEach((e) => activeKeys.add(e.key))
  trail.forEach((e) => activeKeys.add(e.key))

  const nextOffsets = filterRecord(offsets, activeKeys)
  const nextZIndexOrder = zIndexOrder.filter((k) => activeKeys.has(k))
  const nextPinnedStates = filterRecord(pinnedStates, activeKeys)
  const activeRecordIds = getActiveRecordIds(floating, trail)
  const nextActiveLevels = filterRecord(activeLevels, activeRecordIds)
  const nextNestedCounters = filterRecord(nestedHydrationRequestCounters, activeKeys)

  const patch: Partial<PopoverState> = {
    offsets: nextOffsets,
    zIndexOrder: nextZIndexOrder,
    pinnedStates: nextPinnedStates,
    activeLevels: nextActiveLevels,
    nestedHydrationRequestCounters: nextNestedCounters,
  }
  if (floating.length === 0 && trail.length === 0) {
    patch.zIndexOrder = []
    patch.anchorElement = null
    patch.anchorRect = null
  }
  return patch
}

/**
 * Builds a state patch to completely clear the trailing popover stack
 * while keeping floating popovers intact.
 */
function getClearTrailPatch(state: PopoverState): Partial<PopoverState> {
  const floatingKeys = new Set(state.floating.map((e) => e.key))
  const activeRecordIds = getActiveRecordIds(state.floating, [])
  const nextActiveLevels = filterRecord(state.activeLevels, activeRecordIds)
  const nextNestedCounters = filterRecord(state.nestedHydrationRequestCounters, floatingKeys)
  const patch: Partial<PopoverState> = {
    trail: [],
    isFromFloating: false,
    offsets: filterRecord(state.offsets, floatingKeys),
    zIndexOrder: state.zIndexOrder.filter((k) => floatingKeys.has(k)),
    anchorElement: null,
    anchorRect: null,
    activeLevels: nextActiveLevels,
    nestedHydrationRequestCounters: nextNestedCounters,
  }
  if (state.floating.length === 0) {
    patch.zIndexOrder = []
  }
  return patch
}

/**
 * Safely extracts client rect coordinates from events or target event objects.
 */
function getEventRect(event?: EventWithRect): DOMRect | undefined {
  if (event) {
    if ('targetRect' in event) {
      return event.targetRect
    }
    if (
      'currentTarget' in event &&
      typeof event.currentTarget.getBoundingClientRect === 'function'
    ) {
      return event.currentTarget.getBoundingClientRect()
    }
  }
  if (
    typeof document !== 'undefined' &&
    document.activeElement &&
    document.activeElement !== document.body &&
    typeof document.activeElement.getBoundingClientRect === 'function'
  ) {
    return document.activeElement.getBoundingClientRect()
  }
  return undefined
}

/**
 * Pure state updater for spawning/opening a new root popover.
 */
function openRootState(
  state: PopoverState,
  ownerId: string,
  entry: TrailEntry,
): Partial<PopoverState> {
  const hasFloating = state.floating.some((e) => e.key === entry.key)
  if (hasFloating) {
    return bringFloatingToFront(state, entry.key)
  }
  const isSameOwner = state.ownerId === ownerId
  const nextTrail = openTrailRoot(isSameOwner ? [...state.trail] : [], entry)

  const activeKeys = new Set<string>()
  state.floating.forEach((e) => activeKeys.add(e.key))
  nextTrail.forEach((e) => activeKeys.add(e.key))

  return {
    ownerId,
    trail: nextTrail,
    isFromFloating: false,
    offsets: filterRecord(state.offsets, activeKeys),
    zIndexOrder: getNextZIndexOrder(state.zIndexOrder, activeKeys, entry.key),
  }
}

/**
 * Pure state updater for pushing/opening a nested popover.
 */
function pushNestedState(
  state: PopoverState,
  index: number,
  entry: TrailEntry,
): Partial<PopoverState> {
  const hasFloating = state.floating.some((e) => e.key === entry.key)
  if (hasFloating) {
    return bringFloatingToFront(state, entry.key)
  }

  const isFloating = index < state.floating.length
  let nextTrail: TrailEntry[]
  let nextIsFromFloating = state.isFromFloating
  if (isFloating) {
    const floatingEntry = state.floating[index]
    if (floatingEntry.key === entry.key) {
      return {}
    }
    nextTrail = [entry]
    nextIsFromFloating = true
  } else {
    const trailIndex = index - state.floating.length
    const parentEntry = state.trail[trailIndex]
    if (parentEntry.key === entry.key) {
      return {}
    }
    const finalEntry = {...entry}
    if (finalEntry.parentKey === finalEntry.key) {
      finalEntry.parentKey = undefined
    }
    nextTrail = insertTrailEntryAfterIndex([...state.trail], trailIndex, finalEntry)
  }

  const activeKeys = new Set<string>()
  state.floating.forEach((e) => activeKeys.add(e.key))
  nextTrail.forEach((e) => activeKeys.add(e.key))

  return {
    trail: nextTrail,
    isFromFloating: nextIsFromFloating,
    offsets: filterRecord(state.offsets, activeKeys),
    zIndexOrder: getNextZIndexOrder(state.zIndexOrder, activeKeys, entry.key),
  }
}

/**
 * Pure state updater for toggling a popover's pinned vs trailing state.
 */
function togglePinState(state: PopoverState, key: string, rect?: DOMRect): Partial<PopoverState> {
  const floatingIndex = state.floating.findIndex((e) => e.key === key)
  const wasPinned = floatingIndex !== -1
  const nextFloating = [...state.floating]
  const nextTrail = [...state.trail]
  const nextPinnedStates = {...state.pinnedStates}
  const nextOffsets = {...state.offsets}
  let nextZIndexOrder = [...state.zIndexOrder]

  if (!wasPinned) {
    const trailIndex = state.trail.findIndex((e) => e.key === key)
    if (trailIndex !== -1) {
      const entry = state.trail[trailIndex]
      const updatedEntry = {
        ...entry,
        rect: rect ?? entry.rect,
        pinnedLayoutPos: rect ? {top: rect.top, left: rect.left} : undefined,
        parentKey: undefined,
      }
      nextTrail.splice(trailIndex, 1)
      nextFloating.push(updatedEntry)
      nextOffsets[key] = {x: 0, y: 0}
      nextPinnedStates[key] = true
      nextZIndexOrder = [...nextZIndexOrder.filter((k) => k !== key), key]
    }
  } else {
    nextFloating.splice(floatingIndex, 1)
    nextPinnedStates[key] = false
  }

  const cleanupPatch = getCleanupStatePatch(
    nextFloating,
    nextTrail,
    nextOffsets,
    nextZIndexOrder,
    nextPinnedStates,
    state.activeLevels,
    state.nestedHydrationRequestCounters,
  )

  return {
    floating: nextFloating,
    trail: nextTrail,
    ...cleanupPatch,
  }
}

/**
 * Pure state updater for closing popovers starting at a target index.
 */
function closeFromState(state: PopoverState, index: number): Partial<PopoverState> {
  const isFloating = index < state.floating.length
  const nextFloating = [...state.floating]
  let nextTrail = [...state.trail]
  const nextPinnedStates = {...state.pinnedStates}
  let nextIsFromFloating = state.isFromFloating

  if (isFloating) {
    const entry = state.floating[index]
    nextFloating.splice(index, 1)
    nextPinnedStates[entry.key] = false
    if (state.isFromFloating && state.trail.length > 0 && state.trail[0].parentKey === entry.key) {
      nextTrail = []
      nextIsFromFloating = false
    }
  } else {
    const trailIndex = index - state.floating.length
    nextTrail = closeTrailFromIndex([...state.trail], trailIndex)
  }

  const cleanupPatch = getCleanupStatePatch(
    nextFloating,
    nextTrail,
    state.offsets,
    state.zIndexOrder,
    nextPinnedStates,
    state.activeLevels,
    state.nestedHydrationRequestCounters,
  )

  return {
    floating: nextFloating,
    trail: nextTrail,
    isFromFloating: nextIsFromFloating,
    ...cleanupPatch,
  }
}

/**
 * Pure state updater to set the active progression level of a specific record database details.
 */
function updatePopoverLevelState(
  state: PopoverState,
  recordId: string,
  level: number,
): Partial<PopoverState> {
  const updateEntry = (e: TrailEntry) => {
    const match =
      e.referenceId === recordId ||
      e.record?.id === recordId ||
      e.scalingSourceRecordId === recordId ||
      e.key === recordId
    if (match && e.descriptionRank !== level) {
      return {
        ...e,
        descriptionRank: level,
        scalingCurrentLevel: e.scalingLevelStart === 0 ? level - 1 : level,
      }
    }
    return e
  }

  const nextTrail = state.trail.map(updateEntry)
  const trailChanged = nextTrail.some((e, i) => e !== state.trail[i])

  const nextFloating = state.floating.map(updateEntry)
  const floatingChanged = nextFloating.some((e, i) => e !== state.floating[i])

  const nextActiveLevels = {
    ...state.activeLevels,
    [recordId]: level,
  }

  const levelsChanged = state.activeLevels[recordId] !== level

  if (!trailChanged && !floatingChanged && !levelsChanged) {
    return {}
  }

  return {
    activeLevels: nextActiveLevels,
    trail: trailChanged ? nextTrail : state.trail,
    floating: floatingChanged ? nextFloating : state.floating,
  }
}

/**
 * Array of context property keys allowed to be set dynamically.
 */
const CONTEXT_KEYS: (keyof Pick<
  PopoverStateData,
  | 'ownerId'
  | 'referenceLayer'
  | 'formulaContext'
  | 'stats'
  | 'selectedEnlightenSlot'
  | 'currentDescriptionRankContext'
  | 'showTagIcons'
  | 'showVisibleScaling'
>)[] = [
  'ownerId',
  'referenceLayer',
  'formulaContext',
  'stats',
  'selectedEnlightenSlot',
  'currentDescriptionRankContext',
  'showTagIcons',
  'showVisibleScaling',
]

type PopoverStoreSet = StoreApi<PopoverState>['setState']

/**
 * Safely caches the anchoring element and client rect on the store.
 */
function updateAnchorFromEvent(set: PopoverStoreSet, event: DatabasePopoverAnchorEvent): DOMRect {
  const anchorElement = event.currentTarget
  const anchorRect = anchorElement.getBoundingClientRect()
  set({anchorElement, anchorRect})
  return anchorRect
}

/**
 * Orchestrates lazy database preloads and opens the root popover.
 */
function openRootWithHydration(
  get: () => PopoverState,
  set: PopoverStoreSet,
  finalOwnerId: string,
  reference: DatabaseReferenceInfo,
  anchorRect: DOMRect,
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null,
  rankContext?: DatabasePopoverDescriptionRankContext,
  fallbackEntry?: TrailEntry,
) {
  const {formulaContext, stats, openRoot} = get()
  if (needsLazyReferenceHydration(reference)) {
    const hydrationRequest = get().rootHydrationRequestCounter + 1
    set({rootHydrationRequestCounter: hydrationRequest})
    void hydrateGlobalDatabaseReferenceInfo(reference, formulaContext ?? undefined, stats)
      .then((hydratedReference) => {
        if (hydrationRequest !== get().rootHydrationRequestCounter) {
          return
        }
        const entry = buildTrailEntry(hydratedReference, selectedEnlightenSlot)
        const finalEntry = {
          ...withDescriptionRankContext(entry, rankContext),
          rect: anchorRect,
        }
        openRoot(finalOwnerId, finalEntry)
      })
      .catch((err: unknown) => {
        console.error('Failed to hydrate root database reference:', err)
      })
  } else {
    const entry = fallbackEntry ?? buildTrailEntry(reference, selectedEnlightenSlot)
    const finalEntry = {
      ...withDescriptionRankContext(entry, rankContext),
      rect: anchorRect,
    }
    openRoot(finalOwnerId, finalEntry)
  }
}

/**
 * Orchestrates lazy database preloads and inserts a nested popover into the stack.
 */
function openNestedWithHydration(
  get: () => PopoverState,
  set: PopoverStoreSet,
  reference: DatabaseReferenceInfo | null,
  rect: DOMRect | undefined,
  sourceKey: string,
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null,
  rankContext?: DatabasePopoverDescriptionRankContext,
  fallbackEntry?: TrailEntry,
) {
  const {formulaContext, stats, pushNested} = get()
  if (reference && needsLazyReferenceHydration(reference)) {
    const nextCounter = (get().nestedHydrationRequestCounters[sourceKey] ?? 0) + 1
    set((state) => ({
      nestedHydrationRequestCounters: {
        ...state.nestedHydrationRequestCounters,
        [sourceKey]: nextCounter,
      },
    }))

    void hydrateGlobalDatabaseReferenceInfo(reference, formulaContext ?? undefined, stats)
      .then((hydratedReference) => {
        if (nextCounter !== get().nestedHydrationRequestCounters[sourceKey]) {
          return
        }
        const {floating, trail} = get()
        const currentSourceIndex = findEntryIndex(floating, trail, sourceKey)
        if (currentSourceIndex === -1) {
          return
        }
        const currentSource = getEntryAtIndex(floating, trail, currentSourceIndex)
        if (!currentSource) {
          return
        }
        const entry = buildTrailEntry(
          hydratedReference,
          currentSource.selectedEnlightenSlot ?? selectedEnlightenSlot,
          currentSource.referenceLayerOverride ?? null,
        )
        const finalEntry = {
          ...withDescriptionRankContext(entry, rankContext),
          rect: rect ?? currentSource.rect,
          parentKey: sourceKey,
        }
        pushNested(currentSourceIndex, finalEntry)
      })
      .catch((err: unknown) => {
        console.error('Failed to hydrate nested database reference:', err)
      })
  } else {
    const {floating, trail} = get()
    const currentSourceIndex = findEntryIndex(floating, trail, sourceKey)
    if (currentSourceIndex === -1) {
      return
    }
    const currentSource = getEntryAtIndex(floating, trail, currentSourceIndex)
    if (!currentSource) {
      return
    }
    const entry =
      fallbackEntry ??
      (reference
        ? buildTrailEntry(
            reference,
            currentSource.selectedEnlightenSlot ?? selectedEnlightenSlot,
            currentSource.referenceLayerOverride ?? null,
          )
        : null)
    if (!entry) {
      return
    }
    const finalEntry = {
      ...withDescriptionRankContext(entry, rankContext),
      rect: rect ?? currentSource.rect,
      parentKey: sourceKey,
    }
    pushNested(currentSourceIndex, finalEntry)
  }
}

/**
 * Instantiates the vanilla Zustand store equipped with Redux DevTools tracking.
 */
export function createPopoverStore() {
  return createStore<PopoverState>()(
    devtools(
      (set, get) => {
        const actions: PopoverActions = {
          setDatabaseContext: (ctx) => {
            const state = get()
            const nextCtx = {...ctx}
            if (state.trail.length > 0 && 'ownerId' in nextCtx) {
              delete nextCtx.ownerId
            }
            const hasChange = CONTEXT_KEYS.some((k) => {
              if (k in nextCtx) {
                return !isDeepEqual(state[k], nextCtx[k])
              }
              return false
            })
            if (hasChange) {
              set(nextCtx)
            }
          },

          openRoot: (ownerId, entry) => {
            set((state) => openRootState(state, ownerId, entry))
          },

          pushNested: (index, entry) => {
            set((state) => pushNestedState(state, index, entry))
          },

          togglePin: (key, rect) => {
            set((state) => togglePinState(state, key, rect))
          },

          bringToFront: (key) => {
            set((state) => {
              if (!hasEntryWithKey(state.floating, state.trail, key)) {
                return {}
              }
              return bringFloatingToFront(state, key)
            })
          },

          closeFrom: (index) => {
            set((state) => closeFromState(state, index))
          },

          updateOffset: (key, x, y) => {
            set((state) => ({
              offsets: {
                ...state.offsets,
                [key]: {x, y},
              },
            }))
          },

          clear: () => {
            set({
              ownerId: null,
              trail: [],
              floating: [],
              offsets: {},
              pinnedStates: {},
              activeLevels: {},
              isFromFloating: false,
              zIndexOrder: [],
              rootHydrationRequestCounter: 0,
              nestedHydrationRequestCounters: {},
              anchorElement: null,
              anchorRect: null,
            })
          },

          clearTrail: () => {
            set((state) => getClearTrailPatch(state))
          },

          clearTrailOnly: () => {
            set((state) => getClearTrailPatch(state))
          },

          updatePopoverLevel: (recordId, level) => {
            set((state) => updatePopoverLevelState(state, recordId, level))
          },

          openRootInfo: (entry, event, ownerIdOverride) => {
            event.stopPropagation()
            const {ownerId, openRoot} = get()
            const finalOwnerId = ownerIdOverride ?? ownerId
            if (!finalOwnerId) {
              return
            }
            const anchorRect = updateAnchorFromEvent(set, event)
            const entryWithRect = {
              ...entry,
              rect: anchorRect,
            }
            openRoot(finalOwnerId, entryWithRect)
          },

          openRootReferenceByName: (name, event, ownerIdOverride) => {
            event.stopPropagation()
            const {referenceLayer, selectedEnlightenSlot, ownerId} = get()
            const finalOwnerId = ownerIdOverride ?? ownerId
            if (!finalOwnerId || !referenceLayer) {
              return
            }
            const reference = resolveReferenceByName(referenceLayer, name)
            if (!reference) {
              return
            }
            const anchorRect = updateAnchorFromEvent(set, event)
            openRootWithHydration(
              get,
              set,
              finalOwnerId,
              reference,
              anchorRect,
              selectedEnlightenSlot,
            )
          },

          openRootOverlay: (overlay, event, rankContext, ownerIdOverride) => {
            event.stopPropagation()
            const {referenceLayer, selectedEnlightenSlot, ownerId} = get()
            const finalOwnerId = ownerIdOverride ?? ownerId
            if (!finalOwnerId || !referenceLayer) {
              return
            }
            const reference = resolveOverlayReference(referenceLayer, overlay)
            const anchorRect = updateAnchorFromEvent(set, event)
            if (!reference) {
              const entry = buildOverlayFallbackEntry(overlay, null, rankContext)
              const finalEntry = {
                ...entry,
                rect: anchorRect,
              }
              get().openRoot(finalOwnerId, finalEntry)
            } else {
              const entry = buildOverlayEntry({
                overlay,
                rankContext,
                referenceLayer,
                selectedEnlightenSlot,
              })
              openRootWithHydration(
                get,
                set,
                finalOwnerId,
                reference,
                anchorRect,
                selectedEnlightenSlot,
                rankContext,
                entry,
              )
            }
          },

          openNestedReferenceByName: (name, event) => {
            const {trail, floating, openNestedReferenceByNameFrom} = get()
            const sourceIndex = getEntriesLength(floating, trail) - 1
            if (sourceIndex >= 0) {
              openNestedReferenceByNameFrom(sourceIndex, name, event)
            }
          },

          openNestedOverlay: (overlay, rankContext, event) => {
            const {trail, floating, openNestedOverlayFrom} = get()
            const sourceIndex = getEntriesLength(floating, trail) - 1
            if (sourceIndex >= 0) {
              openNestedOverlayFrom(sourceIndex, overlay, rankContext, event)
            }
          },

          openNestedInfoFrom: (sourceIndex, entry, event) => {
            const {trail, floating, pushNested} = get()
            const sourceEntry = getEntryAtIndex(floating, trail, sourceIndex)
            if (!sourceEntry) {
              return
            }
            const rect = getEventRect(event)
            const finalEntry = {
              ...withInheritedReferenceLayerOverride(entry, sourceEntry),
              rect,
              parentKey: sourceEntry.key,
            }
            pushNested(sourceIndex, finalEntry)
          },

          openNestedReferenceByNameFrom: (sourceIndex, name, event) => {
            const {trail, floating, referenceLayer, selectedEnlightenSlot} = get()
            const sourceEntry = getEntryAtIndex(floating, trail, sourceIndex)
            if (!sourceEntry) {
              return
            }
            const sourceLayer = sourceEntry.referenceLayerOverride ?? referenceLayer
            const reference = resolveReferenceByName(sourceLayer, name)
            if (!reference) {
              return
            }
            const rect = getEventRect(event)
            openNestedWithHydration(
              get,
              set,
              reference,
              rect,
              sourceEntry.key,
              selectedEnlightenSlot,
            )
          },

          openNestedOverlayFrom: (sourceIndex, overlay, rankContext, event) => {
            const {trail, floating, referenceLayer, selectedEnlightenSlot} = get()
            const sourceEntry = getEntryAtIndex(floating, trail, sourceIndex)
            if (!sourceEntry) {
              return
            }
            const sourceLayer = sourceEntry.referenceLayerOverride ?? referenceLayer
            const reference = resolveOverlayReference(sourceLayer, overlay)
            const rect = getEventRect(event)
            const fallbackEntry = buildOverlayEntry({
              overlay,
              rankContext,
              referenceLayer,
              referenceLayerOverride: sourceEntry.referenceLayerOverride ?? null,
              selectedEnlightenSlot,
            })
            openNestedWithHydration(
              get,
              set,
              reference,
              rect,
              sourceEntry.key,
              selectedEnlightenSlot,
              rankContext,
              fallbackEntry,
            )
          },
        }

        const {setDatabaseContext: _, ...remainingActions} = actions

        return {
          ownerId: null,
          trail: [],
          floating: [],
          offsets: {},
          pinnedStates: {},
          activeLevels: {},
          isFromFloating: false,
          zIndexOrder: [],
          rootHydrationRequestCounter: 0,
          nestedHydrationRequestCounters: {},
          anchorElement: null,
          anchorRect: null,

          referenceLayer: null,
          formulaContext: null,
          stats: null,
          selectedEnlightenSlot: null,
          currentDescriptionRankContext: null,
          showTagIcons: true,
          showVisibleScaling: true,

          ...actions,
          actions: remainingActions,
        }
      },
      {name: 'PopoverStore'},
    ),
  )
}

export const PopoverStoreContext = createContext<StoreApi<PopoverState> | null>(null)

export interface PopoverProviderProps {
  children: ReactNode
}

/**
 * Provider component to instantiate and inject the Popover state store.
 */
export function PopoverProvider({children}: PopoverProviderProps) {
  const [store] = useState(() => createPopoverStore())
  return createElement(PopoverStoreContext.Provider, {value: store}, children)
}

const dummyStore = createPopoverStore()

/**
 * Custom selector hook for direct access to Zustand Popover Store.
 */
export function usePopoverStore<T>(selector: (state: PopoverState) => T): T {
  const store = useContext(PopoverStoreContext) ?? dummyStore
  return useStore(store, selector)
}

/**
 * Hook to retrieve the active trailing popover entries stack.
 */
export const usePopoverTrail = () => usePopoverStore((state) => state.trail)

/**
 * Hook to retrieve the active floating popover entries list.
 */
export const usePopoverFloating = () => usePopoverStore((state) => state.floating)

/**
 * Hook to retrieve coordinate offsets of all active popovers.
 */
export const usePopoverOffsets = () => usePopoverStore((state) => state.offsets)

/**
 * Hook to retrieve the pinning state of a specific popover.
 */
export const useIsPopoverPinned = (key: string) =>
  usePopoverStore((state) => state.pinnedStates[key] ?? false)

/**
 * Hook to retrieve a popover entry (either trailing or floating) by its unique key ID.
 */
export const usePopoverEntry = (id: string) =>
  usePopoverStore(
    (state) => state.floating.find((e) => e.key === id) ?? state.trail.find((e) => e.key === id),
  )

/**
 * Hook to retrieve the z-index stack position of a popover.
 */
export const usePopoverZIndex = (id: string) =>
  usePopoverStore((state) => state.zIndexOrder.indexOf(id))

/**
 * Hook to verify if a popover is currently focused and at the top of the z-index stack.
 */
export const useIsPopoverTopMost = (id: string) =>
  usePopoverStore(
    (state) =>
      state.zIndexOrder.length > 0 && state.zIndexOrder[state.zIndexOrder.length - 1] === id,
  )

const DEFAULT_OFFSET = {x: 0, y: 0}

/**
 * Hook to retrieve the coordinate offset of a popover.
 */
export const usePopoverOffset = (id: string) =>
  usePopoverStore((state) => state.offsets[id] ?? DEFAULT_OFFSET)

/**
 * Hook to retrieve the current public formula context.
 */
export const usePopoverFormulaContext = () => usePopoverStore((state) => state.formulaContext)

/**
 * Hook to retrieve the current full stats.
 */
export const usePopoverStats = () => usePopoverStore((state) => state.stats)

/**
 * Hook to retrieve the visibility toggle of scaling math breakdowns.
 */
export const usePopoverShowVisibleScaling = () =>
  usePopoverStore((state) => state.showVisibleScaling)

/**
 * Hook to retrieve the visibility toggle of tag icons.
 */
export const usePopoverShowTagIcons = () => usePopoverStore((state) => state.showTagIcons)

/**
 * Hook to retrieve the active resolved reference layer.
 */
export const usePopoverReferenceLayer = () => usePopoverStore((state) => state.referenceLayer)

export const usePopoverActions = (): Omit<PopoverActions, 'setDatabaseContext'> => {
  const store = useContext(PopoverStoreContext) ?? dummyStore
  return useMemo(() => store.getState().actions, [store])
}
