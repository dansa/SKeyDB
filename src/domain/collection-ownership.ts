import { getAwakeners } from './awakeners'
import { getAwakenerIdentityKey } from './awakener-identity'
import { getPosses } from './posses'
import { getWheels } from './wheels'
import type { StorageLike } from './storage'
import { safeStorageRead, safeStorageRemove, safeStorageWrite } from './storage'

const COLLECTION_OWNERSHIP_VERSION = 1

export const COLLECTION_OWNERSHIP_KEY = `skeydb.collection.v${COLLECTION_OWNERSHIP_VERSION}`

export type CollectionOwnershipKind = 'awakeners' | 'wheels' | 'posses'

export type CollectionOwnershipState = {
  ownedAwakeners: Record<string, number>
  awakenerLevels: Record<string, number>
  ownedWheels: Record<string, number>
  ownedPosses: Record<string, number>
  displayUnowned: boolean
}

export type CollectionOwnershipCatalog = {
  awakenerIds: Iterable<string>
  wheelIds: Iterable<string>
  posseIds: Iterable<string>
  linkedAwakenerGroups?: string[][]
}

type CollectionOwnershipEnvelope = {
  version: number
  updatedAt: string
  payload: CollectionOwnershipState
}

export type ParseCollectionOwnershipSnapshotResult =
  | { ok: true; state: CollectionOwnershipState }
  | { ok: false; error: 'invalid_json' | 'unsupported_version' | 'invalid_payload' }

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

function normalizeAwakenerLevelMap(rawMap: unknown, allowedIds: Iterable<string>): Record<string, number> {
  const source = rawMap && typeof rawMap === 'object' ? (rawMap as Record<string, unknown>) : {}
  const output: Record<string, number> = {}
  for (const id of allowedIds) {
    output[id] = normalizeAwakenerLevel(source[id])
  }
  return output
}

function normalizeOwnedMap(rawMap: unknown, allowedIds: Set<string>): Record<string, number> {
  if (!rawMap || typeof rawMap !== 'object') {
    return {}
  }

  const output: Record<string, number> = {}
  for (const [id, rawValue] of Object.entries(rawMap as Record<string, unknown>)) {
    if (!allowedIds.has(id)) {
      continue
    }
    const level = normalizeLevel(rawValue)
    if (level !== null) {
      output[id] = level
    }
  }
  return output
}

function normalizePosseOwnedMap(rawMap: unknown, allowedIds: Set<string>): Record<string, number> {
  if (!rawMap || typeof rawMap !== 'object') {
    return {}
  }

  const output: Record<string, number> = {}
  for (const [id, rawValue] of Object.entries(rawMap as Record<string, unknown>)) {
    if (!allowedIds.has(id)) {
      continue
    }
    const level = normalizePosseLevel(rawValue)
    if (level !== null) {
      output[id] = level
    }
  }
  return output
}

function normalizeAwakenerLinks(
  ownedAwakeners: Record<string, number>,
  allowedAwakenerIds: Set<string>,
  linkedAwakenerGroups: string[][] | undefined,
): Record<string, number> {
  if (!linkedAwakenerGroups?.length) {
    return ownedAwakeners
  }

  const next = { ...ownedAwakeners }
  for (const group of linkedAwakenerGroups) {
    const validGroup = group.filter((id) => allowedAwakenerIds.has(id))
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

function normalizeLinkedAwakenerLevels(
  awakenerLevels: Record<string, number>,
  allowedAwakenerIds: Set<string>,
  linkedAwakenerGroups: string[][] | undefined,
): Record<string, number> {
  if (!linkedAwakenerGroups?.length) {
    return awakenerLevels
  }

  const next = { ...awakenerLevels }
  for (const group of linkedAwakenerGroups) {
    const validGroup = group.filter((id) => allowedAwakenerIds.has(id))
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

function normalizeOwnershipState(
  rawState: unknown,
  catalog: CollectionOwnershipCatalog,
): CollectionOwnershipState {
  if (!rawState || typeof rawState !== 'object') {
    return createSeedCollectionOwnershipState(catalog)
  }

  const state = rawState as Record<string, unknown>
  const awakenerIdSet = toAllowedSet(catalog.awakenerIds)
  return {
    ownedAwakeners: normalizeAwakenerLinks(
      normalizeOwnedMap(state.ownedAwakeners, awakenerIdSet),
      awakenerIdSet,
      catalog.linkedAwakenerGroups,
    ),
    awakenerLevels: normalizeLinkedAwakenerLevels(
      normalizeAwakenerLevelMap(state.awakenerLevels, catalog.awakenerIds),
      awakenerIdSet,
      catalog.linkedAwakenerGroups,
    ),
    ownedWheels: normalizeOwnedMap(state.ownedWheels, toAllowedSet(catalog.wheelIds)),
    ownedPosses: normalizePosseOwnedMap(state.ownedPosses, toAllowedSet(catalog.posseIds)),
    displayUnowned: state.displayUnowned !== false,
  }
}

function getOwnershipMap(state: CollectionOwnershipState, kind: CollectionOwnershipKind): Record<string, number> {
  if (kind === 'awakeners') {
    return state.ownedAwakeners
  }
  if (kind === 'wheels') {
    return state.ownedWheels
  }
  return state.ownedPosses
}

export function createDefaultCollectionOwnershipCatalog(): CollectionOwnershipCatalog {
  const awakeners = getAwakeners()
  const linkedAwakenerIdsByIdentity = new Map<string, string[]>()
  for (const awakener of awakeners) {
    const identityKey = getAwakenerIdentityKey(awakener.name)
    const entry = linkedAwakenerIdsByIdentity.get(identityKey)
    if (entry) {
      entry.push(String(awakener.id))
    } else {
      linkedAwakenerIdsByIdentity.set(identityKey, [String(awakener.id)])
    }
  }

  const linkedAwakenerGroups = Array.from(linkedAwakenerIdsByIdentity.values())
    .filter((group) => group.length > 1)
    .map((group) => [...group].sort())

  return {
    awakenerIds: awakeners.map((awakener) => String(awakener.id)),
    wheelIds: getWheels().map((wheel) => wheel.id),
    posseIds: getPosses().map((posse) => posse.id),
    linkedAwakenerGroups,
  }
}

export function createEmptyCollectionOwnershipState(): CollectionOwnershipState {
  const catalog = createDefaultCollectionOwnershipCatalog()
  return normalizeOwnershipState(createSeedCollectionOwnershipState(catalog), catalog)
}

export function loadCollectionOwnership(
  storage: StorageLike | null,
  catalog: CollectionOwnershipCatalog = createDefaultCollectionOwnershipCatalog(),
): CollectionOwnershipState {
  const raw = safeStorageRead(storage, COLLECTION_OWNERSHIP_KEY)
  if (!raw) {
    return normalizeOwnershipState(createSeedCollectionOwnershipState(catalog), catalog)
  }

  try {
    const parsed = parseCollectionOwnershipSnapshot(raw, catalog)
    if (!parsed.ok) {
      return normalizeOwnershipState(createSeedCollectionOwnershipState(catalog), catalog)
    }
    return parsed.state
  } catch {
    return normalizeOwnershipState(createSeedCollectionOwnershipState(catalog), catalog)
  }
}

export function serializeCollectionOwnershipSnapshot(
  state: CollectionOwnershipState,
  catalog: CollectionOwnershipCatalog = createDefaultCollectionOwnershipCatalog(),
): string {
  const normalizedState = normalizeOwnershipState(state, catalog)
  const envelope: CollectionOwnershipEnvelope = {
    version: COLLECTION_OWNERSHIP_VERSION,
    updatedAt: new Date().toISOString(),
    payload: normalizedState,
  }
  return JSON.stringify(envelope)
}

export function parseCollectionOwnershipSnapshot(
  raw: string,
  catalog: CollectionOwnershipCatalog = createDefaultCollectionOwnershipCatalog(),
): ParseCollectionOwnershipSnapshotResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'invalid_json' }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'invalid_payload' }
  }

  const envelope = parsed as Partial<CollectionOwnershipEnvelope>
  if (typeof envelope.version !== 'number') {
    return { ok: false, error: 'invalid_payload' }
  }
  if (envelope.version !== COLLECTION_OWNERSHIP_VERSION) {
    return { ok: false, error: 'unsupported_version' }
  }
  if (!envelope.payload || typeof envelope.payload !== 'object') {
    return { ok: false, error: 'invalid_payload' }
  }

  return {
    ok: true,
    state: normalizeOwnershipState(envelope.payload, catalog),
  }
}

export function saveCollectionOwnership(
  storage: StorageLike | null,
  state: CollectionOwnershipState,
  catalog: CollectionOwnershipCatalog = createDefaultCollectionOwnershipCatalog(),
): boolean {
  return safeStorageWrite(storage, COLLECTION_OWNERSHIP_KEY, serializeCollectionOwnershipSnapshot(state, catalog))
}

export function clearCollectionOwnership(storage: StorageLike | null): boolean {
  return safeStorageRemove(storage, COLLECTION_OWNERSHIP_KEY)
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
  const next = { ...map }
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

  const next = { ...map }
  for (const linkedId of matchingGroup) {
    delete next[linkedId]
  }
  return next
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
  const nextMap = { ...currentMap }
  if (nextLevel !== null) {
    nextMap[id] = nextLevel
  } else {
    delete nextMap[id]
  }

  if (kind === 'awakeners') {
    if (nextLevel === null) {
      return {
        ...state,
        ownedAwakeners: withoutLinkedAwakenerEntries(nextMap, id, catalog.linkedAwakenerGroups),
      }
    }
    return {
      ...state,
      ownedAwakeners: withLinkedAwakenerLevel(
        nextMap,
        id,
        nextLevel,
        catalog.linkedAwakenerGroups,
      ),
    }
  }
  if (kind === 'wheels') {
    return { ...state, ownedWheels: nextMap }
  }
  return { ...state, ownedPosses: nextMap }
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

  const nextMap = { ...currentMap }
  delete nextMap[id]

  if (kind === 'awakeners') {
    return {
      ...state,
      ownedAwakeners: withoutLinkedAwakenerEntries(nextMap, id, catalog.linkedAwakenerGroups),
    }
  }
  if (kind === 'wheels') {
    return { ...state, ownedWheels: nextMap }
  }
  return { ...state, ownedPosses: nextMap }
}

export function setDisplayUnowned(
  state: CollectionOwnershipState,
  displayUnowned: boolean,
): CollectionOwnershipState {
  return { ...state, displayUnowned }
}

export function getAwakenerLevel(
  state: CollectionOwnershipState,
  id: string,
): number {
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
