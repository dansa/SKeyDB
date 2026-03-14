import {useCallback, useMemo} from 'react'

import {
  compareCovenantsForBuildRecommendation,
  compareWheelsForBuildRecommendation,
} from '@/domain/awakener-builds'
import {getAwakeners} from '@/domain/awakeners'
import {searchAwakeners} from '@/domain/awakeners-search'
import {compareAwakenersForCollectionSort} from '@/domain/collection-sorting'
import {getCovenants} from '@/domain/covenants'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosses} from '@/domain/posses'
import {searchPosses} from '@/domain/posses-search'
import {normalizeForSearch} from '@/domain/search-utils'
import {compareWheelsForUi} from '@/domain/wheel-sort'
import {getWheelMainstatLabel, getWheels} from '@/domain/wheels'

import type {ActiveSelection, PickerTab, TeamSlot} from '../types'
import {useAwakenerBuildRecommendations} from '../useAwakenerBuildRecommendations'
import {matchesWheelMainstat} from '../wheel-mainstats'
import {useBuilderStore} from './store/builder-store'
import {useCollectionOwnership} from './useCollectionOwnership'

const allAwakeners = getAwakeners()
const allWheels = getWheels()
const allCovenants = getCovenants()
const allPosses = getPosses()
const awakenerIdByNormalizedName = new Map(
  allAwakeners.map((awakener) => [awakener.name.toLowerCase(), awakener.id] as const),
)

function sinkUnownedToEnd<T>(items: T[], isOwned: (item: T) => boolean): T[] {
  const owned: T[] = []
  const unowned: T[] = []
  for (const item of items) {
    if (isOwned(item)) {
      owned.push(item)
    } else {
      unowned.push(item)
    }
  }
  return [...owned, ...unowned]
}

export function useBuilderPickerState(
  pickerTab: PickerTab,
  activeSelection: ActiveSelection,
  activeSlots: TeamSlot[],
) {
  const pickerSearchByTab = useBuilderStore((s) => s.pickerSearchByTab)
  const awakenerFilter = useBuilderStore((s) => s.awakenerFilter)
  const setAwakenerFilter = useBuilderStore((s) => s.setAwakenerFilter)
  const posseFilter = useBuilderStore((s) => s.posseFilter)
  const setPosseFilter = useBuilderStore((s) => s.setPosseFilter)
  const wheelRarityFilter = useBuilderStore((s) => s.wheelRarityFilter)
  const setWheelRarityFilter = useBuilderStore((s) => s.setWheelRarityFilter)
  const wheelMainstatFilter = useBuilderStore((s) => s.wheelMainstatFilter)
  const setWheelMainstatFilter = useBuilderStore((s) => s.setWheelMainstatFilter)
  const awakenerSortKey = useBuilderStore((s) => s.awakenerSortKey)
  const setAwakenerSortKey = useBuilderStore((s) => s.setAwakenerSortKey)
  const awakenerSortDirection = useBuilderStore((s) => s.awakenerSortDirection)
  const toggleAwakenerSortDirection = useBuilderStore((s) => s.toggleAwakenerSortDirection)
  const awakenerSortGroupByRealm = useBuilderStore((s) => s.awakenerSortGroupByRealm)
  const setAwakenerSortGroupByRealm = useBuilderStore((s) => s.setAwakenerSortGroupByRealm)
  const displayUnowned = useBuilderStore((s) => s.displayUnowned)
  const setDisplayUnowned = useBuilderStore((s) => s.setDisplayUnowned)
  const sinkUnownedToBottom = useBuilderStore((s) => s.sinkUnownedToBottom)
  const setSinkUnownedToBottom = useBuilderStore((s) => s.setSinkUnownedToBottom)
  const allowDupes = useBuilderStore((s) => s.allowDupes)
  const setAllowDupes = useBuilderStore((s) => s.setAllowDupes)
  const promoteRecommendedGear = useBuilderStore((s) => s.promoteRecommendedGear)
  const setPromoteRecommendedGear = useBuilderStore((s) => s.setPromoteRecommendedGear)
  const promoteMatchingWheelMainstats = useBuilderStore((s) => s.promoteMatchingWheelMainstats)
  const setPromoteMatchingWheelMainstats = useBuilderStore(
    (s) => s.setPromoteMatchingWheelMainstats,
  )
  const setPickerSearchQuery = useBuilderStore((s) => s.setPickerSearchQuery)
  const {ownedAwakenerLevelByName, awakenerLevelByName, ownedWheelLevelById, ownedPosseLevelById} =
    useCollectionOwnership()

  const slotsById = useMemo(
    () => new Map(activeSlots.map((slot) => [slot.slotId, slot] as const)),
    [activeSlots],
  )
  const {activeBuild, teamRecommendedPosseIds} = useAwakenerBuildRecommendations({
    activeSelection,
    slotsById,
    awakenerIdByName: awakenerIdByNormalizedName,
  })

  const searchQuery = pickerSearchByTab[pickerTab]

  const filteredAwakeners = useMemo(() => {
    if (pickerTab !== 'awakeners') {
      return allAwakeners
    }
    const searchedAwakeners = searchAwakeners(allAwakeners, pickerSearchByTab.awakeners)
    const byRealm =
      awakenerFilter === 'ALL'
        ? searchedAwakeners
        : searchedAwakeners.filter(
            (awakener) => awakener.realm.trim().toUpperCase() === awakenerFilter,
          )
    const byOwnership = displayUnowned
      ? byRealm
      : byRealm.filter((awakener) => (ownedAwakenerLevelByName.get(awakener.name) ?? null) !== null)
    const sorted = [...byOwnership].sort((left, right) =>
      compareAwakenersForCollectionSort(
        {
          label: formatAwakenerNameForUi(left.name),
          index: left.id,
          owned: (ownedAwakenerLevelByName.get(left.name) ?? null) !== null,
          enlighten: ownedAwakenerLevelByName.get(left.name) ?? 0,
          level: awakenerLevelByName.get(left.name) ?? 60,
          rarity: left.rarity,
          realm: left.realm,
        },
        {
          label: formatAwakenerNameForUi(right.name),
          index: right.id,
          owned: (ownedAwakenerLevelByName.get(right.name) ?? null) !== null,
          enlighten: ownedAwakenerLevelByName.get(right.name) ?? 0,
          level: awakenerLevelByName.get(right.name) ?? 60,
          rarity: right.rarity,
          realm: right.realm,
        },
        {
          key: awakenerSortKey,
          direction: awakenerSortDirection,
          groupByRealm: awakenerSortGroupByRealm,
        },
      ),
    )
    return sinkUnownedToBottom
      ? sinkUnownedToEnd(
          sorted,
          (awakener) => (ownedAwakenerLevelByName.get(awakener.name) ?? null) !== null,
        )
      : sorted
  }, [
    pickerTab,
    pickerSearchByTab.awakeners,
    awakenerFilter,
    displayUnowned,
    sinkUnownedToBottom,
    ownedAwakenerLevelByName,
    awakenerLevelByName,
    awakenerSortKey,
    awakenerSortDirection,
    awakenerSortGroupByRealm,
  ])

  const filteredWheels = useMemo(() => {
    if (pickerTab !== 'wheels') {
      return allWheels
    }
    const query = pickerSearchByTab.wheels.trim().toLowerCase()
    const normalizedQuery = normalizeForSearch(query)
    const matchedAwakenerNames =
      normalizedQuery.length > 0
        ? new Set(
            allAwakeners
              .filter((awakener) =>
                [awakener.name, ...awakener.aliases].some((value) =>
                  normalizeForSearch(value).includes(normalizedQuery),
                ),
              )
              .map((awakener) => awakener.name.toLowerCase()),
          )
        : null
    const byRarity =
      wheelRarityFilter === 'ALL'
        ? allWheels
        : allWheels.filter((wheel) => wheel.rarity === wheelRarityFilter)
    const byMainstat =
      wheelMainstatFilter === 'ALL'
        ? byRarity
        : byRarity.filter((wheel) => matchesWheelMainstat(wheel.mainstatKey, wheelMainstatFilter))
    const visibleWheels = displayUnowned
      ? byMainstat
      : byMainstat.filter((wheel) => (ownedWheelLevelById.get(wheel.id) ?? null) !== null)
    const queryFiltered = query
      ? visibleWheels.filter((wheel) => {
          return (
            wheel.name.toLowerCase().includes(query) ||
            wheel.rarity.toLowerCase().includes(query) ||
            wheel.realm.toLowerCase().includes(query) ||
            wheel.awakener.toLowerCase().includes(query) ||
            getWheelMainstatLabel(wheel).toLowerCase().includes(query) ||
            wheel.mainstatKey.toLowerCase().includes(query) ||
            Boolean(matchedAwakenerNames?.has(wheel.awakener.toLowerCase()))
          )
        })
      : visibleWheels
    const sorted = [...queryFiltered].sort((left, right) =>
      promoteRecommendedGear
        ? compareWheelsForBuildRecommendation(left, right, {
            build: activeBuild,
            fallbackCompare: compareWheelsForUi,
            promoteMainstats: promoteMatchingWheelMainstats,
          })
        : compareWheelsForUi(left, right),
    )
    return sinkUnownedToBottom
      ? sinkUnownedToEnd(sorted, (wheel) => (ownedWheelLevelById.get(wheel.id) ?? null) !== null)
      : sorted
  }, [
    pickerTab,
    pickerSearchByTab.wheels,
    wheelRarityFilter,
    wheelMainstatFilter,
    displayUnowned,
    sinkUnownedToBottom,
    ownedWheelLevelById,
    promoteRecommendedGear,
    activeBuild,
    promoteMatchingWheelMainstats,
  ])

  const filteredCovenants = useMemo(() => {
    if (pickerTab !== 'covenants') {
      return allCovenants
    }
    const query = pickerSearchByTab.covenants.trim().toLowerCase()
    const queryFiltered = !query
      ? allCovenants
      : allCovenants.filter(
          (covenant) =>
            covenant.name.toLowerCase().includes(query) ||
            covenant.id.toLowerCase().includes(query),
        )
    return [...queryFiltered].sort((left, right) =>
      promoteRecommendedGear
        ? compareCovenantsForBuildRecommendation(left, right, activeBuild, {
            fallbackCompare: (leftCovenant, rightCovenant) =>
              leftCovenant.id.localeCompare(rightCovenant.id, undefined, {
                numeric: true,
                sensitivity: 'base',
              }),
          })
        : left.id.localeCompare(right.id, undefined, {numeric: true, sensitivity: 'base'}),
    )
  }, [pickerTab, pickerSearchByTab.covenants, promoteRecommendedGear, activeBuild])

  const filteredPosses = useMemo(() => {
    if (pickerTab !== 'posses') {
      return allPosses
    }
    const searchedPosses = searchPosses(allPosses, pickerSearchByTab.posses)
    let filtered: typeof searchedPosses
    if (posseFilter === 'ALL') {
      filtered = displayUnowned
        ? searchedPosses
        : searchedPosses.filter((posse) => (ownedPosseLevelById.get(posse.id) ?? null) !== null)
    } else if (posseFilter === 'FADED_LEGACY') {
      filtered = searchedPosses.filter(
        (posse) =>
          posse.isFadedLegacy &&
          (displayUnowned || (ownedPosseLevelById.get(posse.id) ?? null) !== null),
      )
    } else {
      filtered = searchedPosses.filter(
        (posse) =>
          !posse.isFadedLegacy &&
          posse.realm.trim().toUpperCase() === posseFilter &&
          (displayUnowned || (ownedPosseLevelById.get(posse.id) ?? null) !== null),
      )
    }
    const promoted = promoteRecommendedGear
      ? [...filtered].sort((left, right) => {
          const leftRecommended = teamRecommendedPosseIds.has(left.id)
          const rightRecommended = teamRecommendedPosseIds.has(right.id)
          if (leftRecommended === rightRecommended) {
            return 0
          }
          return leftRecommended ? -1 : 1
        })
      : filtered
    return sinkUnownedToBottom
      ? sinkUnownedToEnd(promoted, (posse) => (ownedPosseLevelById.get(posse.id) ?? null) !== null)
      : promoted
  }, [
    pickerTab,
    pickerSearchByTab.posses,
    posseFilter,
    displayUnowned,
    sinkUnownedToBottom,
    ownedPosseLevelById,
    promoteRecommendedGear,
    teamRecommendedPosseIds,
  ])

  const clearSearch = useCallback(() => {
    setPickerSearchQuery(pickerTab, '')
  }, [pickerTab, setPickerSearchQuery])

  const setSearchQuery = useCallback(
    (query: string) => {
      setPickerSearchQuery(pickerTab, query)
    },
    [pickerTab, setPickerSearchQuery],
  )

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    awakenerFilter,
    setAwakenerFilter,
    posseFilter,
    setPosseFilter,
    wheelRarityFilter,
    setWheelRarityFilter,
    wheelMainstatFilter,
    setWheelMainstatFilter,
    awakenerSortKey,
    setAwakenerSortKey,
    awakenerSortDirection,
    toggleAwakenerSortDirection,
    awakenerSortGroupByRealm,
    setAwakenerSortGroupByRealm,
    displayUnowned,
    setDisplayUnowned,
    sinkUnownedToBottom,
    setSinkUnownedToBottom,
    allowDupes,
    setAllowDupes,
    promoteRecommendedGear,
    setPromoteRecommendedGear,
    promoteMatchingWheelMainstats,
    setPromoteMatchingWheelMainstats,
    ownedAwakenerLevelByName,
    ownedWheelLevelById,
    ownedPosseLevelById,
    activeBuild,
    teamRecommendedPosseIds,
    filteredAwakeners,
    filteredWheels,
    filteredCovenants,
    filteredPosses,
  }
}
