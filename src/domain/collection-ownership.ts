import {getPublicAwakenerCatalogRecords} from '@/data-access/public-data/catalogScopes/awakenersCatalog'
import {getPublicCollectionCatalog} from '@/data-access/public-data/collectionRepository'

import {getAwakenerIdentityKey} from './awakener-identity'

export type CollectionOwnershipKind = 'awakeners' | 'wheels' | 'posses'

export interface CollectionOwnershipState {
  ownedAwakeners: Record<string, number>
  awakenerLevels: Record<string, number>
  ownedWheels: Record<string, number>
  ownedPosses: Record<string, number>
  displayUnowned: boolean
}

export interface CollectionOwnershipCatalog {
  awakenerIds: Iterable<string>
  wheelIds: Iterable<string>
  posseIds: Iterable<string>
  linkedAwakenerGroups?: string[][]
}

function createDefaultOwnedMap(ids: Iterable<string>): Record<string, number> {
  const ownedMap: Record<string, number> = {}
  for (const id of ids) {
    ownedMap[id] = 0
  }
  return ownedMap
}

function createSeedCollectionOwnershipState(
  catalog: CollectionOwnershipCatalog,
): CollectionOwnershipState {
  const awakenerLevelMap: Record<string, number> = {}
  for (const id of catalog.awakenerIds) {
    awakenerLevelMap[id] = 60
  }
  return {
    ownedAwakeners: createDefaultOwnedMap(catalog.awakenerIds),
    awakenerLevels: awakenerLevelMap,
    ownedWheels: createDefaultOwnedMap(catalog.wheelIds),
    ownedPosses: createDefaultOwnedMap(catalog.posseIds),
    displayUnowned: true,
  }
}

function toAllowedSet(values: Iterable<string>): Set<string> {
  return new Set(values)
}

function normalizeLevel(value: unknown): number | null {
  if (value === true) {
    return 0
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = Math.floor(value)
    if (normalized < 0) {
      return null
    }
    if (normalized > 15) {
      return 15
    }
    return normalized
  }
  return null
}

function normalizePosseLevel(value: unknown): number | null {
  const normalized = normalizeLevel(value)
  if (normalized === null) {
    return null
  }
  return 0
}

function normalizeAwakenerLevel(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 60
  }
  const normalized = Math.floor(value)
  if (normalized < 1) {
    return 1
  }
  if (normalized > 90) {
    return 90
  }
  return normalized
}

export function normalizeCollectionAwakenerLevelMap(
  rawMap: unknown,
  allowedIds: Iterable<string>,
  resolveId: (id: string) => string | null = (id) => id,
): Record<string, number> {
  const source = rawMap && typeof rawMap === 'object' ? (rawMap as Record<string, unknown>) : {}
  const output: Record<string, number> = {}
  const allowedIdSet = toAllowedSet(allowedIds)
  const resolvedSource = new Map<string, unknown>()
  for (const [id, rawValue] of Object.entries(source)) {
    const resolvedId = resolveId(id)
    if (resolvedId && allowedIdSet.has(resolvedId)) {
      const previousValue = resolvedSource.get(resolvedId)
      const normalizedValue = normalizeAwakenerLevel(rawValue)
      resolvedSource.set(
        resolvedId,
        previousValue === undefined
          ? normalizedValue
          : Math.max(normalizeAwakenerLevel(previousValue), normalizedValue),
      )
    }
  }
  for (const id of allowedIds) {
    output[id] = normalizeAwakenerLevel(resolvedSource.get(id))
  }
  return output
}

function normalizeOwnedMap(
  rawMap: unknown,
  allowedIds: Set<string>,
  resolveId: (id: string) => string | null = (id) => id,
): Record<string, number> {
  if (!rawMap || typeof rawMap !== 'object') {
    return {}
  }

  const output: Record<string, number> = {}
  for (const [id, rawValue] of Object.entries(rawMap as Record<string, unknown>)) {
    const resolvedId = resolveId(id)
    if (!resolvedId || !allowedIds.has(resolvedId)) {
      continue
    }
    const level = normalizeLevel(rawValue)
    if (level !== null) {
      output[resolvedId] = Math.max(output[resolvedId] ?? 0, level)
    }
  }
  return output
}

function normalizePosseOwnedMap(
  rawMap: unknown,
  allowedIds: Set<string>,
  resolveId: (id: string) => string | null = (id) => id,
): Record<string, number> {
  if (!rawMap || typeof rawMap !== 'object') {
    return {}
  }

  const output: Record<string, number> = {}
  for (const [id, rawValue] of Object.entries(rawMap as Record<string, unknown>)) {
    const resolvedId = resolveId(id)
    if (!resolvedId || !allowedIds.has(resolvedId)) {
      continue
    }
    const level = normalizePosseLevel(rawValue)
    if (level !== null) {
      output[resolvedId] = 0
    }
  }
  return output
}

function unifyLinkedGroupLevels(
  map: Record<string, number>,
  allowedIds: Set<string>,
  linkedGroups: string[][] | undefined,
): Record<string, number> {
  if (!linkedGroups?.length) {
    return map
  }

  const next = {...map}
  for (const group of linkedGroups) {
    const validGroup = group.filter((id) => allowedIds.has(id))
    if (validGroup.length < 2) {
      continue
    }

    const groupLevels = validGroup
      .map((id) => next[id])
      .filter((value): value is number => typeof value === 'number')
    if (!groupLevels.length) {
      continue
    }

    const unifiedLevel = Math.max(...groupLevels)
    for (const id of validGroup) {
      next[id] = unifiedLevel
    }
  }

  return next
}

function normalizeLinkedAwakenerLevelMap(
  rawMap: unknown,
  catalog: CollectionOwnershipCatalog,
  allowedIds: Set<string>,
  resolveId: (id: string) => string | null = (id) => id,
): Record<string, number> {
  const source = rawMap && typeof rawMap === 'object' ? (rawMap as Record<string, unknown>) : {}
  const sparseLevels: Record<string, number> = {}
  for (const [id, rawValue] of Object.entries(source)) {
    const resolvedId = resolveId(id)
    if (!resolvedId || !allowedIds.has(resolvedId)) {
      continue
    }
    sparseLevels[resolvedId] = Math.max(
      sparseLevels[resolvedId] ?? 0,
      normalizeAwakenerLevel(rawValue),
    )
  }

  const unifiedLevels = unifyLinkedGroupLevels(
    sparseLevels,
    allowedIds,
    catalog.linkedAwakenerGroups,
  )
  const output: Record<string, number> = {}
  for (const id of catalog.awakenerIds) {
    output[id] = normalizeAwakenerLevel(unifiedLevels[id])
  }
  return output
}

export interface CollectionOwnershipStateIdResolvers {
  awakenerId?: (id: string) => string | null
  wheelId?: (id: string) => string | null
  posseId?: (id: string) => string | null
}

export function normalizeCollectionOwnershipState(
  rawState: unknown,
  catalog: CollectionOwnershipCatalog,
  idResolvers: CollectionOwnershipStateIdResolvers = {},
): CollectionOwnershipState {
  if (!rawState || typeof rawState !== 'object') {
    return createSeedCollectionOwnershipState(catalog)
  }

  const state = rawState as Record<string, unknown>
  const awakenerIdSet = toAllowedSet(catalog.awakenerIds)
  return {
    ownedAwakeners: unifyLinkedGroupLevels(
      normalizeOwnedMap(state.ownedAwakeners, awakenerIdSet, idResolvers.awakenerId),
      awakenerIdSet,
      catalog.linkedAwakenerGroups,
    ),
    awakenerLevels: normalizeLinkedAwakenerLevelMap(
      state.awakenerLevels,
      catalog,
      awakenerIdSet,
      idResolvers.awakenerId,
    ),
    ownedWheels: normalizeOwnedMap(
      state.ownedWheels,
      toAllowedSet(catalog.wheelIds),
      idResolvers.wheelId,
    ),
    ownedPosses: normalizePosseOwnedMap(
      state.ownedPosses,
      toAllowedSet(catalog.posseIds),
      idResolvers.posseId,
    ),
    displayUnowned: state.displayUnowned !== false,
  }
}

function getOwnershipMap(
  state: CollectionOwnershipState,
  kind: CollectionOwnershipKind,
): Record<string, number> {
  if (kind === 'awakeners') {
    return state.ownedAwakeners
  }
  if (kind === 'wheels') {
    return state.ownedWheels
  }
  return state.ownedPosses
}

function omitOwnershipIds(
  map: Record<string, number>,
  ids: Iterable<string>,
): Record<string, number> {
  const omittedIds = new Set(ids)
  return Object.fromEntries(Object.entries(map).filter(([entryId]) => !omittedIds.has(entryId)))
}

export function createDefaultCollectionOwnershipCatalog(): CollectionOwnershipCatalog {
  const catalog = getPublicCollectionCatalog()
  const awakenerIds = catalog.collectables.awakeners
  const allowedAwakenerIds = new Set(awakenerIds)
  const linkedAwakenerIdsByIdentity = new Map<string, string[]>()
  for (const awakener of getPublicAwakenerCatalogRecords()) {
    if (!allowedAwakenerIds.has(awakener.id)) {
      continue
    }
    const identityKey = getAwakenerIdentityKey(awakener.name)
    const entry = linkedAwakenerIdsByIdentity.get(identityKey)
    if (entry) {
      entry.push(awakener.id)
    } else {
      linkedAwakenerIdsByIdentity.set(identityKey, [awakener.id])
    }
  }

  const linkedAwakenerGroups: string[][] = []
  for (const group of linkedAwakenerIdsByIdentity.values()) {
    if (group.length > 1) {
      linkedAwakenerGroups.push(group.toSorted((left, right) => left.localeCompare(right)))
    }
  }

  return {
    awakenerIds,
    wheelIds: catalog.collectables.wheels,
    posseIds: catalog.collectables.posses,
    linkedAwakenerGroups,
  }
}

export function createEmptyCollectionOwnershipState(): CollectionOwnershipState {
  const catalog = createDefaultCollectionOwnershipCatalog()
  return normalizeCollectionOwnershipState(createSeedCollectionOwnershipState(catalog), catalog)
}

export function isOwned(
  state: CollectionOwnershipState,
  kind: CollectionOwnershipKind,
  id: string,
): boolean {
  return id in getOwnershipMap(state, kind)
}

export function getOwnedLevel(
  state: CollectionOwnershipState,
  kind: CollectionOwnershipKind,
  id: string,
): number | null {
  const value = getOwnershipMap(state, kind)[id]
  return typeof value === 'number' ? value : null
}

function withLinkedAwakenerLevel(
  map: Record<string, number>,
  id: string,
  level: number,
  linkedAwakenerGroups: string[][] | undefined,
): Record<string, number> {
  const next = {...map}
  next[id] = level
  if (!linkedAwakenerGroups?.length) {
    return next
  }
  const matchingGroup = linkedAwakenerGroups.find((group) => group.includes(id))
  if (!matchingGroup) {
    return next
  }

  for (const linkedId of matchingGroup) {
    next[linkedId] = level
  }
  return next
}

function withoutLinkedAwakenerEntries(
  map: Record<string, number>,
  id: string,
  linkedAwakenerGroups: string[][] | undefined,
): Record<string, number> {
  if (!linkedAwakenerGroups?.length) {
    return map
  }
  const matchingGroup = linkedAwakenerGroups.find((group) => group.includes(id))
  if (!matchingGroup) {
    return map
  }

  return omitOwnershipIds(map, matchingGroup)
}

export function setOwnedLevel(
  state: CollectionOwnershipState,
  kind: CollectionOwnershipKind,
  id: string,
  level: number,
  catalog: CollectionOwnershipCatalog = createDefaultCollectionOwnershipCatalog(),
): CollectionOwnershipState {
  const nextLevel = kind === 'posses' ? normalizePosseLevel(level) : normalizeLevel(level)
  const currentMap = getOwnershipMap(state, kind)
  const nextMap = {...currentMap}
  if (nextLevel !== null) {
    nextMap[id] = nextLevel
  }
  const normalizedNextMap = nextLevel !== null ? nextMap : omitOwnershipIds(nextMap, [id])

  if (kind === 'awakeners') {
    if (nextLevel === null) {
      return {
        ...state,
        ownedAwakeners: withoutLinkedAwakenerEntries(
          normalizedNextMap,
          id,
          catalog.linkedAwakenerGroups,
        ),
      }
    }
    return {
      ...state,
      ownedAwakeners: withLinkedAwakenerLevel(
        normalizedNextMap,
        id,
        nextLevel,
        catalog.linkedAwakenerGroups,
      ),
    }
  }
  if (kind === 'wheels') {
    return {...state, ownedWheels: normalizedNextMap}
  }
  return {...state, ownedPosses: normalizedNextMap}
}

export function clearOwnedEntry(
  state: CollectionOwnershipState,
  kind: CollectionOwnershipKind,
  id: string,
  catalog: CollectionOwnershipCatalog = createDefaultCollectionOwnershipCatalog(),
): CollectionOwnershipState {
  const currentMap = getOwnershipMap(state, kind)
  if (!(id in currentMap)) {
    return state
  }

  const nextMap = omitOwnershipIds(currentMap, [id])

  if (kind === 'awakeners') {
    return {
      ...state,
      ownedAwakeners: withoutLinkedAwakenerEntries(nextMap, id, catalog.linkedAwakenerGroups),
    }
  }
  if (kind === 'wheels') {
    return {...state, ownedWheels: nextMap}
  }
  return {...state, ownedPosses: nextMap}
}

export function setDisplayUnowned(
  state: CollectionOwnershipState,
  displayUnowned: boolean,
): CollectionOwnershipState {
  return {...state, displayUnowned}
}

export function getAwakenerLevel(state: CollectionOwnershipState, id: string): number {
  return normalizeAwakenerLevel(state.awakenerLevels[id])
}

export function setAwakenerLevel(
  state: CollectionOwnershipState,
  id: string,
  level: number,
  catalog: CollectionOwnershipCatalog = createDefaultCollectionOwnershipCatalog(),
): CollectionOwnershipState {
  const normalizedLevel = normalizeAwakenerLevel(level)
  return {
    ...state,
    awakenerLevels: withLinkedAwakenerLevel(
      state.awakenerLevels,
      id,
      normalizedLevel,
      catalog.linkedAwakenerGroups,
    ),
  }
}
