import {produce} from 'immer'
import {create} from 'zustand'

import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'
import {
  closeTrailFromIndex,
  closeTrailTop,
  decideTrailDirection,
  openTrailRoot,
  pushTrailEntry,
  type TrailEntry,
} from '@/pages/database/utils/popover-trail'

export interface PopoverRenderContext {
  fullData: AwakenerFull | null
  cardNames: Set<string>
  skillLevel: number
  stats: AwakenerFullStats | null
  onNavigateToCards?: (targetName?: string) => void
}

export interface PopoverState {
  trail: TrailEntry[]
  floating: TrailEntry[]
  anchorElement: HTMLElement | null
  anchorRect: DOMRect | null
  isFromFloating: boolean
  offsets: Record<string, {x: number; y: number}>
  pinnedKeys: Record<string, boolean>
  renderContext: PopoverRenderContext | null
  ownerId: string | null
}

export interface PopoverActions {
  openRoot: (
    entry: TrailEntry,
    element: HTMLElement,
    rect: DOMRect,
    context: PopoverRenderContext,
    ownerId: string,
  ) => void
  pushNested: (entry: TrailEntry, sourceIndex: number, sourceIsFloating?: boolean) => void
  pop: () => void
  closeFrom: (index: number) => void
  clear: () => void
  clearActiveTrail: () => void
  updateOffset: (key: string, x: number, y: number) => void
  togglePin: (key: string) => void
  removeFloating: (key: string) => void
  updateRenderContext: (context: PopoverRenderContext, ownerId: string) => void
}

export const usePopoverStore = create<PopoverState & PopoverActions>((set) => ({
  trail: [],
  floating: [],
  anchorElement: null,
  anchorRect: null,
  isFromFloating: false,
  offsets: {},
  pinnedKeys: {},
  renderContext: null,
  ownerId: null,

  openRoot: (entry, element, rect, context, ownerId) => {
    set(
      produce((state: PopoverState) => {
        const floatingIndex = state.floating.findIndex((e) => e.key === entry.key)
        if (floatingIndex !== -1) {
          const [existing] = state.floating.splice(floatingIndex, 1)
          state.floating.push(existing)
          state.trail = []
          state.anchorElement = element
          state.anchorRect = rect
          state.isFromFloating = false
          state.renderContext = context
          state.ownerId = ownerId
          return
        }

        const direction = decideTrailDirection(rect, window.innerHeight)

        const rootEntry = {
          ...entry,
          rect,
          anchorElement: element,
          direction,
        }

        state.trail = openTrailRoot([], rootEntry)
        state.anchorElement = element
        state.anchorRect = rect
        state.isFromFloating = false
        state.renderContext = context
        state.ownerId = ownerId
      }),
    )
  },

  updateRenderContext: (context, ownerId) => {
    set((state) => {
      if (state.trail.length > 0 && state.ownerId !== ownerId) return state
      return {renderContext: context, ownerId}
    })
  },

  pushNested: (entry, sourceIndex, sourceIsFloating) => {
    set(
      produce((state: PopoverState) => {
        const floatingIndex = state.floating.findIndex((e) => e.key === entry.key)
        if (floatingIndex !== -1) {
          const [existing] = state.floating.splice(floatingIndex, 1)
          state.floating.push(existing)
          return
        }

        if (state.pinnedKeys[entry.key]) {
          const fIdx = state.floating.findIndex((e) => e.key === entry.key)
          if (fIdx !== -1) {
            const [existing] = state.floating.splice(fIdx, 1)
            state.floating.push(existing)
            return
          }
        }

        if (sourceIsFloating) {
          const direction = decideTrailDirection(
            entry.rect ?? ({top: 0, bottom: 0} as DOMRect),
            window.innerHeight,
          )
          const rootEntry = {...entry, direction}

          state.trail = openTrailRoot([], rootEntry)
          state.anchorElement = entry.anchorElement ?? null
          state.anchorRect = entry.rect ?? null
          state.isFromFloating = true
        } else {
          const trailDirection = state.trail[0]?.direction ?? 'down'
          const nestedEntry = {...entry, direction: trailDirection}
          state.trail = pushTrailEntry(state.trail.slice(0, sourceIndex + 1), nestedEntry)
        }

        const activeKeys = new Set([
          ...state.trail.map((e) => e.key),
          ...state.floating.map((e) => e.key),
        ])

        for (const key of Object.keys(state.pinnedKeys)) {
          if (!activeKeys.has(key)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete state.pinnedKeys[key]
          }
        }
      }),
    )
  },

  pop: () => {
    set(
      produce((state: PopoverState) => {
        if (state.trail.length === 0) return
        const entry = state.trail[state.trail.length - 1]

        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete state.offsets[entry.key]
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete state.pinnedKeys[entry.key]

        state.trail = closeTrailTop(state.trail)
        if (state.trail.length === 0 && state.floating.length === 0) {
          state.anchorElement = null
          state.anchorRect = null
          state.isFromFloating = false
          state.offsets = {}
          state.pinnedKeys = {}
          state.renderContext = null
        }
      }),
    )
  },

  closeFrom: (index) => {
    set(
      produce((state: PopoverState) => {
        const removed = state.trail.slice(index)
        removed.forEach((entry) => {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete state.offsets[entry.key]
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete state.pinnedKeys[entry.key]
        })
        state.trail = closeTrailFromIndex(state.trail, index)
        if (state.trail.length === 0 && state.floating.length === 0) {
          state.anchorElement = null
          state.anchorRect = null
          state.isFromFloating = false
          state.offsets = {}
          state.pinnedKeys = {}
          state.renderContext = null
        }
      }),
    )
  },

  clear: () => {
    set({
      trail: [],
      floating: [],
      anchorElement: null,
      anchorRect: null,
      isFromFloating: false,
      offsets: {},
      pinnedKeys: {},
      renderContext: null,
    })
  },

  clearActiveTrail: () => {
    set(
      produce((state: PopoverState) => {
        state.trail = []
        state.anchorElement = null
        state.anchorRect = null
        state.isFromFloating = false
        state.ownerId = null

        const activeKeys = new Set(state.floating.map((e) => e.key))
        for (const key of Object.keys(state.pinnedKeys)) {
          if (!activeKeys.has(key)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete state.pinnedKeys[key]
          }
        }
        for (const key of Object.keys(state.offsets)) {
          if (!activeKeys.has(key)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete state.offsets[key]
          }
        }

        if (state.floating.length === 0) {
          state.renderContext = null
        }
      }),
    )
  },

  updateOffset: (key: string, x: number, y: number) => {
    set(
      produce((state: PopoverState) => {
        state.offsets[key] = {x, y}
      }),
    )
  },

  togglePin: (key: string) => {
    set(
      produce((state: PopoverState) => {
        if (state.pinnedKeys[key]) {
          state.floating = state.floating.filter((e) => e.key !== key)

          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete state.pinnedKeys[key]

          if (state.trail.length === 0 && state.floating.length === 0) {
            state.anchorElement = null
            state.anchorRect = null
            state.isFromFloating = false
            state.offsets = {}
            state.pinnedKeys = {}
            state.renderContext = null
          }
        } else {
          const entryIndex = state.trail.findIndex((e) => e.key === key)
          if (entryIndex !== -1) {
            const entry = state.trail[entryIndex]

            if (entryIndex === 0 && state.anchorRect) {
              entry.rect = state.anchorRect
            }

            state.floating.push(entry)
            state.trail = state.trail.filter((e) => e.key !== key)
            state.pinnedKeys[key] = true

            if (entryIndex === 0 && state.trail.length > 0) {
              const nextEntry = state.trail[0]
              state.anchorRect = nextEntry.rect ?? null
              state.anchorElement = nextEntry.anchorElement ?? null
              state.isFromFloating = true
            }
          }
        }
      }),
    )
  },

  removeFloating: (key: string) => {
    set(
      produce((state: PopoverState) => {
        state.floating = state.floating.filter((e) => e.key !== key)

        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete state.pinnedKeys[key]

        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete state.offsets[key]

        if (state.trail.length === 0 && state.floating.length === 0) {
          state.anchorElement = null
          state.anchorRect = null
          state.isFromFloating = false
          state.offsets = {}
          state.pinnedKeys = {}
          state.renderContext = null
        }
      }),
    )
  },
}))
