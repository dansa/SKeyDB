import {useCallback, useMemo, useState} from 'react'

import {getAwakeners, type Awakener} from '@/domain/awakeners'
import {searchAwakeners} from '@/domain/awakeners-search'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {compareAwakenersForDatabaseSort, type DatabaseSortKey} from '@/domain/database-sorting'

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

const allAwakeners = getAwakeners()

function applyFilters(
  awakeners: Awakener[],
  realmFilter: RealmFilterId,
  rarityFilter: RarityFilterId,
  typeFilter: TypeFilterId,
): Awakener[] {
  let result = awakeners
  if (realmFilter !== 'ALL') {
    result = result.filter((a) => a.realm === realmFilter)
  }
  if (rarityFilter !== 'ALL') {
    result = result.filter((a) => a.rarity === rarityFilter)
  }
  if (typeFilter !== 'ALL') {
    result = result.filter((a) => a.type === typeFilter)
  }
  return result
}

function applySorting(
  awakeners: Awakener[],
  sortKey: DatabaseSortKey,
  sortDirection: CollectionSortDirection,
  groupByRealm: boolean,
): Awakener[] {
  return [...awakeners].sort((left, right) =>
    compareAwakenersForDatabaseSort(left, right, {
      key: sortKey,
      direction: sortDirection,
      groupByRealm,
    }),
  )
}

export function useDatabaseViewModel() {
  const [query, setQueryRaw] = useState('')
  const [realmFilter, setRealmFilter] = useState<RealmFilterId>('ALL')
  const [rarityFilter, setRarityFilter] = useState<RarityFilterId>('ALL')
  const [typeFilter, setTypeFilter] = useState<TypeFilterId>('ALL')
  const [sortKey, setSortKey] = useState<DatabaseSortKey>('ALPHABETICAL')
  const [sortDirection, setSortDirection] = useState<CollectionSortDirection>('ASC')
  const [groupByRealm, setGroupByRealm] = useState(false)

  const filteredAwakeners = useMemo(() => {
    const searched = searchAwakeners(allAwakeners, query)
    const filtered = applyFilters(searched, realmFilter, rarityFilter, typeFilter)
    return applySorting(filtered, sortKey, sortDirection, groupByRealm)
  }, [query, realmFilter, rarityFilter, typeFilter, sortKey, sortDirection, groupByRealm])

  const setQuery = useCallback((next: string) => {
    setQueryRaw(next)
  }, [])

  const appendSearchCharacter = useCallback((key: string) => {
    setQueryRaw((prev) => prev + key)
  }, [])

  const clearQuery = useCallback(() => {
    setQueryRaw('')
  }, [])

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
  }, [])

  return {
    awakeners: filteredAwakeners,
    totalCount: allAwakeners.length,
    query,
    realmFilter,
    rarityFilter,
    typeFilter,
    sortKey,
    sortDirection,
    groupByRealm,
    setQuery,
    appendSearchCharacter,
    clearQuery,
    setRealmFilter,
    setRarityFilter,
    setTypeFilter,
    setSortKey,
    toggleSortDirection,
    setGroupByRealm,
  }
}
