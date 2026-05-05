import {createStore} from 'zustand/vanilla'

import type {EntityRef} from '@/domain/entities/types'

export type DbDetailRouteSource = 'database-route'
export type DbDetailOverlaySource = 'builder-overlay' | 'collection-overlay'
export type DbDetailReferenceSource = 'reference'
export type DbDetailSource = DbDetailRouteSource | DbDetailOverlaySource | DbDetailReferenceSource

export interface DbDetailStackEntry extends EntityRef {
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

function routeEntry(ref: EntityRef): DbDetailStackEntry {
  return {...ref, source: 'database-route'}
}

function withoutRouteEntries(stack: DbDetailStackEntry[]): DbDetailStackEntry[] {
  return stack.filter((entry) => entry.source !== 'database-route')
}

export function createDbDetailStore() {
  return createStore<DbDetailState>()((set) => ({
    stack: [],
    openDetail: (ref, source) => {
      set((state) => ({
        stack: [...state.stack, {...ref, source}],
      }))
    },
    replaceRouteDetail: (ref) => {
      set((state) => ({
        stack: [routeEntry(ref), ...withoutRouteEntries(state.stack)],
      }))
    },
    pushReferenceDetail: (ref) => {
      set((state) => ({
        stack: [...state.stack, {...ref, source: 'reference'}],
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
      set((state) => ({
        stack: ref
          ? [routeEntry(ref), ...withoutRouteEntries(state.stack)]
          : withoutRouteEntries(state.stack),
      }))
    },
  }))
}

export const dbDetailStore = createDbDetailStore()
