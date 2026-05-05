import {
  safeStorageRead,
  safeStorageRemove,
  safeStorageWrite,
  type StorageLike,
} from '@/domain/storage'
import {
  deserializeBuilderDraft,
  isBuilderDraftPayload,
  isPersistedBuilderPayload,
  normalizeBuilderDraft,
  serializeBuilderDraft,
  type BuilderDraftPayload,
  type PersistedBuilderEnvelope,
  type PersistedBuilderPayload,
} from '@/features/builder/builderMigrations'

export type {BuilderDraftPayload} from '@/features/builder/builderMigrations'

const BUILDER_PERSISTENCE_VERSION = 2
const LEGACY_BUILDER_PERSISTENCE_VERSION = 1

export const BUILDER_PERSISTENCE_KEY = `skeydb.builder.v${String(BUILDER_PERSISTENCE_VERSION)}`
export const LEGACY_BUILDER_PERSISTENCE_KEY = `skeydb.builder.v${String(
  LEGACY_BUILDER_PERSISTENCE_VERSION,
)}`

export function loadBuilderDraft(storage: StorageLike | null): BuilderDraftPayload | null {
  const raw = safeStorageRead(storage, BUILDER_PERSISTENCE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as PersistedBuilderEnvelope<PersistedBuilderPayload>
      if (parsed.version !== BUILDER_PERSISTENCE_VERSION) {
        return null
      }
      if (!isPersistedBuilderPayload(parsed.payload)) {
        return null
      }
      return deserializeBuilderDraft(parsed.payload)
    } catch {
      return null
    }
  }

  const legacyRaw = safeStorageRead(storage, LEGACY_BUILDER_PERSISTENCE_KEY)
  if (!legacyRaw) {
    return null
  }

  try {
    const parsed = JSON.parse(legacyRaw) as PersistedBuilderEnvelope
    if (parsed.version !== LEGACY_BUILDER_PERSISTENCE_VERSION) {
      return null
    }
    if (!isBuilderDraftPayload(parsed.payload)) {
      return null
    }
    const migrated = normalizeBuilderDraft(parsed.payload)
    if (!migrated) {
      return null
    }
    if (!saveBuilderDraft(storage, migrated)) {
      return null
    }
    const serialized = serializeBuilderDraft(migrated)
    return serialized ? deserializeBuilderDraft(serialized) : null
  } catch {
    return null
  }
}

export function saveBuilderDraft(
  storage: StorageLike | null,
  payload: BuilderDraftPayload,
): boolean {
  const serialized = serializeBuilderDraft(payload)
  if (!serialized) {
    return false
  }

  const envelope: PersistedBuilderEnvelope<PersistedBuilderPayload> = {
    version: BUILDER_PERSISTENCE_VERSION,
    updatedAt: new Date().toISOString(),
    payload: serialized,
  }

  return safeStorageWrite(storage, BUILDER_PERSISTENCE_KEY, JSON.stringify(envelope))
}

export function clearBuilderDraft(storage: StorageLike | null): boolean {
  const currentRemoved = safeStorageRemove(storage, BUILDER_PERSISTENCE_KEY)
  const legacyRemoved = safeStorageRemove(storage, LEGACY_BUILDER_PERSISTENCE_KEY)
  return currentRemoved && legacyRemoved
}
