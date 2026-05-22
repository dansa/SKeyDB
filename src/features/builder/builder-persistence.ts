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

export type LoadBuilderDraftResult =
  | {status: 'empty'}
  | {status: 'loaded'; draft: BuilderDraftPayload}
  | {status: 'invalid-current'; reason: string}
  | {status: 'invalid-legacy'; reason: string}
  | {status: 'loaded-legacy'; draft: BuilderDraftPayload; migrationSaved: boolean}

export function loadBuilderDraft(storage: StorageLike | null): LoadBuilderDraftResult {
  const raw = safeStorageRead(storage, BUILDER_PERSISTENCE_KEY)
  if (raw !== null) {
    try {
      const parsed = parsePersistedBuilderEnvelope(JSON.parse(raw))
      if (parsed.version !== BUILDER_PERSISTENCE_VERSION) {
        return {status: 'invalid-current', reason: 'Unsupported builder draft version.'}
      }
      if (!isPersistedBuilderPayload(parsed.payload)) {
        return {status: 'invalid-current', reason: 'Malformed builder draft payload.'}
      }
      const draft = deserializeBuilderDraft(parsed.payload)
      if (!draft) {
        return {status: 'invalid-current', reason: 'Builder draft payload contains invalid ids.'}
      }
      return {status: 'loaded', draft}
    } catch {
      return {status: 'invalid-current', reason: 'Malformed builder draft envelope.'}
    }
  }

  const legacyRaw = safeStorageRead(storage, LEGACY_BUILDER_PERSISTENCE_KEY)
  if (!legacyRaw) {
    return {status: 'empty'}
  }

  try {
    const parsed = parsePersistedBuilderEnvelope(JSON.parse(legacyRaw))
    if (parsed.version !== LEGACY_BUILDER_PERSISTENCE_VERSION) {
      return {status: 'invalid-legacy', reason: 'Unsupported legacy builder draft version.'}
    }
    if (!isBuilderDraftPayload(parsed.payload)) {
      return {status: 'invalid-legacy', reason: 'Malformed legacy builder draft payload.'}
    }
    const migrated = normalizeBuilderDraft(parsed.payload)
    if (!migrated) {
      return {
        status: 'invalid-legacy',
        reason: 'Legacy builder draft payload contains invalid ids.',
      }
    }
    const migrationSaved = saveBuilderDraft(storage, migrated)
    const serialized = serializeBuilderDraft(migrated)
    const draft = serialized ? deserializeBuilderDraft(serialized) : null
    return draft
      ? {status: 'loaded-legacy', draft, migrationSaved}
      : {status: 'invalid-legacy', reason: 'Legacy builder draft payload cannot be serialized.'}
  } catch {
    return {status: 'invalid-legacy', reason: 'Malformed legacy builder draft envelope.'}
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

function parsePersistedBuilderEnvelope(value: unknown): PersistedBuilderEnvelope<unknown> {
  if (!isRecord(value) || typeof value.version !== 'number' || !('payload' in value)) {
    throw new Error('Malformed builder draft envelope.')
  }

  return {
    version: value.version,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
    payload: value.payload,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
