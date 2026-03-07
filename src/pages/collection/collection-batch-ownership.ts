import type {Awakener} from '@/domain/awakeners'
import {
  clearOwnedEntry,
  getAwakenerLevel,
  getOwnedLevel,
  setAwakenerLevel,
  setOwnedLevel,
  type CollectionOwnershipCatalog,
  type CollectionOwnershipState,
} from '@/domain/collection-ownership'
import type {Posse} from '@/domain/posses'
import type {Wheel} from '@/domain/wheels'

export type RememberedOwnershipLevels = Partial<Record<string, number>>

function clampOwnershipLevel(level: number): number {
  if (level < 0) {
    return 0
  }
  if (level > 15) {
    return 15
  }
  return level
}

export {clampOwnershipLevel}

function clampAwakenerLevel(level: number): number {
  if (level < 1) {
    return 1
  }
  if (level > 90) {
    return 90
  }
  return level
}

export function stepAwakenerLevelByTen(level: number, direction: 1 | -1): number {
  if (direction > 0) {
    return level < 10 ? 10 : clampAwakenerLevel(level + 10)
  }
  return level <= 10 ? 1 : clampAwakenerLevel(level - 10)
}

export function clearFilteredAwakenerOwnership(
  ownership: CollectionOwnershipState,
  filteredAwakeners: readonly Awakener[],
  awakenerIdByName: Map<string, string>,
  rememberedAwakenerLevels: RememberedOwnershipLevels,
  ownershipCatalog: CollectionOwnershipCatalog,
): CollectionOwnershipState {
  let next = ownership

  for (const awakener of filteredAwakeners) {
    const awakenerId = awakenerIdByName.get(awakener.name)
    if (!awakenerId) {
      continue
    }

    const currentLevel = getOwnedLevel(next, 'awakeners', awakenerId)
    if (currentLevel !== null) {
      rememberedAwakenerLevels[awakenerId] = currentLevel
    }
    next = clearOwnedEntry(next, 'awakeners', awakenerId, ownershipCatalog)
  }

  return next
}

export function clearFilteredWheelOwnership(
  ownership: CollectionOwnershipState,
  filteredWheels: readonly Wheel[],
  rememberedWheelLevels: RememberedOwnershipLevels,
  ownershipCatalog: CollectionOwnershipCatalog,
): CollectionOwnershipState {
  let next = ownership

  for (const wheel of filteredWheels) {
    const currentLevel = getOwnedLevel(next, 'wheels', wheel.id)
    if (currentLevel !== null) {
      rememberedWheelLevels[wheel.id] = currentLevel
    }
    next = clearOwnedEntry(next, 'wheels', wheel.id, ownershipCatalog)
  }

  return next
}

export function clearFilteredPosseOwnership(
  ownership: CollectionOwnershipState,
  filteredPosses: readonly Posse[],
  rememberedPosseLevels: RememberedOwnershipLevels,
  ownershipCatalog: CollectionOwnershipCatalog,
): CollectionOwnershipState {
  let next = ownership

  for (const posse of filteredPosses) {
    const currentLevel = getOwnedLevel(next, 'posses', posse.id)
    if (currentLevel !== null) {
      rememberedPosseLevels[posse.id] = currentLevel
    }
    next = clearOwnedEntry(next, 'posses', posse.id, ownershipCatalog)
  }

  return next
}

export function setFilteredAwakenerEnlighten(
  ownership: CollectionOwnershipState,
  filteredAwakeners: readonly Awakener[],
  awakenerIdByName: Map<string, string>,
  clampedLevel: number,
  ownershipCatalog: CollectionOwnershipCatalog,
): CollectionOwnershipState {
  let next = ownership

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

export function setFilteredWheelEnlighten(
  ownership: CollectionOwnershipState,
  filteredWheels: readonly Wheel[],
  clampedLevel: number,
  ownershipCatalog: CollectionOwnershipCatalog,
): CollectionOwnershipState {
  let next = ownership

  for (const wheel of filteredWheels) {
    const currentOwnedLevel = getOwnedLevel(next, 'wheels', wheel.id)
    if (currentOwnedLevel === null) {
      continue
    }

    next = setOwnedLevel(next, 'wheels', wheel.id, clampedLevel, ownershipCatalog)
  }

  return next
}

function getFilteredAwakenerPresetLevel(mode: '0' | '60' | '+10' | '-10', currentLevel: number) {
  if (mode === '0') {
    return 1
  }

  if (mode === '60') {
    return 60
  }

  return mode === '+10'
    ? stepAwakenerLevelByTen(currentLevel, 1)
    : stepAwakenerLevelByTen(currentLevel, -1)
}

export function applyFilteredAwakenerLevelPreset(
  ownership: CollectionOwnershipState,
  filteredAwakeners: readonly Awakener[],
  awakenerIdByName: Map<string, string>,
  linkedAwakenerIdsById: Map<string, string[]>,
  mode: '0' | '60' | '+10' | '-10',
  ownershipCatalog: CollectionOwnershipCatalog,
): CollectionOwnershipState {
  let next = ownership
  const processedAwakenerIds = new Set<string>()

  for (const awakener of filteredAwakeners) {
    const awakenerId = awakenerIdByName.get(awakener.name)
    if (!awakenerId || processedAwakenerIds.has(awakenerId)) {
      continue
    }

    const ownedLevel = getOwnedLevel(next, 'awakeners', awakenerId)
    if (ownedLevel === null) {
      continue
    }

    const currentLevel = getAwakenerLevel(next, awakenerId)
    const nextLevel = getFilteredAwakenerPresetLevel(mode, currentLevel)
    next = setAwakenerLevel(next, awakenerId, nextLevel, ownershipCatalog)

    for (const linkedAwakenerId of linkedAwakenerIdsById.get(awakenerId) ?? [awakenerId]) {
      processedAwakenerIds.add(linkedAwakenerId)
    }
  }

  return next
}

export type CollectionTab = 'awakeners' | 'wheels' | 'posses'

export function markPendingCollectionSort(
  tab: CollectionTab,
  setAwakenerSortHasPendingChanges: (next: boolean) => void,
  setWheelSortHasPendingChanges: (next: boolean) => void,
) {
  if (tab === 'awakeners') {
    setAwakenerSortHasPendingChanges(true)
    return
  }

  if (tab === 'wheels') {
    setWheelSortHasPendingChanges(true)
  }
}
