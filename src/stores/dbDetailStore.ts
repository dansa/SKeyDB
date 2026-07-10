import {createStore} from 'zustand/vanilla'

import type {EntityRef} from '@/domain/entities/types'

const DB_DETAIL_ENTITY_KINDS = ['awakener', 'covenant', 'posse', 'relic', 'wheel'] as const

export type DbDetailEntityKind = (typeof DB_DETAIL_ENTITY_KINDS)[number]
export type DbDetailEntityRef = EntityRef & {kind: DbDetailEntityKind}
export type DbDetailRouteSource = 'database-route'
export type DbDetailOverlaySource = 'builder-overlay' | 'collection-overlay' | 'timeline-overlay'
export type DbDetailReferenceSource = 'reference'
export type DbDetailSource = DbDetailRouteSource | DbDetailOverlaySource | DbDetailReferenceSource

const dbDetailEntityKindSet = new Set<EntityRef['kind']>(DB_DETAIL_ENTITY_KINDS)

export function isDbDetailEntityRef(ref: EntityRef): ref is DbDetailEntityRef {
  return dbDetailEntityKindSet.has(ref.kind)
}

export interface DbDetailStackEntry extends DbDetailEntityRef {
  source: DbDetailSource
}

export interface DbDetailState {
  stack: DbDetailStackEntry[]
  openDetail: (ref: EntityRef, source: DbDetailOverlaySource) => void
  replaceRouteDetail: (ref: EntityRef) => void
  pushReferenceDetail: (ref: EntityRef) => void
  popDetail: () => void
  closeAllDetails: () => void
  syncFromRoute: (ref: EntityRef | null) => void
}

function stackEntry(ref: EntityRef, source: DbDetailSource): DbDetailStackEntry | null {
  return isDbDetailEntityRef(ref) ? {...ref, source} : null
}

function withoutRouteEntries(stack: DbDetailStackEntry[]): DbDetailStackEntry[] {
  return stack.filter((entry) => entry.source !== 'database-route')
}

export function createDbDetailStore() {
  return createStore<DbDetailState>()((set) => ({
    stack: [],
    openDetail: (ref, source) => {
      const entry = stackEntry(ref, source)
      if (!entry) {
        return
      }
      set((state) => ({
        stack: [...state.stack, entry],
      }))
    },
    replaceRouteDetail: (ref) => {
      const entry = stackEntry(ref, 'database-route')
      if (!entry) {
        return
      }
      set((state) => ({
        stack: [entry, ...withoutRouteEntries(state.stack)],
      }))
    },
    pushReferenceDetail: (ref) => {
      const entry = stackEntry(ref, 'reference')
      if (!entry) {
        return
      }
      set((state) => ({
        stack: [...state.stack, entry],
      }))
    },
    popDetail: () => {
      set((state) => ({
        stack: state.stack.slice(0, -1),
      }))
    },
    closeAllDetails: () => {
      set({stack: []})
    },
    syncFromRoute: (ref) => {
      const entry = ref ? stackEntry(ref, 'database-route') : null
      set((state) => ({
        stack: entry
          ? [entry, ...withoutRouteEntries(state.stack)]
          : withoutRouteEntries(state.stack),
      }))
    },
  }))
}

export const dbDetailStore = createDbDetailStore()
