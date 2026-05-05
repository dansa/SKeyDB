import {
  createDefaultCollectionOwnershipCatalog,
  normalizeCollectionOwnershipState,
  type CollectionOwnershipCatalog,
  type CollectionOwnershipState,
} from '@/domain/collection-ownership'
import {
  AWAKENER_ID_V1_TO_CURRENT,
  migrateAwakenerIdV1ToCurrent,
  migratePosseIdV1ToCurrent,
  migrateWheelIdV1ToCurrent,
  POSSE_ID_V1_TO_CURRENT,
  WHEEL_ID_V1_TO_CURRENT,
} from '@/domain/persistence-id-migration'
import {
  safeStorageRead,
  safeStorageRemove,
  safeStorageWrite,
  type StorageLike,
} from '@/domain/storage'

const COLLECTION_OWNERSHIP_VERSION = 2
const COLLECTION_OWNERSHIP_LEGACY_VERSION = 1

export const COLLECTION_OWNERSHIP_KEY = `skeydb.collection.v${String(COLLECTION_OWNERSHIP_VERSION)}`
export const COLLECTION_OWNERSHIP_LEGACY_KEY = `skeydb.collection.v${String(
  COLLECTION_OWNERSHIP_LEGACY_VERSION,
)}`

interface CollectionOwnershipEnvelope {
  version: number
  updatedAt: string
  payload: CollectionOwnershipState
}

export type ParseCollectionOwnershipSnapshotResult =
  | {ok: true; state: CollectionOwnershipState; migratedFromVersion?: number}
  | {ok: false; error: 'invalid_json' | 'unsupported_version' | 'invalid_payload'}

type CollectionOwnershipIdFormat = 'legacy' | 'public'
type CollectionOwnershipPublicIdKind = 'awakener' | 'wheel' | 'posse'

function invertMap(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(map).map(([from, to]) => [to, from]))
}

const AWAKENER_ID_CURRENT_TO_V1 = invertMap(AWAKENER_ID_V1_TO_CURRENT)
const WHEEL_ID_CURRENT_TO_V1 = invertMap(WHEEL_ID_V1_TO_CURRENT)
const POSSE_ID_CURRENT_TO_V1 = invertMap(POSSE_ID_V1_TO_CURRENT)

function isPublicCollectionId(id: string, kind: CollectionOwnershipPublicIdKind): boolean {
  return new RegExp(`^${kind}-\\d{4,}$`).test(id)
}

function resolveCatalogId(
  id: string,
  allowedIds: Set<string>,
  migrateV1ToCurrent: (id: string) => string | undefined,
  currentToV1: Record<string, string>,
  idFormat: CollectionOwnershipIdFormat,
  publicIdKind: CollectionOwnershipPublicIdKind,
): string | null {
  const currentId = migrateV1ToCurrent(id)

  if (idFormat === 'public') {
    const v1Id = currentToV1[id]
    if (v1Id && allowedIds.has(v1Id)) {
      return v1Id
    }
    return allowedIds.has(id) && isPublicCollectionId(id, publicIdKind) ? id : null
  }

  if (allowedIds.has(id)) {
    return id
  }
  if (currentId && allowedIds.has(currentId)) {
    return currentId
  }

  const v1Id = currentToV1[id]
  return v1Id && allowedIds.has(v1Id) ? v1Id : null
}

function canonicalizeId(
  id: string,
  migrateV1ToCurrent: (id: string) => string | undefined,
  publicIdKind: CollectionOwnershipPublicIdKind,
): string {
  const migratedId = migrateV1ToCurrent(id)
  if (migratedId) {
    return migratedId
  }
  if (isPublicCollectionId(id, publicIdKind)) {
    return id
  }
  throw new Error(`Cannot serialize collection ownership with non-public ${publicIdKind} id: ${id}`)
}

function canonicalizeOwnedMap(
  map: Record<string, number>,
  migrateV1ToCurrent: (id: string) => string | undefined,
  publicIdKind: CollectionOwnershipPublicIdKind,
): Record<string, number> {
  const output: Record<string, number> = {}
  for (const [id, value] of Object.entries(map)) {
    const publicId = canonicalizeId(id, migrateV1ToCurrent, publicIdKind)
    output[publicId] = Math.max(output[publicId] ?? 0, value)
  }
  return output
}

function canonicalizeOwnershipState(state: CollectionOwnershipState): CollectionOwnershipState {
  return {
    ...state,
    ownedAwakeners: canonicalizeOwnedMap(
      state.ownedAwakeners,
      migrateAwakenerIdV1ToCurrent,
      'awakener',
    ),
    awakenerLevels: canonicalizeOwnedMap(
      state.awakenerLevels,
      migrateAwakenerIdV1ToCurrent,
      'awakener',
    ),
    ownedWheels: canonicalizeOwnedMap(state.ownedWheels, migrateWheelIdV1ToCurrent, 'wheel'),
    ownedPosses: canonicalizeOwnedMap(state.ownedPosses, migratePosseIdV1ToCurrent, 'posse'),
  }
}

function createSnapshotIdResolvers(
  catalog: CollectionOwnershipCatalog,
  idFormat: CollectionOwnershipIdFormat,
) {
  const awakenerIds = new Set(catalog.awakenerIds)
  const wheelIds = new Set(catalog.wheelIds)
  const posseIds = new Set(catalog.posseIds)

  return {
    awakenerId: (id: string) =>
      resolveCatalogId(
        id,
        awakenerIds,
        migrateAwakenerIdV1ToCurrent,
        AWAKENER_ID_CURRENT_TO_V1,
        idFormat,
        'awakener',
      ),
    wheelId: (id: string) =>
      resolveCatalogId(
        id,
        wheelIds,
        migrateWheelIdV1ToCurrent,
        WHEEL_ID_CURRENT_TO_V1,
        idFormat,
        'wheel',
      ),
    posseId: (id: string) =>
      resolveCatalogId(
        id,
        posseIds,
        migratePosseIdV1ToCurrent,
        POSSE_ID_CURRENT_TO_V1,
        idFormat,
        'posse',
      ),
  }
}

export function loadCollectionOwnership(
  storage: StorageLike | null,
  catalog: CollectionOwnershipCatalog = createDefaultCollectionOwnershipCatalog(),
): CollectionOwnershipState {
  const raw = safeStorageRead(storage, COLLECTION_OWNERSHIP_KEY)
  if (raw !== null) {
    const parsed = parseCollectionOwnershipSnapshot(raw, catalog)
    return parsed.ok ? parsed.state : normalizeCollectionOwnershipState(null, catalog)
  }

  const legacyRaw = safeStorageRead(storage, COLLECTION_OWNERSHIP_LEGACY_KEY)
  if (legacyRaw !== null) {
    const parsed = parseCollectionOwnershipSnapshot(legacyRaw, catalog)
    if (parsed.ok) {
      saveCollectionOwnership(storage, parsed.state, catalog)
      return parsed.state
    }
  }

  return normalizeCollectionOwnershipState(null, catalog)
}

export function serializeCollectionOwnershipSnapshot(
  state: CollectionOwnershipState,
  catalog: CollectionOwnershipCatalog = createDefaultCollectionOwnershipCatalog(),
): string {
  const normalizedState = canonicalizeOwnershipState(
    normalizeCollectionOwnershipState(state, catalog, createSnapshotIdResolvers(catalog, 'legacy')),
  )
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
    state: normalizeCollectionOwnershipState(
      envelope.payload,
      catalog,
      createSnapshotIdResolvers(
        catalog,
        envelope.version === COLLECTION_OWNERSHIP_VERSION ? 'public' : 'legacy',
      ),
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
