import {useMemo} from 'react'

import {type Awakener} from '@/domain/awakeners'
import {searchAwakeners} from '@/domain/awakeners-search'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {
  type DatabaseBrowseState,
  type RarityFilterId,
  type RealmFilterId,
  type TypeFilterId,
} from '@/domain/database-browse-state'
import {compareAwakenersForDatabaseSort, type DatabaseSortKey} from '@/domain/database-sorting'

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

export function useDatabaseViewModel(allAwakeners: Awakener[], browseState: DatabaseBrowseState) {
  const {groupByRealm, query, rarityFilter, realmFilter, sortDirection, sortKey, typeFilter} =
    browseState

  const filteredAwakeners = useMemo(() => {
    const searched = searchAwakeners(allAwakeners, query)
    const filtered = applyFilters(searched, realmFilter, rarityFilter, typeFilter)
    return applySorting(filtered, sortKey, sortDirection, groupByRealm)
  }, [
    allAwakeners,
    query,
    realmFilter,
    rarityFilter,
    typeFilter,
    sortKey,
    sortDirection,
    groupByRealm,
  ])

  return {
    awakeners: filteredAwakeners,
    totalCount: allAwakeners.length,
  }
}
