import {useMemo} from 'react'

import {type Awakener} from '@/domain/awakeners'
import {searchAwakenerResults} from '@/domain/awakeners-search'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {
  type AvailabilityFilterId,
  type DatabaseBrowseState,
  type GameplayFactionFilterId,
  type RarityFilterId,
  type RealmFilterId,
  type SubstatScalingKey,
  type TypeFilterId,
} from '@/domain/database-browse-state'
import {compareAwakenersForDatabaseSort, type DatabaseSortKey} from '@/domain/database-sorting'
import {compareSearchRelevance, getSearchRelevanceByEntityId} from '@/domain/search-relevance'

function matchesAvailabilityFilter(awakener: Awakener, availabilityFilter: AvailabilityFilterId) {
  if (availabilityFilter === 'ALL') {
    return true
  }
  if (availabilityFilter === 'LIMITED') {
    return (
      awakener.availabilityType === 'LIMITED_FADED_LEGACY' ||
      awakener.availabilityType === 'LIMITED_ASTRAL_REIGN'
    )
  }
  return awakener.availabilityType === availabilityFilter
}

export function filterAwakenersForDatabase(
  awakeners: Awakener[],
  realmFilter: RealmFilterId,
  rarityFilter: RarityFilterId,
  typeFilter: TypeFilterId,
  availabilityFilter: AvailabilityFilterId,
  gameplayFactionFilters: readonly GameplayFactionFilterId[] = [],
  scalingSubstatFilters: readonly SubstatScalingKey[] = [],
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
  if (availabilityFilter !== 'ALL') {
    result = result.filter((a) => matchesAvailabilityFilter(a, availabilityFilter))
  }
  if (gameplayFactionFilters.length > 0) {
    result = result.filter((a) => gameplayFactionFilters.some((filter) => a.tags.includes(filter)))
  }
  if (scalingSubstatFilters.length > 0) {
    result = result.filter((a) =>
      scalingSubstatFilters.every((filter) => (a.substatScaling?.[filter] ?? 0) > 0),
    )
  }
  return result
}

function applySorting(
  awakeners: Awakener[],
  sortKey: DatabaseSortKey,
  sortDirection: CollectionSortDirection,
  groupByRealm: boolean,
  relevanceByAwakenerId?: ReadonlyMap<string, number>,
): Awakener[] {
  return [...awakeners].sort(
    (left, right) =>
      compareSearchRelevance(left, right, relevanceByAwakenerId) ||
      compareAwakenersForDatabaseSort(left, right, {
        key: sortKey,
        direction: sortDirection,
        groupByRealm,
      }),
  )
}

export function useDatabaseViewModel(allAwakeners: Awakener[], browseState: DatabaseBrowseState) {
  const {
    availabilityFilter,
    groupByRealm,
    gameplayFactionFilters,
    query,
    rarityFilter,
    realmFilter,
    scalingSubstatFilters,
    sortDirection,
    sortKey,
    typeFilter,
  } = browseState

  const filteredAwakeners = useMemo(() => {
    const searchResults = searchAwakenerResults(allAwakeners, query)
    const relevanceByAwakenerId = getSearchRelevanceByEntityId(searchResults, query)
    const filtered = filterAwakenersForDatabase(
      searchResults.map((result) => result.entity),
      realmFilter,
      rarityFilter,
      typeFilter,
      availabilityFilter,
      gameplayFactionFilters,
      scalingSubstatFilters,
    )
    return applySorting(filtered, sortKey, sortDirection, groupByRealm, relevanceByAwakenerId)
  }, [
    allAwakeners,
    availabilityFilter,
    gameplayFactionFilters,
    query,
    realmFilter,
    rarityFilter,
    scalingSubstatFilters,
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
