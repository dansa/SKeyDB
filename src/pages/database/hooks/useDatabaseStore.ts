import {produce} from 'immer'
import {create} from 'zustand'

import type {CollectionSortDirection} from '@/domain/collection-sorting'
import type {DatabaseSortKey} from '@/domain/database-sorting'

export type RealmFilterId = 'ALL' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
export type RarityFilterId = 'ALL' | 'Genesis' | 'SSR' | 'SR'
export type TypeFilterId = 'ALL' | 'ASSAULT' | 'WARDEN' | 'CHORUS'

export const DATABASE_SORT_OPTIONS: readonly DatabaseSortKey[] = [
  'ALPHABETICAL',
  'RARITY',
  'ATK',
  'DEF',
  'CON',
]

interface DatabaseStoreState {
  query: string
  realmFilter: RealmFilterId
  rarityFilter: RarityFilterId
  typeFilter: TypeFilterId
  sortKey: DatabaseSortKey
  sortDirection: CollectionSortDirection
  groupByRealm: boolean
}

interface DatabaseStoreActions {
  setQuery: (next: string) => void
  appendSearchCharacter: (key: string) => void
  clearQuery: () => void
  setRealmFilter: (filter: RealmFilterId) => void
  setRarityFilter: (filter: RarityFilterId) => void
  setTypeFilter: (filter: TypeFilterId) => void
  setSortKey: (key: DatabaseSortKey) => void
  toggleSortDirection: () => void
  setGroupByRealm: (next: boolean) => void
  reset: () => void
}

export type DatabaseStore = DatabaseStoreState & DatabaseStoreActions

const INITIAL_DATABASE_STORE_STATE: DatabaseStoreState = {
  query: '',
  realmFilter: 'ALL',
  rarityFilter: 'ALL',
  typeFilter: 'ALL',
  sortKey: 'ALPHABETICAL',
  sortDirection: 'ASC',
  groupByRealm: false,
}

function updateDatabaseStore(
  set: (
    partial: Partial<DatabaseStore> | ((state: DatabaseStore) => Partial<DatabaseStore>),
  ) => void,
  recipe: (draft: DatabaseStoreState) => void,
): void {
  set(
    produce((state: DatabaseStore) => {
      recipe(state)
    }),
  )
}

function createDatabaseStoreActions(
  set: (
    partial: Partial<DatabaseStore> | ((state: DatabaseStore) => Partial<DatabaseStore>),
  ) => void,
): DatabaseStoreActions {
  return {
    setQuery: (next) => {
      updateDatabaseStore(set, (draft) => {
        draft.query = next
      })
    },
    appendSearchCharacter: (key) => {
      updateDatabaseStore(set, (draft) => {
        draft.query = draft.query + key
      })
    },
    clearQuery: () => {
      updateDatabaseStore(set, (draft) => {
        draft.query = ''
      })
    },
    setRealmFilter: (filter) => {
      updateDatabaseStore(set, (draft) => {
        draft.realmFilter = filter
      })
    },
    setRarityFilter: (filter) => {
      updateDatabaseStore(set, (draft) => {
        draft.rarityFilter = filter
      })
    },
    setTypeFilter: (filter) => {
      updateDatabaseStore(set, (draft) => {
        draft.typeFilter = filter
      })
    },
    setSortKey: (key) => {
      updateDatabaseStore(set, (draft) => {
        draft.sortKey = key
      })
    },
    toggleSortDirection: () => {
      updateDatabaseStore(set, (draft) => {
        draft.sortDirection = draft.sortDirection === 'ASC' ? 'DESC' : 'ASC'
      })
    },
    setGroupByRealm: (next) => {
      updateDatabaseStore(set, (draft) => {
        draft.groupByRealm = next
      })
    },
    reset: () => {
      updateDatabaseStore(set, (draft) => {
        Object.assign(draft, INITIAL_DATABASE_STORE_STATE)
      })
    },
  }
}

export const useDatabaseStore = create<DatabaseStore>()((set) => ({
  ...INITIAL_DATABASE_STORE_STATE,
  ...createDatabaseStoreActions(set),
}))

export function resetDatabaseStore(): void {
  useDatabaseStore.getState().reset()
}
