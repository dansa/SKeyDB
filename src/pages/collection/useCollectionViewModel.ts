import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAwakeners } from '../../domain/awakeners'
import { searchAwakeners } from '../../domain/awakeners-search'
import {
  clearOwnedEntry,
  createDefaultCollectionOwnershipCatalog,
  getAwakenerLevel,
  getOwnedLevel,
  loadCollectionOwnership,
  parseCollectionOwnershipSnapshot,
  saveCollectionOwnership,
  serializeCollectionOwnershipSnapshot,
  setAwakenerLevel,
  setOwnedLevel,
} from '../../domain/collection-ownership'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import { getPosses } from '../../domain/posses'
import { searchPosses } from '../../domain/posses-search'
import { getBrowserLocalStorage, safeStorageRead, safeStorageWrite, type StorageLike } from '../../domain/storage'
import { compareWheelsForUi } from '../../domain/wheel-sort'
import { getWheelMainstatLabel, getWheels } from '../../domain/wheels'
import {
  matchesWheelMainstat,
  type WheelMainstatFilter,
} from '../../domain/wheel-mainstat-filters'
import {
  compareAwakenersForCollectionSort,
  comparePossesForCollectionDefaultSort,
  compareWheelsForCollectionDefaultSort,
  DEFAULT_AWAKENER_SORT_CONFIG,
  type AwakenerSortConfig,
  type AwakenerSortKey,
  type CollectionSortDirection,
} from '../../domain/collection-sorting'

type CollectionTab = 'awakeners' | 'wheels' | 'posses'
type AwakenerFilter = 'ALL' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
type PosseFilter = 'ALL' | 'FADED_LEGACY' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
type WheelRarityFilter = 'ALL' | 'SSR' | 'R' | 'SR'

const OWNERSHIP_AUTOSAVE_DEBOUNCE_MS = 220
const COLLECTION_AWAKENER_SORT_KEY = 'skeydb.collection.awakenerSort.v1'

function normalizeForSearch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function clampOwnershipLevel(level: number): number {
  if (level < 0) {
    return 0
  }
  if (level > 15) {
    return 15
  }
  return level
}

function clampAwakenerLevel(level: number): number {
  if (level < 1) {
    return 1
  }
  if (level > 90) {
    return 90
  }
  return level
}

function stepAwakenerLevelByTen(level: number, direction: 1 | -1): number {
  if (direction > 0) {
    return level < 10 ? 10 : clampAwakenerLevel(level + 10)
  }
  return level <= 10 ? 1 : clampAwakenerLevel(level - 10)
}

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

function useLatestRef<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
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
  return mergedOrder
    .map((id) => itemById.get(id))
    .flatMap((item) => (item ? [item] : []))
}

function useFrozenSortOrder<T>(items: T[], getItemId: (item: T) => string) {
  const [appliedOrder, setAppliedOrder] = useState<string[]>([])
  const [hasPendingChanges, setHasPendingChanges] = useState(false)

  const liveOrder = useMemo(() => items.map(getItemId), [items, getItemId])
  const liveOrderRef = useLatestRef(liveOrder)

  const frozenItems = useMemo(
    () => freezeItemsByAppliedOrder(items, liveOrder, appliedOrder, getItemId),
    [items, liveOrder, appliedOrder, getItemId],
  )

  const applyChanges = useCallback(() => {
    setAppliedOrder(liveOrderRef.current)
    setHasPendingChanges(false)
  }, [liveOrderRef])

  return {
    frozenItems,
    hasPendingChanges,
    setHasPendingChanges,
    applyChanges,
  }
}

function loadAwakenerSortConfig(storage: StorageLike | null): AwakenerSortConfig {
  try {
    const raw = safeStorageRead(storage, COLLECTION_AWAKENER_SORT_KEY)
    if (!raw) {
      return DEFAULT_AWAKENER_SORT_CONFIG
    }

    const parsed = JSON.parse(raw) as Partial<AwakenerSortConfig>
    const key = parsed.key
    const direction = parsed.direction
    return {
      key:
        key === 'LEVEL' || key === 'RARITY' || key === 'ENLIGHTEN' || key === 'ALPHABETICAL'
          ? key
          : DEFAULT_AWAKENER_SORT_CONFIG.key,
      direction: direction === 'ASC' || direction === 'DESC' ? direction : DEFAULT_AWAKENER_SORT_CONFIG.direction,
      groupByFaction:
        typeof parsed.groupByFaction === 'boolean'
          ? parsed.groupByFaction
          : DEFAULT_AWAKENER_SORT_CONFIG.groupByFaction,
    }
  } catch {
    return DEFAULT_AWAKENER_SORT_CONFIG
  }
}

export function useCollectionViewModel() {
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const ownershipCatalog = useMemo(() => createDefaultCollectionOwnershipCatalog(), [])
  const persistedAwakenerSortConfig = useMemo(() => loadAwakenerSortConfig(storage), [storage])
  const [ownership, setOwnership] = useState(() => loadCollectionOwnership(storage, ownershipCatalog))
  const [tab, setTab] = useState<CollectionTab>('awakeners')
  const [queryByTab, setQueryByTab] = useState<Record<CollectionTab, string>>({
    awakeners: '',
    wheels: '',
    posses: '',
  })
  const [awakenerFilter, setAwakenerFilter] = useState<AwakenerFilter>('ALL')
  const [wheelRarityFilter, setWheelRarityFilter] = useState<WheelRarityFilter>('ALL')
  const [wheelMainstatFilter, setWheelMainstatFilter] = useState<WheelMainstatFilter>('ALL')
  const [posseFilter, setPosseFilter] = useState<PosseFilter>('ALL')
  const [displayUnowned, setDisplayUnowned] = useState(true)
  const [awakenerSortKey, setAwakenerSortKey] = useState<AwakenerSortKey>(persistedAwakenerSortConfig.key)
  const [awakenerSortDirection, setAwakenerSortDirection] = useState<CollectionSortDirection>(
    persistedAwakenerSortConfig.direction,
  )
  const [awakenerSortGroupByFaction, setAwakenerSortGroupByFaction] = useState(persistedAwakenerSortConfig.groupByFaction)
  const rememberedLevelsRef = useRef<Record<'awakeners' | 'wheels' | 'posses', Record<string, number>>>({
    awakeners: {},
    wheels: {},
    posses: {},
  })

  const awakeners = useMemo(
    () => [...getAwakeners()].sort((a, b) => formatAwakenerNameForUi(a.name).localeCompare(formatAwakenerNameForUi(b.name))),
    [],
  )
  const linkedAwakenerIdsById = useMemo(
    () => createLinkedAwakenerIdLookup(ownershipCatalog.linkedAwakenerGroups),
    [ownershipCatalog],
  )
  const wheels = useMemo(
    () => [...getWheels()].sort(compareWheelsForUi),
    [],
  )
  const wheelIndexById = useMemo(() => new Map(wheels.map((wheel, index) => [wheel.id, index])), [wheels])
  const posses = useMemo(() => [...getPosses()], [])

  const activeQuery = queryByTab[tab]
  const awakenerIdByName = useMemo(() => new Map(awakeners.map((awakener) => [awakener.name, String(awakener.id)])), [awakeners])
  const searchedAwakeners = useMemo(
    () => searchAwakeners(awakeners, queryByTab.awakeners),
    [awakeners, queryByTab.awakeners],
  )
  const filteredAwakeners = useMemo(() => {
    const byFaction =
      awakenerFilter === 'ALL'
        ? searchedAwakeners
        : searchedAwakeners.filter((awakener) => awakener.faction.trim().toUpperCase() === awakenerFilter)
    const byOwnership = displayUnowned
      ? byFaction
      : byFaction.filter((awakener) => {
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
          index: left.id,
          owned: leftIsOwned,
          enlighten: leftIsOwned ? leftOwnedLevel : 0,
          level: leftAwakenerLevel,
          rarity: left.rarity,
          faction: left.faction,
        },
        {
          label: formatAwakenerNameForUi(right.name),
          index: right.id,
          owned: rightIsOwned,
          enlighten: rightIsOwned ? rightOwnedLevel : 0,
          level: rightAwakenerLevel,
          rarity: right.rarity,
          faction: right.faction,
        },
        {
          key: awakenerSortKey,
          direction: awakenerSortDirection,
          groupByFaction: awakenerSortGroupByFaction,
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
    awakenerSortGroupByFaction,
  ])
  const {
    frozenItems: frozenFilteredAwakeners,
    hasPendingChanges: awakenerSortHasPendingChanges,
    setHasPendingChanges: setAwakenerSortHasPendingChanges,
    applyChanges: applyAwakenerSortFreeze,
  } = useFrozenSortOrder(filteredAwakeners, (awakener) => awakener.name)

  const searchedPosses = useMemo(
    () => searchPosses(posses, queryByTab.posses),
    [posses, queryByTab.posses],
  )
  const filteredPosses = useMemo(() => {
    const filteredByCategory =
      posseFilter === 'ALL'
        ? searchedPosses
        : posseFilter === 'FADED_LEGACY'
          ? searchedPosses.filter((posse) => posse.isFadedLegacy)
          : searchedPosses.filter((posse) => !posse.isFadedLegacy && posse.faction.trim().toUpperCase() === posseFilter)
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
    const query = queryByTab.wheels.trim().toLowerCase()
    const normalizedQuery = normalizeForSearch(query)
    const matchedAwakenerNames =
      normalizedQuery.length > 0
        ? new Set(
            awakeners
              .filter((awakener) =>
                [awakener.name, ...awakener.aliases].some((value) => normalizeForSearch(value).includes(normalizedQuery)),
              )
              .map((awakener) => awakener.name.toLowerCase()),
          )
        : null
    const wheelsByRarity =
      wheelRarityFilter === 'ALL' ? wheels : wheels.filter((wheel) => wheel.rarity === wheelRarityFilter)
    const wheelsByMainstat =
      wheelMainstatFilter === 'ALL'
        ? wheelsByRarity
        : wheelsByRarity.filter((wheel) => matchesWheelMainstat(wheel.mainstatKey, wheelMainstatFilter))

    const matchingSearch = !query
      ? wheelsByMainstat
      : wheelsByMainstat.filter(
          (wheel) =>
            wheel.name.toLowerCase().includes(query) ||
            wheel.id.toLowerCase().includes(query) ||
            wheel.rarity.toLowerCase().includes(query) ||
            wheel.faction.toLowerCase().includes(query) ||
            wheel.awakener.toLowerCase().includes(query) ||
            getWheelMainstatLabel(wheel).toLowerCase().includes(query) ||
            wheel.mainstatKey.toLowerCase().includes(query) ||
            Boolean(matchedAwakenerNames?.has(wheel.awakener.toLowerCase())),
        )

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
          faction: left.faction,
        },
        {
          label: right.name,
          index: wheelIndexById.get(right.id) ?? Number.MAX_SAFE_INTEGER,
          owned: getOwnedLevel(ownership, 'wheels', right.id) !== null,
          enlighten: getOwnedLevel(ownership, 'wheels', right.id) ?? 0,
          rarity: right.rarity,
          faction: right.faction,
        },
      ),
    )
  }, [
    queryByTab.wheels,
    awakeners,
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
    setHasPendingChanges: setWheelSortHasPendingChanges,
    applyChanges: applyWheelSortFreeze,
  } = useFrozenSortOrder(filteredWheels, (wheel) => wheel.id)

  useEffect(() => {
    applyAwakenerSortFreeze()
  }, [
    awakenerFilter,
    queryByTab.awakeners,
    displayUnowned,
    awakenerSortKey,
    awakenerSortDirection,
    awakenerSortGroupByFaction,
    applyAwakenerSortFreeze,
  ])
  useEffect(() => {
    applyWheelSortFreeze()
  }, [queryByTab.wheels, displayUnowned, wheelRarityFilter, wheelMainstatFilter, applyWheelSortFreeze])

  function setQuery(value: string) {
    setQueryByTab((prev) => ({ ...prev, [tab]: value }))
  }

  function appendSearchCharacter(key: string) {
    setQueryByTab((prev) => ({ ...prev, [tab]: `${prev[tab]}${key}` }))
  }

  function clearActiveQuery() {
    setQueryByTab((prev) => {
      if (!prev[tab]) {
        return prev
      }
      return { ...prev, [tab]: '' }
    })
  }

  function toggleOwned(kind: 'awakeners' | 'wheels' | 'posses', id: string) {
    setOwnership((prev) => {
      const currentLevel = getOwnedLevel(prev, kind, id)
      if (currentLevel === null) {
        const rememberedLevel = rememberedLevelsRef.current[kind][id]
        return setOwnedLevel(prev, kind, id, rememberedLevel ?? 0, ownershipCatalog)
      }
      rememberedLevelsRef.current[kind][id] = currentLevel
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
    setOwnership((prev) => {
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
    if (kind === 'wheels') {
      setWheelSortHasPendingChanges(true)
    }
  }

  function decreaseLevel(kind: 'awakeners' | 'wheels', id: string) {
    setOwnership((prev) => {
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
    if (kind === 'wheels') {
      setWheelSortHasPendingChanges(true)
    }
  }

  function markFilteredOwned() {
    setOwnership((prev) => {
      let next = prev

      if (tab === 'awakeners') {
        for (const awakener of filteredAwakeners) {
          const awakenerId = awakenerIdByName.get(awakener.name)
          if (!awakenerId) {
            continue
          }
          const currentLevel = getOwnedLevel(next, 'awakeners', awakenerId)
          const rememberedLevel = rememberedLevelsRef.current.awakeners[awakenerId]
          next = setOwnedLevel(next, 'awakeners', awakenerId, currentLevel ?? rememberedLevel ?? 0, ownershipCatalog)
        }
        return next
      }

      if (tab === 'wheels') {
        for (const wheel of filteredWheels) {
          const currentLevel = getOwnedLevel(next, 'wheels', wheel.id)
          const rememberedLevel = rememberedLevelsRef.current.wheels[wheel.id]
          next = setOwnedLevel(next, 'wheels', wheel.id, currentLevel ?? rememberedLevel ?? 0, ownershipCatalog)
        }
        return next
      }

      for (const posse of filteredPosses) {
        const currentLevel = getOwnedLevel(next, 'posses', posse.id)
        const rememberedLevel = rememberedLevelsRef.current.posses[posse.id]
        next = setOwnedLevel(next, 'posses', posse.id, currentLevel ?? rememberedLevel ?? 0, ownershipCatalog)
      }
      return next
    })
    if (tab === 'awakeners') {
      setAwakenerSortHasPendingChanges(true)
      return
    }
    if (tab === 'wheels') {
      setWheelSortHasPendingChanges(true)
    }
  }

  function markFilteredUnowned() {
    setOwnership((prev) => {
      let next = prev

      if (tab === 'awakeners') {
        for (const awakener of filteredAwakeners) {
          const awakenerId = awakenerIdByName.get(awakener.name)
          if (!awakenerId) {
            continue
          }
          const currentLevel = getOwnedLevel(next, 'awakeners', awakenerId)
          if (currentLevel !== null) {
            rememberedLevelsRef.current.awakeners[awakenerId] = currentLevel
          }
          next = clearOwnedEntry(next, 'awakeners', awakenerId, ownershipCatalog)
        }
        return next
      }

      if (tab === 'wheels') {
        for (const wheel of filteredWheels) {
          const currentLevel = getOwnedLevel(next, 'wheels', wheel.id)
          if (currentLevel !== null) {
            rememberedLevelsRef.current.wheels[wheel.id] = currentLevel
          }
          next = clearOwnedEntry(next, 'wheels', wheel.id, ownershipCatalog)
        }
        return next
      }

      for (const posse of filteredPosses) {
        const currentLevel = getOwnedLevel(next, 'posses', posse.id)
        if (currentLevel !== null) {
          rememberedLevelsRef.current.posses[posse.id] = currentLevel
        }
        next = clearOwnedEntry(next, 'posses', posse.id, ownershipCatalog)
      }
      return next
    })
    if (tab === 'awakeners') {
      setAwakenerSortHasPendingChanges(true)
      return
    }
    if (tab === 'wheels') {
      setWheelSortHasPendingChanges(true)
    }
  }

  function setFilteredEnlightenPreset(level: number) {
    const clampedLevel = clampOwnershipLevel(level)
    setOwnership((prev) => {
      let next = prev
      if (tab === 'awakeners') {
        for (const awakener of filteredAwakeners) {
          const awakenerId = awakenerIdByName.get(awakener.name)
          if (!awakenerId) {
            continue
          }
          const currentOwnedLevel = getOwnedLevel(next, 'awakeners', awakenerId)
          if (currentOwnedLevel === null) {
            continue
          }
          next = setOwnedLevel(next, 'awakeners', awakenerId, clampedLevel, ownershipCatalog)
        }
        return next
      }

      if (tab === 'wheels') {
        for (const wheel of filteredWheels) {
          const currentOwnedLevel = getOwnedLevel(next, 'wheels', wheel.id)
          if (currentOwnedLevel === null) {
            continue
          }
          next = setOwnedLevel(next, 'wheels', wheel.id, clampedLevel, ownershipCatalog)
        }
      }
      return next
    })

    if (tab === 'awakeners') {
      setAwakenerSortHasPendingChanges(true)
      return
    }
    if (tab === 'wheels') {
      setWheelSortHasPendingChanges(true)
    }
  }

  function setFilteredAwakenerLevelsPreset(mode: '0' | '60' | '+10' | '-10') {
    if (tab !== 'awakeners') {
      return
    }
    setOwnership((prev) => {
      let next = prev
      const processedAwakenerIds = new Set<string>()
      for (const awakener of filteredAwakeners) {
        const awakenerId = awakenerIdByName.get(awakener.name)
        if (!awakenerId) {
          continue
        }
        if (processedAwakenerIds.has(awakenerId)) {
          continue
        }
        const ownedLevel = getOwnedLevel(next, 'awakeners', awakenerId)
        if (ownedLevel === null) {
          continue
        }
        const currentLevel = getAwakenerLevel(next, awakenerId)
        const nextLevel =
          mode === '0'
            ? 1
            : mode === '60'
              ? 60
              : mode === '+10'
                ? stepAwakenerLevelByTen(currentLevel, 1)
                : stepAwakenerLevelByTen(currentLevel, -1)
        next = setAwakenerLevel(next, awakenerId, nextLevel, ownershipCatalog)
        const linkedAwakenerIds = linkedAwakenerIdsById.get(awakenerId) ?? [awakenerId]
        for (const linkedAwakenerId of linkedAwakenerIds) {
          processedAwakenerIds.add(linkedAwakenerId)
        }
      }
      return next
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
    setOwnership((prev) => setAwakenerLevel(prev, awakenerId, level, ownershipCatalog))
    setAwakenerSortHasPendingChanges(true)
  }

  function applyAwakenerSortChanges() {
    applyAwakenerSortFreeze()
  }

  function applyWheelSortChanges() {
    applyWheelSortFreeze()
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      saveCollectionOwnership(storage, ownership, ownershipCatalog)
    }, OWNERSHIP_AUTOSAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [storage, ownership, ownershipCatalog])

  useEffect(() => {
    safeStorageWrite(
      storage,
      COLLECTION_AWAKENER_SORT_KEY,
      JSON.stringify({
        key: awakenerSortKey,
        direction: awakenerSortDirection,
        groupByFaction: awakenerSortGroupByFaction,
      } satisfies AwakenerSortConfig),
    )
  }, [storage, awakenerSortKey, awakenerSortDirection, awakenerSortGroupByFaction])

  return {
    tab,
    setTab,
    activeQuery,
    setQuery,
    appendSearchCharacter,
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
    setDisplayUnowned,
    awakenerSortKey,
    setAwakenerSortKey,
    awakenerSortDirection,
    toggleAwakenerSortDirection: () =>
      setAwakenerSortDirection((current) => (current === 'DESC' ? 'ASC' : 'DESC')),
    awakenerSortGroupByFaction,
    setAwakenerSortGroupByFaction,
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
    exportOwnershipSnapshot: () => serializeCollectionOwnershipSnapshot(ownership, ownershipCatalog),
    importOwnershipSnapshot: (rawSnapshot: string) => {
      const parsed = parseCollectionOwnershipSnapshot(rawSnapshot, ownershipCatalog)
      if (!parsed.ok) {
        return parsed
      }
      setOwnership(parsed.state)
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
