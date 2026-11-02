import {useMemo} from 'react'

import {
  compareWheelsForCollectionSort,
  type SortableWheelCollectionEntry,
} from '@/domain/collection-sorting'
import {getMainstatByKey} from '@/domain/mainstats'
import {compareSearchRelevance, getSearchRelevanceByEntityId} from '@/domain/search-relevance'
import {matchesWheelMainstat} from '@/domain/wheel-mainstat-filters'
import {compareWheelsForUi} from '@/domain/wheel-sort'
import type {Wheel} from '@/domain/wheels'
import type {WheelsDatabaseBrowseState} from '@/domain/wheels-database-browse-state'
import {searchWheelResults} from '@/domain/wheels-search'

function applyFilters(
  wheels: Wheel[],
  browseState: Pick<
    WheelsDatabaseBrowseState,
    'realmFilter' | 'rarityFilter' | 'mainstatFilter' | 'availabilityFilter'
  >,
): Wheel[] {
  let result = wheels
  if (browseState.availabilityFilter === 'WELFARE') {
    result = result.filter((wheel) => wheel.hasShopSource ?? wheel.availabilityType === 'WELFARE')
  } else if (browseState.availabilityFilter !== 'ALL') {
    result = result.filter((wheel) =>
      browseState.availabilityFilter === 'LIMITED'
        ? wheel.availabilityType === 'LIMITED_FADED_LEGACY' ||
          wheel.availabilityType === 'LIMITED_ASTRAL_REIGN'
        : wheel.availabilityType === browseState.availabilityFilter,
    )
  }
  if (browseState.realmFilter !== 'ALL') {
    result = result.filter((wheel) => wheel.realm === browseState.realmFilter)
  }
  if (browseState.rarityFilter !== 'ALL') {
    result = result.filter((wheel) => wheel.rarity === browseState.rarityFilter)
  }
  if (browseState.mainstatFilter !== 'ALL') {
    result = result.filter((wheel) =>
      matchesWheelMainstat(wheel.mainstatKey, browseState.mainstatFilter),
    )
  }
  return result
}

function toSortableWheelEntry(
  wheel: Wheel,
  wheelIndexById: ReadonlyMap<string, number>,
): SortableWheelCollectionEntry {
  return {
    label: wheel.name,
    index: wheelIndexById.get(wheel.id) ?? Number.MAX_SAFE_INTEGER,
    owned: true,
    enlighten: 0,
    rarity: wheel.rarity,
    realm: wheel.realm,
    mainstatLabel: getMainstatByKey(wheel.mainstatKey)?.label ?? wheel.mainstatKey,
  }
}

export function useWheelsDatabaseViewModel(
  allWheels: Wheel[],
  browseState: WheelsDatabaseBrowseState,
) {
  const {
    availabilityFilter,
    mainstatFilter,
    query,
    rarityFilter,
    realmFilter,
    sortDirection,
    sortKey,
  } = browseState
  const wheelIndexById = useMemo(
    () => new Map(allWheels.toSorted(compareWheelsForUi).map((wheel, index) => [wheel.id, index])),
    [allWheels],
  )
  const sortableWheelEntryById = useMemo(
    () =>
      new Map(allWheels.map((wheel) => [wheel.id, toSortableWheelEntry(wheel, wheelIndexById)])),
    [allWheels, wheelIndexById],
  )

  const filteredWheels = useMemo(() => {
    const searchResults = searchWheelResults(allWheels, query)
    const relevanceByWheelId = getSearchRelevanceByEntityId(searchResults, query)
    const filtered = applyFilters(
      searchResults.map((result) => result.entity),
      {availabilityFilter, mainstatFilter, rarityFilter, realmFilter},
    )
    return filtered.toSorted((left, right) => {
      const relevanceResult = compareSearchRelevance(left, right, relevanceByWheelId)
      if (relevanceResult !== 0) {
        return relevanceResult
      }

      const leftEntry = sortableWheelEntryById.get(left.id)
      const rightEntry = sortableWheelEntryById.get(right.id)
      if (!leftEntry || !rightEntry) {
        return compareWheelsForUi(left, right)
      }

      return compareWheelsForCollectionSort(leftEntry, rightEntry, {
        key: sortKey,
        direction: sortDirection,
      })
    })
  }, [
    allWheels,
    availabilityFilter,
    mainstatFilter,
    query,
    rarityFilter,
    realmFilter,
    sortDirection,
    sortKey,
    sortableWheelEntryById,
  ])

  return {
    wheels: filteredWheels,
    totalCount: allWheels.length,
  }
}
