import {createStore} from 'zustand/vanilla'

import {
  clearOwnedEntry,
  createDefaultCollectionOwnershipCatalog,
  getOwnedLevel,
  normalizeCollectionOwnershipState,
  setAwakenerLevel as setDomainAwakenerLevel,
  setDisplayUnowned as setDomainDisplayUnowned,
  setOwnedLevel as setDomainOwnedLevel,
  type CollectionOwnershipCatalog,
  type CollectionOwnershipKind,
  type CollectionOwnershipState,
} from '@/domain/collection-ownership'
import {safeStorageRead, type StorageLike} from '@/domain/storage'
import {
  COLLECTION_OWNERSHIP_KEY,
  COLLECTION_OWNERSHIP_LEGACY_KEY,
  parseCollectionOwnershipSnapshot,
  saveCollectionOwnership,
  serializeCollectionOwnershipSnapshot,
  type ParseCollectionOwnershipSnapshotResult,
} from '@/features/collection/collectionMigrations'

export type CollectionOwnershipPersistenceStatus = 'idle' | 'ready' | 'blocked'

export interface CollectionOwnershipStoreState {
  ownership: CollectionOwnershipState
  persistenceStatus: CollectionOwnershipPersistenceStatus
  hydrate: () => void
  save: () => boolean
  importSnapshot: (rawSnapshot: string) => ParseCollectionOwnershipSnapshotResult
  exportSnapshot: () => string
  replaceOwnership: (ownership: CollectionOwnershipState) => void
  updateOwnership: (
    updater: (ownership: CollectionOwnershipState) => CollectionOwnershipState,
  ) => void
  toggleOwned: (kind: CollectionOwnershipKind, id: string) => void
  setOwnedLevel: (kind: CollectionOwnershipKind, id: string, level: number) => void
  clearOwned: (kind: CollectionOwnershipKind, id: string) => void
  setAwakenerLevel: (id: string, level: number) => void
  setDisplayUnowned: (displayUnowned: boolean) => void
}

interface CreateCollectionOwnershipStoreOptions {
  catalog?: CollectionOwnershipCatalog
  storage?: StorageLike | null
}

function loadHydratedOwnership(
  storage: StorageLike | null,
  catalog: CollectionOwnershipCatalog,
): Pick<CollectionOwnershipStoreState, 'ownership' | 'persistenceStatus'> {
  const rawSnapshot = safeStorageRead(storage, COLLECTION_OWNERSHIP_KEY)
  if (rawSnapshot !== null) {
    const parsed = parseCollectionOwnershipSnapshot(rawSnapshot, catalog)
    return parsed.ok
      ? {ownership: parsed.state, persistenceStatus: 'ready'}
      : {ownership: normalizeCollectionOwnershipState(null, catalog), persistenceStatus: 'blocked'}
  }

  const legacyRawSnapshot = safeStorageRead(storage, COLLECTION_OWNERSHIP_LEGACY_KEY)
  if (legacyRawSnapshot !== null) {
    const parsed = parseCollectionOwnershipSnapshot(legacyRawSnapshot, catalog)
    if (parsed.ok) {
      saveCollectionOwnership(storage, parsed.state, catalog)
      return {ownership: parsed.state, persistenceStatus: 'ready'}
    }
  }

  return {ownership: normalizeCollectionOwnershipState(null, catalog), persistenceStatus: 'ready'}
}

export function createCollectionOwnershipStore({
  catalog = createDefaultCollectionOwnershipCatalog(),
  storage = null,
}: CreateCollectionOwnershipStoreOptions = {}) {
  const initialOwnership = normalizeCollectionOwnershipState(null, catalog)
  const rememberedLevels: Record<CollectionOwnershipKind, Record<string, number>> = {
    awakeners: {},
    wheels: {},
    posses: {},
  }

  return createStore<CollectionOwnershipStoreState>()((set, get) => ({
    ownership: initialOwnership,
    persistenceStatus: 'idle',
    hydrate: () => {
      set(loadHydratedOwnership(storage, catalog))
    },
    save: () => {
      if (get().persistenceStatus === 'blocked') {
        return false
      }
      const saved = saveCollectionOwnership(storage, get().ownership, catalog)
      if (saved && get().persistenceStatus !== 'ready') {
        set({persistenceStatus: 'ready'})
      }
      return saved
    },
    importSnapshot: (rawSnapshot) => {
      const parsed = parseCollectionOwnershipSnapshot(rawSnapshot, catalog)
      if (!parsed.ok) {
        return parsed
      }
      set({ownership: parsed.state, persistenceStatus: 'ready'})
      get().save()
      set({ownership: parsed.state, persistenceStatus: 'ready'})
      return parsed
    },
    exportSnapshot: () => serializeCollectionOwnershipSnapshot(get().ownership, catalog),
    replaceOwnership: (ownership) => {
      set({ownership: normalizeCollectionOwnershipState(ownership, catalog)})
    },
    updateOwnership: (updater) => {
      set((state) => ({
        ownership: normalizeCollectionOwnershipState(updater(state.ownership), catalog),
      }))
    },
    toggleOwned: (kind, id) => {
      set((state) => {
        const currentLevel = getOwnedLevel(state.ownership, kind, id)
        if (currentLevel !== null) {
          rememberedLevels[kind][id] = currentLevel
        }
        return {
          ownership:
            currentLevel === null
              ? setDomainOwnedLevel(
                  state.ownership,
                  kind,
                  id,
                  rememberedLevels[kind][id] ?? 0,
                  catalog,
                )
              : clearOwnedEntry(state.ownership, kind, id, catalog),
        }
      })
    },
    setOwnedLevel: (kind, id, level) => {
      set((state) => ({
        ownership: setDomainOwnedLevel(state.ownership, kind, id, level, catalog),
      }))
    },
    clearOwned: (kind, id) => {
      set((state) => ({
        ownership: clearOwnedEntry(state.ownership, kind, id, catalog),
      }))
    },
    setAwakenerLevel: (id, level) => {
      set((state) => ({
        ownership: setDomainAwakenerLevel(state.ownership, id, level, catalog),
      }))
    },
    setDisplayUnowned: (displayUnowned) => {
      set((state) => ({
        ownership: setDomainDisplayUnowned(state.ownership, displayUnowned),
      }))
    },
  }))
}

export const collectionOwnershipStore = createCollectionOwnershipStore({
  storage: typeof window === 'undefined' ? null : window.localStorage,
})
