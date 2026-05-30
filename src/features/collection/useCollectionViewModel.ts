import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {useStore} from 'zustand'

import {getAwakeners} from '@/domain/awakeners'
import {searchAwakeners} from '@/domain/awakeners-search'
import {
  clearOwnedEntry,
  createDefaultCollectionOwnershipCatalog,
  getAwakenerLevel,
  getOwnedLevel,
  setAwakenerLevel,
  setOwnedLevel,
} from '@/domain/collection-ownership'
import {
  compareAwakenersForCollectionSort,
  comparePossesForCollectionDefaultSort,
  compareWheelsForCollectionDefaultSort,
  DEFAULT_AWAKENER_SORT_CONFIG,
  resolveAwakenerSortKey,
  resolveGroupByRealm,
  resolveSortDirection,
  type AwakenerSortConfig,
  type AwakenerSortKey,
  type CollectionSortDirection,
} from '@/domain/collection-sorting'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosses} from '@/domain/posses'
import {searchPosses} from '@/domain/posses-search'
import {
  getBrowserLocalStorage,
  safeStorageRead,
  safeStorageWrite,
  type StorageLike,
} from '@/domain/storage'
import {matchesWheelMainstat, type WheelMainstatFilter} from '@/domain/wheel-mainstat-filters'
import {compareWheelsForUi} from '@/domain/wheel-sort'
import {getWheels} from '@/domain/wheels'
import {searchWheels} from '@/domain/wheels-search'
import {
  COLLECTION_OWNERSHIP_KEY,
  parseCollectionOwnershipSnapshot,
} from '@/features/collection/collectionMigrations'
import {collectionOwnershipStore} from '@/stores/collectionOwnershipStore'

import {
  applyFilteredAwakenerLevelPreset,
  clampOwnershipLevel,
  clearFilteredAwakenerOwnership,
  clearFilteredPosseOwnership,
  clearFilteredWheelOwnership,
  markFilteredAwakenerOwnership,
  markFilteredPosseOwnership,
  markFilteredWheelOwnership,
  markPendingCollectionSort,
  setFilteredAwakenerEnlighten,
  setFilteredWheelEnlighten,
  type CollectionTab,
  type RememberedOwnershipLevels,
} from './collection-batch-ownership'

type AwakenerFilter = 'ALL' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
type PosseFilter = 'ALL' | 'FADED_LEGACY' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
type WheelRarityFilter = 'ALL' | 'SSR' | 'R' | 'SR'
const INITIAL_QUERY_BY_TAB: Record<CollectionTab, string> = {
  awakeners: '',
  wheels: '',
  posses: '',
}
export function createInitialRememberedLevels(): Record<
  'awakeners' | 'wheels' | 'posses',
  RememberedOwnershipLevels
> {
  return {
    awakeners: {},
    wheels: {},
    posses: {},
  }
}
const OWNERSHIP_AUTOSAVE_DEBOUNCE_MS = 220
const COLLECTION_AWAKENER_SORT_KEY = 'skeydb.collection.awakenerSort.v1'

function createLinkedAwakenerIdLookup(linkedAwakenerGroups: string[][] | undefined) {
  const linkedIdsById = new Map<string, string[]>()
  if (!linkedAwakenerGroups?.length) {
    return linkedIdsById
  }

  for (const group of linkedAwakenerGroups) {
    for (const linkedId of group) {
      linkedIdsById.set(linkedId, group)
    }
  }

  return linkedIdsById
}

function freezeItemsByAppliedOrder<T>(
  items: T[],
  liveOrder: string[],
  appliedOrder: string[],
  getItemId: (item: T) => string,
) {
  const itemById = new Map(items.map((item) => [getItemId(item), item]))
  const liveIdSet = new Set(liveOrder)
  const kept = appliedOrder.filter((id) => liveIdSet.has(id))
  const keptIdSet = new Set(kept)
  const appended = liveOrder.filter((id) => !keptIdSet.has(id))
  const mergedOrder = [...kept, ...appended]
  const frozenItems: T[] = []
  for (const id of mergedOrder) {
    const item = itemById.get(id)
    if (item) {
      frozenItems.push(item)
    }
  }

  return frozenItems
}

function areStringArraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function useFrozenSortOrder<T>(items: T[], getItemId: (item: T) => string, refreshKey: string) {
  const liveOrder = useMemo(() => items.map(getItemId), [items, getItemId])
  const [freezeState, setFreezeState] = useState(() => ({
    appliedOrder: liveOrder,
    hasPendingChanges: false,
    refreshKey,
  }))
  const effectiveAppliedOrder =
    freezeState.refreshKey === refreshKey ? freezeState.appliedOrder : liveOrder

  const frozenItems = useMemo(
    () => freezeItemsByAppliedOrder(items, liveOrder, effectiveAppliedOrder, getItemId),
    [items, liveOrder, effectiveAppliedOrder, getItemId],
  )

  const applyChanges = useCallback(() => {
    setFreezeState((currentState) => {
      if (
        currentState.refreshKey === refreshKey &&
        !currentState.hasPendingChanges &&
        areStringArraysEqual(currentState.appliedOrder, liveOrder)
      ) {
        return currentState
      }

      return {
        appliedOrder: liveOrder,
        hasPendingChanges: false,
        refreshKey,
      }
    })
  }, [liveOrder, refreshKey])

  const markPendingChanges = useCallback(() => {
    setFreezeState((currentState) => ({
      appliedOrder: currentState.refreshKey === refreshKey ? currentState.appliedOrder : liveOrder,
      hasPendingChanges: true,
      refreshKey,
    }))
  }, [liveOrder, refreshKey])

  return {
    frozenItems,
    hasPendingChanges: freezeState.refreshKey === refreshKey && freezeState.hasPendingChanges,
    markPendingChanges,
    applyChanges,
  }
}

function filterPossesByCategory(posses: ReturnType<typeof searchPosses>, posseFilter: PosseFilter) {
  if (posseFilter === 'ALL') {
    return posses
  }

  if (posseFilter === 'FADED_LEGACY') {
    return posses.filter((posse) => posse.isFadedLegacy)
  }

  return posses.filter(
    (posse) => !posse.isFadedLegacy && posse.realm.trim().toUpperCase() === posseFilter,
  )
}

function loadAwakenerSortConfig(storage: StorageLike | null): AwakenerSortConfig {
  try {
    const raw = safeStorageRead(storage, COLLECTION_AWAKENER_SORT_KEY)
    if (!raw) {
      return DEFAULT_AWAKENER_SORT_CONFIG
    }

    const parsed = JSON.parse(raw) as Partial<AwakenerSortConfig> & {groupByFaction?: boolean}
    return {
      key: resolveAwakenerSortKey(parsed.key),
      direction: resolveSortDirection(parsed.direction),
      groupByRealm: resolveGroupByRealm(parsed),
    }
  } catch {
    return DEFAULT_AWAKENER_SORT_CONFIG
  }
}

export function useCollectionViewModel() {
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const ownershipCatalog = useMemo(() => createDefaultCollectionOwnershipCatalog(), [])
  const persistedAwakenerSortConfig = useMemo(() => loadAwakenerSortConfig(storage), [storage])
  const hasInvalidCurrentOwnershipSnapshot = useMemo(() => {
    const rawSnapshot = safeStorageRead(storage, COLLECTION_OWNERSHIP_KEY)
    if (rawSnapshot === null) {
      return false
    }
    return !parseCollectionOwnershipSnapshot(rawSnapshot, ownershipCatalog).ok
  }, [storage, ownershipCatalog])
  useState(() => {
    collectionOwnershipStore.getState().hydrate()
    return true
  })
  const skipNextOwnershipAutosaveRef = useRef(hasInvalidCurrentOwnershipSnapshot)
  const ownership = useStore(collectionOwnershipStore, (state) => state.ownership)
  const updateOwnership = useStore(collectionOwnershipStore, (state) => state.updateOwnership)
  const setStoreDisplayUnowned = useStore(
    collectionOwnershipStore,
    (state) => state.setDisplayUnowned,
  )
  const saveOwnership = useStore(collectionOwnershipStore, (state) => state.save)
  const importOwnershipSnapshot = useStore(
    collectionOwnershipStore,
    (state) => state.importSnapshot,
  )
  const exportOwnershipSnapshot = useStore(
    collectionOwnershipStore,
    (state) => state.exportSnapshot,
  )
  const [tab, setTab] = useState<CollectionTab>('awakeners')
  const [queryByTab, setQueryByTab] = useState(INITIAL_QUERY_BY_TAB)
  const [awakenerFilter, setAwakenerFilter] = useState<AwakenerFilter>('ALL')
  const [wheelRarityFilter, setWheelRarityFilter] = useState<WheelRarityFilter>('ALL')
  const [wheelMainstatFilter, setWheelMainstatFilter] = useState<WheelMainstatFilter>('ALL')
  const [posseFilter, setPosseFilter] = useState<PosseFilter>('ALL')
  const displayUnowned = ownership.displayUnowned
  const [awakenerSortKey, setAwakenerSortKey] = useState<AwakenerSortKey>(
    persistedAwakenerSortConfig.key,
  )
  const [awakenerSortDirection, setAwakenerSortDirection] = useState<CollectionSortDirection>(
    persistedAwakenerSortConfig.direction,
  )
  const [awakenerSortGroupByRealm, setAwakenerSortGroupByRealm] = useState(
    persistedAwakenerSortConfig.groupByRealm,
  )
  const rememberedLevelsRef = useRef<ReturnType<typeof createInitialRememberedLevels> | null>(null)
  rememberedLevelsRef.current ??= createInitialRememberedLevels()
  const rememberedLevels = rememberedLevelsRef.current

  const awakeners = useMemo(
    () =>
      [...getAwakeners()].sort((a, b) =>
        formatAwakenerNameForUi(a.name).localeCompare(formatAwakenerNameForUi(b.name)),
      ),
    [],
  )
  const linkedAwakenerIdsById = useMemo(
    () => createLinkedAwakenerIdLookup(ownershipCatalog.linkedAwakenerGroups),
    [ownershipCatalog],
  )
  const wheels = useMemo(() => [...getWheels()].sort(compareWheelsForUi), [])
  const wheelIndexById = useMemo(
    () => new Map(wheels.map((wheel, index) => [wheel.id, index])),
    [wheels],
  )
  const posses = useMemo(() => [...getPosses()], [])

  const activeQuery = queryByTab[tab]
  const awakenerIdByName = useMemo(
    () => new Map(awakeners.map((awakener) => [awakener.name, awakener.id])),
    [awakeners],
  )
  const searchedAwakeners = useMemo(
    () => searchAwakeners(awakeners, queryByTab.awakeners),
    [awakeners, queryByTab.awakeners],
  )
  const filteredAwakeners = useMemo(() => {
    const byRealm =
      awakenerFilter === 'ALL'
        ? searchedAwakeners
        : searchedAwakeners.filter(
            (awakener) => awakener.realm.trim().toUpperCase() === awakenerFilter,
          )
    const byOwnership = displayUnowned
      ? byRealm
      : byRealm.filter((awakener) => {
          const awakenerId = awakenerIdByName.get(awakener.name)
          if (!awakenerId) {
            return false
          }
          return getOwnedLevel(ownership, 'awakeners', awakenerId) !== null
        })

    return [...byOwnership].sort((left, right) => {
      const leftId = awakenerIdByName.get(left.name)
      const rightId = awakenerIdByName.get(right.name)
      const leftOwnedLevel = leftId ? getOwnedLevel(ownership, 'awakeners', leftId) : 0
      const rightOwnedLevel = rightId ? getOwnedLevel(ownership, 'awakeners', rightId) : 0
      const leftIsOwned = leftOwnedLevel !== null
      const rightIsOwned = rightOwnedLevel !== null
      const leftAwakenerLevel = leftIsOwned && leftId ? getAwakenerLevel(ownership, leftId) : 1
      const rightAwakenerLevel = rightIsOwned && rightId ? getAwakenerLevel(ownership, rightId) : 1

      return compareAwakenersForCollectionSort(
        {
          label: formatAwakenerNameForUi(left.name),
          index: left.numericId ?? Number.MAX_SAFE_INTEGER,
          owned: leftIsOwned,
          enlighten: leftIsOwned ? leftOwnedLevel : 0,
          level: leftAwakenerLevel,
          rarity: left.rarity,
          realm: left.realm,
          releaseDate: left.releaseDate,
        },
        {
          label: formatAwakenerNameForUi(right.name),
          index: right.numericId ?? Number.MAX_SAFE_INTEGER,
          owned: rightIsOwned,
          enlighten: rightIsOwned ? rightOwnedLevel : 0,
          level: rightAwakenerLevel,
          rarity: right.rarity,
          realm: right.realm,
          releaseDate: right.releaseDate,
        },
        {
          key: awakenerSortKey,
          direction: awakenerSortDirection,
          groupByRealm: awakenerSortGroupByRealm,
        },
      )
    })
  }, [
    awakenerFilter,
    searchedAwakeners,
    displayUnowned,
    awakenerIdByName,
    ownership,
    awakenerSortKey,
    awakenerSortDirection,
    awakenerSortGroupByRealm,
  ])
  const {
    frozenItems: frozenFilteredAwakeners,
    hasPendingChanges: awakenerSortHasPendingChanges,
    markPendingChanges: markAwakenerSortPending,
    applyChanges: applyAwakenerSortFreeze,
  } = useFrozenSortOrder(
    filteredAwakeners,
    (awakener) => awakener.name,
    JSON.stringify({
      awakenerFilter,
      query: queryByTab.awakeners,
      displayUnowned,
      awakenerSortKey,
      awakenerSortDirection,
      awakenerSortGroupByRealm,
    }),
  )

  const searchedPosses = useMemo(
    () => searchPosses(posses, queryByTab.posses),
    [posses, queryByTab.posses],
  )
  const filteredPosses = useMemo(() => {
    const filteredByCategory = filterPossesByCategory(searchedPosses, posseFilter)
    const filteredByOwnership = displayUnowned
      ? filteredByCategory
      : filteredByCategory.filter((posse) => getOwnedLevel(ownership, 'posses', posse.id) !== null)

    return [...filteredByOwnership].sort((left, right) =>
      comparePossesForCollectionDefaultSort(
        {
          label: left.name,
          index: left.index,
          owned: getOwnedLevel(ownership, 'posses', left.id) !== null,
          enlighten: 0,
        },
        {
          label: right.name,
          index: right.index,
          owned: getOwnedLevel(ownership, 'posses', right.id) !== null,
          enlighten: 0,
        },
      ),
    )
  }, [searchedPosses, posseFilter, displayUnowned, ownership])

  const filteredWheels = useMemo(() => {
    const wheelsByRarity =
      wheelRarityFilter === 'ALL'
        ? wheels
        : wheels.filter((wheel) => wheel.rarity === wheelRarityFilter)
    const wheelsByMainstat =
      wheelMainstatFilter === 'ALL'
        ? wheelsByRarity
        : wheelsByRarity.filter((wheel) =>
            matchesWheelMainstat(wheel.mainstatKey, wheelMainstatFilter),
          )

    const matchingSearch = searchWheels(wheelsByMainstat, queryByTab.wheels)

    const byOwnership = displayUnowned
      ? matchingSearch
      : matchingSearch.filter((wheel) => getOwnedLevel(ownership, 'wheels', wheel.id) !== null)

    return [...byOwnership].sort((left, right) =>
      compareWheelsForCollectionDefaultSort(
        {
          label: left.name,
          index: wheelIndexById.get(left.id) ?? Number.MAX_SAFE_INTEGER,
          owned: getOwnedLevel(ownership, 'wheels', left.id) !== null,
          enlighten: getOwnedLevel(ownership, 'wheels', left.id) ?? 0,
          rarity: left.rarity,
          realm: left.realm,
        },
        {
          label: right.name,
          index: wheelIndexById.get(right.id) ?? Number.MAX_SAFE_INTEGER,
          owned: getOwnedLevel(ownership, 'wheels', right.id) !== null,
          enlighten: getOwnedLevel(ownership, 'wheels', right.id) ?? 0,
          rarity: right.rarity,
          realm: right.realm,
        },
      ),
    )
  }, [
    queryByTab.wheels,
    wheelRarityFilter,
    wheelMainstatFilter,
    wheels,
    wheelIndexById,
    displayUnowned,
    ownership,
  ])
  const {
    frozenItems: frozenFilteredWheels,
    hasPendingChanges: wheelSortHasPendingChanges,
    markPendingChanges: markWheelSortPending,
    applyChanges: applyWheelSortFreeze,
  } = useFrozenSortOrder(
    filteredWheels,
    (wheel) => wheel.id,
    JSON.stringify({
      query: queryByTab.wheels,
      displayUnowned,
      wheelRarityFilter,
      wheelMainstatFilter,
    }),
  )

  const setAwakenerSortHasPendingChanges = useCallback(
    (next: boolean) => {
      if (next) {
        markAwakenerSortPending()
      } else {
        applyAwakenerSortFreeze()
      }
    },
    [applyAwakenerSortFreeze, markAwakenerSortPending],
  )
  const setWheelSortHasPendingChanges = useCallback(
    (next: boolean) => {
      if (next) {
        markWheelSortPending()
      } else {
        applyWheelSortFreeze()
      }
    },
    [applyWheelSortFreeze, markWheelSortPending],
  )

  function setQuery(value: string) {
    setQueryByTab((prev) => ({...prev, [tab]: value}))
  }

  function appendSearchCharacter(key: string) {
    setQueryByTab((prev) => ({...prev, [tab]: `${prev[tab]}${key}`}))
  }

  function removeSearchCharacter() {
    setQueryByTab((prev) => {
      if (!prev[tab]) {
        return prev
      }
      return {...prev, [tab]: prev[tab].slice(0, -1)}
    })
  }

  function clearActiveQuery() {
    setQueryByTab((prev) => {
      if (!prev[tab]) {
        return prev
      }
      return {...prev, [tab]: ''}
    })
  }

  function toggleOwned(kind: 'awakeners' | 'wheels' | 'posses', id: string) {
    updateOwnership((prev) => {
      const currentLevel = getOwnedLevel(prev, kind, id)
      if (currentLevel === null) {
        const rememberedLevel = rememberedLevels[kind][id]
        return setOwnedLevel(prev, kind, id, rememberedLevel ?? 0, ownershipCatalog)
      }
      rememberedLevels[kind][id] = currentLevel
      return clearOwnedEntry(prev, kind, id, ownershipCatalog)
    })
    if (kind === 'awakeners') {
      setAwakenerSortHasPendingChanges(true)
      return
    }
    if (kind === 'wheels') {
      setWheelSortHasPendingChanges(true)
    }
  }

  function increaseLevel(kind: 'awakeners' | 'wheels', id: string) {
    updateOwnership((prev) => {
      const currentLevel = getOwnedLevel(prev, kind, id)
      if (currentLevel === null) {
        return setOwnedLevel(prev, kind, id, 0, ownershipCatalog)
      }
      return setOwnedLevel(prev, kind, id, clampOwnershipLevel(currentLevel + 1), ownershipCatalog)
    })
    if (kind === 'awakeners') {
      setAwakenerSortHasPendingChanges(true)
      return
    }
    setWheelSortHasPendingChanges(true)
  }

  function decreaseLevel(kind: 'awakeners' | 'wheels', id: string) {
    updateOwnership((prev) => {
      const currentLevel = getOwnedLevel(prev, kind, id)
      if (currentLevel === null || currentLevel <= 0) {
        return prev
      }
      return setOwnedLevel(prev, kind, id, currentLevel - 1, ownershipCatalog)
    })
    if (kind === 'awakeners') {
      setAwakenerSortHasPendingChanges(true)
      return
    }
    setWheelSortHasPendingChanges(true)
  }

  function markFilteredOwned() {
    updateOwnership((prev) => {
      if (tab === 'awakeners') {
        return markFilteredAwakenerOwnership(
          prev,
          filteredAwakeners,
          awakenerIdByName,
          rememberedLevels.awakeners,
          ownershipCatalog,
        )
      }

      if (tab === 'wheels') {
        return markFilteredWheelOwnership(
          prev,
          filteredWheels,
          rememberedLevels.wheels,
          ownershipCatalog,
        )
      }

      return markFilteredPosseOwnership(
        prev,
        filteredPosses,
        rememberedLevels.posses,
        ownershipCatalog,
      )
    })
    markPendingCollectionSort(tab, setAwakenerSortHasPendingChanges, setWheelSortHasPendingChanges)
  }

  function markFilteredUnowned() {
    updateOwnership((prev) => {
      if (tab === 'awakeners') {
        return clearFilteredAwakenerOwnership(
          prev,
          filteredAwakeners,
          awakenerIdByName,
          rememberedLevels.awakeners,
          ownershipCatalog,
        )
      }

      if (tab === 'wheels') {
        return clearFilteredWheelOwnership(
          prev,
          filteredWheels,
          rememberedLevels.wheels,
          ownershipCatalog,
        )
      }

      return clearFilteredPosseOwnership(
        prev,
        filteredPosses,
        rememberedLevels.posses,
        ownershipCatalog,
      )
    })
    markPendingCollectionSort(tab, setAwakenerSortHasPendingChanges, setWheelSortHasPendingChanges)
  }

  function setFilteredEnlightenPreset(level: number) {
    const clampedLevel = clampOwnershipLevel(level)
    updateOwnership((prev) => {
      if (tab === 'awakeners') {
        return setFilteredAwakenerEnlighten(
          prev,
          filteredAwakeners,
          awakenerIdByName,
          clampedLevel,
          ownershipCatalog,
        )
      }

      if (tab === 'wheels') {
        return setFilteredWheelEnlighten(prev, filteredWheels, clampedLevel, ownershipCatalog)
      }

      return prev
    })

    markPendingCollectionSort(tab, setAwakenerSortHasPendingChanges, setWheelSortHasPendingChanges)
  }

  function setFilteredAwakenerLevelsPreset(mode: '0' | '60' | '+10' | '-10') {
    if (tab !== 'awakeners') {
      return
    }

    updateOwnership((prev) => {
      return applyFilteredAwakenerLevelPreset(
        prev,
        filteredAwakeners,
        awakenerIdByName,
        linkedAwakenerIdsById,
        mode,
        ownershipCatalog,
      )
    })
    setAwakenerSortHasPendingChanges(true)
  }

  function getAwakenerOwnedLevel(awakenerName: string): number | null {
    const awakenerId = awakenerIdByName.get(awakenerName)
    if (!awakenerId) {
      return null
    }
    return getOwnedLevel(ownership, 'awakeners', awakenerId)
  }

  function getAwakenerLevelByName(awakenerName: string): number {
    const awakenerId = awakenerIdByName.get(awakenerName)
    if (!awakenerId) {
      return 60
    }
    return getAwakenerLevel(ownership, awakenerId)
  }

  function setAwakenerLevelByName(awakenerName: string, level: number) {
    const awakenerId = awakenerIdByName.get(awakenerName)
    if (!awakenerId) {
      return
    }
    updateOwnership((prev) => setAwakenerLevel(prev, awakenerId, level, ownershipCatalog))
    setAwakenerSortHasPendingChanges(true)
  }

  function applyAwakenerSortChanges() {
    applyAwakenerSortFreeze()
  }

  function applyWheelSortChanges() {
    applyWheelSortFreeze()
  }

  useEffect(() => {
    if (skipNextOwnershipAutosaveRef.current) {
      skipNextOwnershipAutosaveRef.current = false
      return
    }

    const timeoutId = window.setTimeout(() => {
      saveOwnership()
    }, OWNERSHIP_AUTOSAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [ownership, saveOwnership])

  useEffect(() => {
    safeStorageWrite(
      storage,
      COLLECTION_AWAKENER_SORT_KEY,
      JSON.stringify({
        key: awakenerSortKey,
        direction: awakenerSortDirection,
        groupByRealm: awakenerSortGroupByRealm,
      } satisfies AwakenerSortConfig),
    )
  }, [storage, awakenerSortKey, awakenerSortDirection, awakenerSortGroupByRealm])

  return {
    tab,
    setTab,
    activeQuery,
    setQuery,
    appendSearchCharacter,
    removeSearchCharacter,
    clearActiveQuery,
    queryByTab,
    awakenerFilter,
    setAwakenerFilter,
    wheelRarityFilter,
    setWheelRarityFilter,
    wheelMainstatFilter,
    setWheelMainstatFilter,
    posseFilter,
    setPosseFilter,
    displayUnowned,
    setDisplayUnowned: setStoreDisplayUnowned,
    awakenerSortKey,
    setAwakenerSortKey,
    awakenerSortDirection,
    toggleAwakenerSortDirection: () => {
      setAwakenerSortDirection((current) => (current === 'DESC' ? 'ASC' : 'DESC'))
    },
    awakenerSortGroupByRealm,
    setAwakenerSortGroupByRealm,
    filteredPosses,
    getAwakenerOwnedLevel,
    getAwakenerLevel: getAwakenerLevelByName,
    setAwakenerLevel: setAwakenerLevelByName,
    getWheelOwnedLevel: (wheelId: string) => getOwnedLevel(ownership, 'wheels', wheelId),
    getPosseOwnedLevel: (posseId: string) => getOwnedLevel(ownership, 'posses', posseId),
    toggleOwned,
    increaseLevel,
    decreaseLevel,
    markFilteredOwned,
    markFilteredUnowned,
    setFilteredEnlightenPreset,
    setFilteredAwakenerLevelsPreset,
    exportOwnershipSnapshot,
    importOwnershipSnapshot: (rawSnapshot: string) => {
      const parsed = importOwnershipSnapshot(rawSnapshot)
      if (!parsed.ok) {
        return parsed
      }
      applyAwakenerSortFreeze()
      applyWheelSortFreeze()
      return parsed
    },
    awakenerIdByName,
    awakenerSortHasPendingChanges,
    applyAwakenerSortChanges,
    wheelSortHasPendingChanges,
    applyWheelSortChanges,
    filteredWheels: frozenFilteredWheels,
    filteredAwakeners: frozenFilteredAwakeners,
  }
}

export type CollectionViewModel = ReturnType<typeof useCollectionViewModel>
