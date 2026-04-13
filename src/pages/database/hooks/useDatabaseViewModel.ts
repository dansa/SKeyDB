import {useCallback, useMemo} from 'react'

import {getAwakeners, type Awakener} from '@/domain/awakeners'
import {searchAwakeners} from '@/domain/awakeners-search'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {compareAwakenersForDatabaseSort, type DatabaseSortKey} from '@/domain/database-sorting'

import {
  useDatabaseStore,
  type RarityFilterId,
  type RealmFilterId,
  type TypeFilterId,
} from './useDatabaseStore'

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
  const query = useDatabaseStore((state) => state.query)
  const realmFilter = useDatabaseStore((state) => state.realmFilter)
  const rarityFilter = useDatabaseStore((state) => state.rarityFilter)
  const typeFilter = useDatabaseStore((state) => state.typeFilter)
  const sortKey = useDatabaseStore((state) => state.sortKey)
  const sortDirection = useDatabaseStore((state) => state.sortDirection)
  const groupByRealm = useDatabaseStore((state) => state.groupByRealm)
  const setQueryRaw = useDatabaseStore((state) => state.setQuery)
  const appendSearchCharacterRaw = useDatabaseStore((state) => state.appendSearchCharacter)
  const clearQueryRaw = useDatabaseStore((state) => state.clearQuery)
  const setRealmFilter = useDatabaseStore((state) => state.setRealmFilter)
  const setRarityFilter = useDatabaseStore((state) => state.setRarityFilter)
  const setTypeFilter = useDatabaseStore((state) => state.setTypeFilter)
  const setSortKey = useDatabaseStore((state) => state.setSortKey)
  const toggleSortDirectionRaw = useDatabaseStore((state) => state.toggleSortDirection)
  const setGroupByRealm = useDatabaseStore((state) => state.setGroupByRealm)

  const filteredAwakeners = useMemo(() => {
    const searched = searchAwakeners(allAwakeners, query)
    const filtered = applyFilters(searched, realmFilter, rarityFilter, typeFilter)
    return applySorting(filtered, sortKey, sortDirection, groupByRealm)
  }, [query, realmFilter, rarityFilter, typeFilter, sortKey, sortDirection, groupByRealm])

  const setQuery = useCallback(
    (next: string) => {
      setQueryRaw(next)
    },
    [setQueryRaw],
  )

  const appendSearchCharacter = useCallback(
    (key: string) => {
      appendSearchCharacterRaw(key)
    },
    [appendSearchCharacterRaw],
  )

  const clearQuery = useCallback(() => {
    clearQueryRaw()
  }, [clearQueryRaw])

  const toggleSortDirection = useCallback(() => {
    toggleSortDirectionRaw()
  }, [toggleSortDirectionRaw])

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
