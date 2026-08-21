import {useMemo} from 'react'

import {
  hasAwakenerScalingSubstat,
  inferAwakenerScalingSubstatRole,
  matchesAwakenerScalingSubstatRole,
} from '@/domain/awakener-scaling-substats'
import {type Awakener} from '@/domain/awakeners'
import {searchAwakenerResults} from '@/domain/awakeners-search'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {
  type AvailabilityFilterId,
  type AwakenerScalingSubstatFilter,
  type DatabaseBrowseState,
  type GenderFilterId,
  type GameplayFactionFilterId,
  type RarityFilterId,
  type RealmFilterId,
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
  scalingSubstatFilters: readonly AwakenerScalingSubstatFilter[] = [],
  genderFilter: GenderFilterId = 'ALL',
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
  if (genderFilter !== 'ALL') {
    result = result.filter((a) => a.gender === genderFilter)
  }
  if (gameplayFactionFilters.length > 0) {
    result = result.filter((a) => gameplayFactionFilters.some((filter) => a.tags.includes(filter)))
  }
  if (scalingSubstatFilters.length > 0) {
    result = result.filter((a) =>
      scalingSubstatFilters.every((filter) => {
        if (filter.role === 'PRIMARY') {
          return matchesAwakenerScalingSubstatRole(a.substatScaling, filter.key, 'MAIN')
        }
        if (filter.role === 'SECONDARY') {
          return matchesAwakenerScalingSubstatRole(a.substatScaling, filter.key, 'SUB')
        }
        return hasAwakenerScalingSubstat(a.substatScaling, filter.key)
      }),
    )
  }
  return result
}

function getScalingBestMatchScore(
  awakener: Awakener,
  scalingSubstatFilters: readonly AwakenerScalingSubstatFilter[],
): number {
  return scalingSubstatFilters.reduce((score, filter) => {
    if (filter.role !== 'ANY') {
      return score
    }
    const role = inferAwakenerScalingSubstatRole(awakener.substatScaling, filter.key)
    if (role === 'MAIN') {
      return score + 2
    }
    if (role === 'SUB') {
      return score + 1
    }
    return score
  }, 0)
}

function applySorting(
  awakeners: Awakener[],
  sortKey: DatabaseSortKey,
  sortDirection: CollectionSortDirection,
  groupByRealm: boolean,
  scalingSubstatFilters: readonly AwakenerScalingSubstatFilter[],
  relevanceByAwakenerId?: ReadonlyMap<string, number>,
): Awakener[] {
  const scalingBestMatchScoreById =
    sortKey === 'BEST_MATCH' && scalingSubstatFilters.length > 0
      ? new Map(
          awakeners.map((awakener) => [
            awakener.id,
            getScalingBestMatchScore(awakener, scalingSubstatFilters),
          ]),
        )
      : null

  return awakeners.toSorted((left, right) => {
    const bestMatchComparison =
      scalingBestMatchScoreById !== null
        ? (scalingBestMatchScoreById.get(right.id) ?? 0) -
          (scalingBestMatchScoreById.get(left.id) ?? 0)
        : 0

    return (
      compareSearchRelevance(left, right, relevanceByAwakenerId) ||
      bestMatchComparison ||
      compareAwakenersForDatabaseSort(left, right, {
        key: sortKey,
        direction: sortDirection,
        groupByRealm,
      })
    )
  })
}

export function useDatabaseViewModel(allAwakeners: Awakener[], browseState: DatabaseBrowseState) {
  const {
    availabilityFilter,
    genderFilter,
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
      genderFilter,
    )
    return applySorting(
      filtered,
      sortKey,
      sortDirection,
      groupByRealm,
      scalingSubstatFilters,
      relevanceByAwakenerId,
    )
  }, [
    allAwakeners,
    availabilityFilter,
    genderFilter,
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
