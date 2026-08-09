import {createStore} from 'zustand/vanilla'

import {
  DATABASE_ENTITY_DEFINITIONS,
  type DatabaseDetailKind,
} from '@/domain/database-entity-definitions'
import type {EntityRef} from '@/domain/entities/types'

export type DbDetailEntityRef = EntityRef & {kind: DatabaseDetailKind}

const dbDetailEntityKindSet = new Set<EntityRef['kind']>(
  DATABASE_ENTITY_DEFINITIONS.map(({detailKind}) => detailKind),
)

export function isDbDetailEntityRef(ref: EntityRef): ref is DbDetailEntityRef {
  return dbDetailEntityKindSet.has(ref.kind)
}

interface DbDetailOverlayBranchState {
  frames: DbDetailEntityRef[]
}

interface DbDetailOverlayBranchStore extends DbDetailOverlayBranchState {
  clear: () => void
  close: () => void
  followReference: (ref: EntityRef) => void
  open: (ref: EntityRef) => void
}

export interface DatabaseDetailOverlaySession {
  /** Close the active frame, revealing its parent reference frame when present. */
  close: () => void
  /** @internal Clears this owner's full branch when its owner is disposed. */
  dispose: () => void
  /** Add a detail reached from the active detail to this owner's branch. */
  followReference: (ref: EntityRef) => void
  /** Whether this owner's branch currently has an active detail. */
  isOpen: () => boolean
  /** Start or replace this owner's overlay branch. */
  open: (ref: EntityRef) => void
  /** @internal Used by the overlay outlet; callers should treat the session as opaque. */
  subscribe: (listener: () => void) => () => void
  /** @internal Used by the overlay outlet; callers should treat the session as opaque. */
  top: () => DbDetailEntityRef | null
}

function toDetailRef(ref: EntityRef): DbDetailEntityRef | null {
  return isDbDetailEntityRef(ref) ? {kind: ref.kind, id: ref.id} : null
}

/**
 * Creates one isolated overlay branch. Reference frames can only be added through this
 * session, so they can never be attributed by their position in a process-wide stack.
 */
export function createDatabaseDetailOverlaySession(): DatabaseDetailOverlaySession {
  const store = createStore<DbDetailOverlayBranchStore>()((set) => ({
    frames: [],
    clear: () => {
      set({frames: []})
    },
    close: () => {
      set((state) => ({frames: state.frames.slice(0, -1)}))
    },
    followReference: (ref) => {
      const detailRef = toDetailRef(ref)
      if (!detailRef) return

      set((state) => (state.frames.length > 0 ? {frames: [...state.frames, detailRef]} : state))
    },
    open: (ref) => {
      const detailRef = toDetailRef(ref)
      if (!detailRef) return

      set({frames: [detailRef]})
    },
  }))

  return Object.freeze({
    close: store.getState().close,
    dispose: store.getState().clear,
    followReference: store.getState().followReference,
    isOpen: () => store.getState().frames.length > 0,
    open: store.getState().open,
    subscribe: store.subscribe,
    top: () => store.getState().frames.at(-1) ?? null,
  })
}
