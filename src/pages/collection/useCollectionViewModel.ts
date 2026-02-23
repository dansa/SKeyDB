import { useEffect, useMemo, useRef, useState } from 'react'
import { getAwakeners } from '../../domain/awakeners'
import { searchAwakeners } from '../../domain/awakeners-search'
import {
  clearOwnedEntry,
  createDefaultCollectionOwnershipCatalog,
  getOwnedLevel,
  loadCollectionOwnership,
  parseCollectionOwnershipSnapshot,
  saveCollectionOwnership,
  serializeCollectionOwnershipSnapshot,
  setOwnedLevel,
} from '../../domain/collection-ownership'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import { getPosses } from '../../domain/posses'
import { searchPosses } from '../../domain/posses-search'
import { getBrowserLocalStorage } from '../../domain/storage'
import { compareWheelsForUi } from '../../domain/wheel-sort'
import { getWheelMainstatLabel, getWheels } from '../../domain/wheels'
import {
  matchesWheelMainstat,
  type WheelMainstatFilter,
} from '../../domain/wheel-mainstat-filters'

type CollectionTab = 'awakeners' | 'wheels' | 'posses'
type AwakenerFilter = 'ALL' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
type PosseFilter = 'ALL' | 'FADED_LEGACY' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
type WheelRarityFilter = 'ALL' | 'SSR' | 'R' | 'SR'

const OWNERSHIP_AUTOSAVE_DEBOUNCE_MS = 220

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

export function useCollectionViewModel() {
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const ownershipCatalog = useMemo(() => createDefaultCollectionOwnershipCatalog(), [])
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
  const rememberedLevelsRef = useRef<Record<'awakeners' | 'wheels' | 'posses', Record<string, number>>>({
    awakeners: {},
    wheels: {},
    posses: {},
  })

  const awakeners = useMemo(
    () => [...getAwakeners()].sort((a, b) => formatAwakenerNameForUi(a.name).localeCompare(formatAwakenerNameForUi(b.name))),
    [],
  )
  const wheels = useMemo(
    () => [...getWheels()].sort(compareWheelsForUi),
    [],
  )
  const posses = useMemo(() => [...getPosses()].sort((a, b) => a.name.localeCompare(b.name)), [])

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
    return byFaction
  }, [awakenerFilter, searchedAwakeners])

  const searchedPosses = useMemo(
    () => searchPosses(posses, queryByTab.posses),
    [posses, queryByTab.posses],
  )
  const filteredPosses = useMemo(() => {
    const filtered =
      posseFilter === 'ALL'
        ? searchedPosses
        : posseFilter === 'FADED_LEGACY'
          ? searchedPosses.filter((posse) => posse.isFadedLegacy)
          : searchedPosses.filter((posse) => !posse.isFadedLegacy && posse.faction.trim().toUpperCase() === posseFilter)
    return filtered
  }, [searchedPosses, posseFilter])

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

    return matchingSearch
  }, [queryByTab.wheels, awakeners, wheelRarityFilter, wheelMainstatFilter, wheels])

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
  }

  function increaseLevel(kind: 'awakeners' | 'wheels', id: string) {
    setOwnership((prev) => {
      const currentLevel = getOwnedLevel(prev, kind, id)
      if (currentLevel === null) {
        return setOwnedLevel(prev, kind, id, 0, ownershipCatalog)
      }
      return setOwnedLevel(prev, kind, id, clampOwnershipLevel(currentLevel + 1), ownershipCatalog)
    })
  }

  function decreaseLevel(kind: 'awakeners' | 'wheels', id: string) {
    setOwnership((prev) => {
      const currentLevel = getOwnedLevel(prev, kind, id)
      if (currentLevel === null || currentLevel <= 0) {
        return prev
      }
      return setOwnedLevel(prev, kind, id, currentLevel - 1, ownershipCatalog)
    })
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
  }

  function getAwakenerOwnedLevel(awakenerName: string): number | null {
    const awakenerId = awakenerIdByName.get(awakenerName)
    if (!awakenerId) {
      return null
    }
    return getOwnedLevel(ownership, 'awakeners', awakenerId)
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      saveCollectionOwnership(storage, ownership, ownershipCatalog)
    }, OWNERSHIP_AUTOSAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [storage, ownership, ownershipCatalog])

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
    filteredAwakeners,
    filteredWheels,
    filteredPosses,
    getAwakenerOwnedLevel,
    getWheelOwnedLevel: (wheelId: string) => getOwnedLevel(ownership, 'wheels', wheelId),
    getPosseOwnedLevel: (posseId: string) => getOwnedLevel(ownership, 'posses', posseId),
    toggleOwned,
    increaseLevel,
    decreaseLevel,
    markFilteredOwned,
    markFilteredUnowned,
    exportOwnershipSnapshot: () => serializeCollectionOwnershipSnapshot(ownership, ownershipCatalog),
    importOwnershipSnapshot: (rawSnapshot: string) => {
      const parsed = parseCollectionOwnershipSnapshot(rawSnapshot, ownershipCatalog)
      if (!parsed.ok) {
        return parsed
      }
      setOwnership(parsed.state)
      return parsed
    },
    awakenerIdByName,
  }
}

export type CollectionViewModel = ReturnType<typeof useCollectionViewModel>
