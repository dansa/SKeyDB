import {getAwakenerIdentityKey} from './awakener-identity'
import {getAwakeners} from './awakeners'
import {
  AWAKENER_ID_V1_TO_V2,
  POSSE_ID_V1_TO_V2,
  WHEEL_ID_V1_TO_V2,
  migrateAwakenerIdV1ToV2,
  migratePosseIdV1ToV2,
  migrateWheelIdV1ToV2,
} from './persistence-id-migration.v2'
import {getPosses} from './posses'
import {safeStorageRead, safeStorageRemove, safeStorageWrite, type StorageLike} from './storage'
import {getWheels} from './wheels'

const COLLECTION_OWNERSHIP_VERSION = 2
const COLLECTION_OWNERSHIP_LEGACY_VERSION = 1

export const COLLECTION_OWNERSHIP_KEY = `skeydb.collection.v${String(COLLECTION_OWNERSHIP_VERSION)}`
export const COLLECTION_OWNERSHIP_LEGACY_KEY = `skeydb.collection.v${String(
  COLLECTION_OWNERSHIP_LEGACY_VERSION,
)}`

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

interface CollectionOwnershipEnvelope {
  version: number
  updatedAt: string
  payload: CollectionOwnershipState
}

export type ParseCollectionOwnershipSnapshotResult =
  | {ok: true; state: CollectionOwnershipState; migratedFromVersion?: number}
  | {ok: false; error: 'invalid_json' | 'unsupported_version' | 'invalid_payload'}

type CollectionOwnershipIdFormat = 'runtime' | 'legacy' | 'public'
type CollectionOwnershipPublicIdKind = 'awakener' | 'wheel' | 'posse'

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

function invertMap(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(map).map(([from, to]) => [to, from]))
}

const AWAKENER_ID_V2_TO_V1 = invertMap(AWAKENER_ID_V1_TO_V2)
const WHEEL_ID_V2_TO_V1 = invertMap(WHEEL_ID_V1_TO_V2)
const POSSE_ID_V2_TO_V1 = invertMap(POSSE_ID_V1_TO_V2)

function resolveCatalogId(
  id: string,
  allowedIds: Set<string>,
  migrateV1ToV2: (id: string) => string | undefined,
  v2ToV1: Record<string, string>,
  idFormat: CollectionOwnershipIdFormat,
  publicIdKind: CollectionOwnershipPublicIdKind,
): string | null {
  const v2Id = migrateV1ToV2(id)

  if (idFormat === 'public') {
    const v1Id = v2ToV1[id]
    if (v1Id && allowedIds.has(v1Id)) {
      return v1Id
    }
    return allowedIds.has(id) && isPublicCollectionId(id, publicIdKind) ? id : null
  }

  if (allowedIds.has(id)) {
    return id
  }

  if (v2Id && allowedIds.has(v2Id)) {
    return v2Id
  }

  const v1Id = v2ToV1[id]
  if (v1Id && allowedIds.has(v1Id)) {
    return v1Id
  }

  return null
}

function isPublicCollectionId(id: string, kind: CollectionOwnershipPublicIdKind): boolean {
  return new RegExp(`^${kind}-\\d{4,}$`).test(id)
}

function canonicalizeId(
  id: string,
  migrateV1ToV2: (id: string) => string | undefined,
  publicIdKind: CollectionOwnershipPublicIdKind,
): string {
  const migratedId = migrateV1ToV2(id)
  if (migratedId) {
    return migratedId
  }
  if (isPublicCollectionId(id, publicIdKind)) {
    return id
  }
  throw new Error(`Cannot serialize collection ownership with non-public ${publicIdKind} id: ${id}`)
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

function normalizeAwakenerLevelMap(
  rawMap: unknown,
  allowedIds: Iterable<string>,
  idFormat: CollectionOwnershipIdFormat,
): Record<string, number> {
  const source = rawMap && typeof rawMap === 'object' ? (rawMap as Record<string, unknown>) : {}
  const output: Record<string, number> = {}
  const allowedIdSet = toAllowedSet(allowedIds)
  const resolvedSource = new Map<string, unknown>()
  for (const [id, rawValue] of Object.entries(source)) {
    const resolvedId = resolveCatalogId(
      id,
      allowedIdSet,
      migrateAwakenerIdV1ToV2,
      AWAKENER_ID_V2_TO_V1,
      idFormat,
      'awakener',
    )
    if (resolvedId) {
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
  migrateV1ToV2: (id: string) => string | undefined,
  v2ToV1: Record<string, string>,
  idFormat: CollectionOwnershipIdFormat,
  publicIdKind: CollectionOwnershipPublicIdKind,
): Record<string, number> {
  if (!rawMap || typeof rawMap !== 'object') {
    return {}
  }

  const output: Record<string, number> = {}
  for (const [id, rawValue] of Object.entries(rawMap as Record<string, unknown>)) {
    const resolvedId = resolveCatalogId(
      id,
      allowedIds,
      migrateV1ToV2,
      v2ToV1,
      idFormat,
      publicIdKind,
    )
    if (!resolvedId) {
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
  idFormat: CollectionOwnershipIdFormat,
): Record<string, number> {
  if (!rawMap || typeof rawMap !== 'object') {
    return {}
  }

  const output: Record<string, number> = {}
  for (const [id, rawValue] of Object.entries(rawMap as Record<string, unknown>)) {
    const resolvedId = resolveCatalogId(
      id,
      allowedIds,
      migratePosseIdV1ToV2,
      POSSE_ID_V2_TO_V1,
      idFormat,
      'posse',
    )
    if (!resolvedId) {
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

function normalizeOwnershipState(
  rawState: unknown,
  catalog: CollectionOwnershipCatalog,
  idFormat: CollectionOwnershipIdFormat = 'runtime',
): CollectionOwnershipState {
  if (!rawState || typeof rawState !== 'object') {
    return createSeedCollectionOwnershipState(catalog)
  }

  const state = rawState as Record<string, unknown>
  const awakenerIdSet = toAllowedSet(catalog.awakenerIds)
  return {
    ownedAwakeners: unifyLinkedGroupLevels(
      normalizeOwnedMap(
        state.ownedAwakeners,
        awakenerIdSet,
        migrateAwakenerIdV1ToV2,
        AWAKENER_ID_V2_TO_V1,
        idFormat,
        'awakener',
      ),
      awakenerIdSet,
      catalog.linkedAwakenerGroups,
    ),
    awakenerLevels: unifyLinkedGroupLevels(
      normalizeAwakenerLevelMap(state.awakenerLevels, catalog.awakenerIds, idFormat),
      awakenerIdSet,
      catalog.linkedAwakenerGroups,
    ),
    ownedWheels: normalizeOwnedMap(
      state.ownedWheels,
      toAllowedSet(catalog.wheelIds),
      migrateWheelIdV1ToV2,
      WHEEL_ID_V2_TO_V1,
      idFormat,
      'wheel',
    ),
    ownedPosses: normalizePosseOwnedMap(
      state.ownedPosses,
      toAllowedSet(catalog.posseIds),
      idFormat,
    ),
    displayUnowned: state.displayUnowned !== false,
  }
}

function canonicalizeOwnedMap(
  map: Record<string, number>,
  migrateV1ToV2: (id: string) => string | undefined,
  publicIdKind: CollectionOwnershipPublicIdKind,
): Record<string, number> {
  const output: Record<string, number> = {}
  for (const [id, value] of Object.entries(map)) {
    const publicId = canonicalizeId(id, migrateV1ToV2, publicIdKind)
    output[publicId] = Math.max(output[publicId] ?? 0, value)
  }
  return output
}

function canonicalizeOwnershipState(state: CollectionOwnershipState): CollectionOwnershipState {
  return {
    ...state,
    ownedAwakeners: canonicalizeOwnedMap(
      state.ownedAwakeners,
      migrateAwakenerIdV1ToV2,
      'awakener',
    ),
    awakenerLevels: canonicalizeOwnedMap(
      state.awakenerLevels,
      migrateAwakenerIdV1ToV2,
      'awakener',
    ),
    ownedWheels: canonicalizeOwnedMap(state.ownedWheels, migrateWheelIdV1ToV2, 'wheel'),
    ownedPosses: canonicalizeOwnedMap(state.ownedPosses, migratePosseIdV1ToV2, 'posse'),
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
  return Object.fromEntries(
    Object.entries(map).filter(([entryId]) => !omittedIds.has(entryId)),
  ) as Record<string, number>
}

export function createDefaultCollectionOwnershipCatalog(): CollectionOwnershipCatalog {
  const awakeners = getAwakeners()
  const linkedAwakenerIdsByIdentity = new Map<string, string[]>()
  for (const awakener of awakeners) {
    const identityKey = getAwakenerIdentityKey(awakener.name)
    const entry = linkedAwakenerIdsByIdentity.get(identityKey)
    if (entry) {
      entry.push(awakener.id)
    } else {
      linkedAwakenerIdsByIdentity.set(identityKey, [awakener.id])
    }
  }

  const linkedAwakenerGroups = Array.from(linkedAwakenerIdsByIdentity.values())
    .filter((group) => group.length > 1)
    .map((group) => [...group].sort((left, right) => left.localeCompare(right)))

  return {
    awakenerIds: awakeners.map((awakener) => awakener.id),
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
  if (raw !== null) {
    const parsed = parseCollectionOwnershipSnapshot(raw, catalog)
    if (parsed.ok) {
      return parsed.state
    }
    return normalizeOwnershipState(createSeedCollectionOwnershipState(catalog), catalog)
  }

  const legacyRaw = safeStorageRead(storage, COLLECTION_OWNERSHIP_LEGACY_KEY)
  if (legacyRaw !== null) {
    const parsed = parseCollectionOwnershipSnapshot(legacyRaw, catalog)
    if (parsed.ok) {
      saveCollectionOwnership(storage, parsed.state, catalog)
      return parsed.state
    }
  }

  return normalizeOwnershipState(createSeedCollectionOwnershipState(catalog), catalog)
}

export function serializeCollectionOwnershipSnapshot(
  state: CollectionOwnershipState,
  catalog: CollectionOwnershipCatalog = createDefaultCollectionOwnershipCatalog(),
): string {
  const normalizedState = canonicalizeOwnershipState(normalizeOwnershipState(state, catalog))
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
    return {ok: false, error: 'invalid_json'}
  }

  if (!parsed || typeof parsed !== 'object') {
    return {ok: false, error: 'invalid_payload'}
  }

  const envelope = parsed as Partial<CollectionOwnershipEnvelope>
  if (typeof envelope.version !== 'number') {
    return {ok: false, error: 'invalid_payload'}
  }
  if (
    envelope.version !== COLLECTION_OWNERSHIP_VERSION &&
    envelope.version !== COLLECTION_OWNERSHIP_LEGACY_VERSION
  ) {
    return {ok: false, error: 'unsupported_version'}
  }
  if (!envelope.payload || typeof envelope.payload !== 'object') {
    return {ok: false, error: 'invalid_payload'}
  }

  return {
    ok: true,
    state: normalizeOwnershipState(
      envelope.payload,
      catalog,
      envelope.version === COLLECTION_OWNERSHIP_VERSION ? 'public' : 'legacy',
    ),
    ...(envelope.version === COLLECTION_OWNERSHIP_LEGACY_VERSION
      ? {migratedFromVersion: COLLECTION_OWNERSHIP_LEGACY_VERSION}
      : {}),
  }
}

export function saveCollectionOwnership(
  storage: StorageLike | null,
  state: CollectionOwnershipState,
  catalog: CollectionOwnershipCatalog = createDefaultCollectionOwnershipCatalog(),
): boolean {
  try {
    return safeStorageWrite(
      storage,
      COLLECTION_OWNERSHIP_KEY,
      serializeCollectionOwnershipSnapshot(state, catalog),
    )
  } catch {
    return false
  }
}

export function clearCollectionOwnership(storage: StorageLike | null): boolean {
  const clearedCurrent = safeStorageRemove(storage, COLLECTION_OWNERSHIP_KEY)
  const clearedLegacy = safeStorageRemove(storage, COLLECTION_OWNERSHIP_LEGACY_KEY)
  return clearedCurrent && clearedLegacy
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
