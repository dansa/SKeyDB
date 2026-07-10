import {normalizeDatabaseDetailPreferences} from '@/domain/database-detail-preferences'
import {safeStorageRead, type StorageLike} from '@/domain/storage'
import {
  BUILDER_PERSISTENCE_KEY,
  LEGACY_BUILDER_PERSISTENCE_KEY,
} from '@/features/builder/builder-persistence'
import {
  deserializeBuilderDraft,
  isBuilderDraftPayload,
  isPersistedBuilderPayload,
  normalizeBuilderDraft,
  type PersistedBuilderEnvelope,
  type PersistedBuilderPayload,
} from '@/features/builder/builderMigrations'
import {
  COLLECTION_OWNERSHIP_KEY,
  COLLECTION_OWNERSHIP_LEGACY_KEY,
  parseCollectionOwnershipSnapshot,
} from '@/features/collection/collectionMigrations'

export const DOMAIN_STORAGE_MIGRATION_VERSION = 1
export const DOMAIN_STORAGE_MIGRATION_SNAPSHOT_KIND = 'skeydb.domain-storage-migration.snapshot'

export type DomainStorageMigrationCategory =
  | 'builder'
  | 'collection'
  | 'preference'
  | 'export-config'

export interface DomainStorageMigrationEntry {
  key: string
  value: string
  category: DomainStorageMigrationCategory
}

export interface DomainStorageMigrationSkippedEntry {
  key: string
  reason: 'missing' | 'invalid' | 'unrecognized'
}

export interface DomainStorageMigrationSnapshot {
  kind: typeof DOMAIN_STORAGE_MIGRATION_SNAPSHOT_KIND
  version: typeof DOMAIN_STORAGE_MIGRATION_VERSION
  createdAt: string
  sourceOrigin: string
  sourcePathname: string
  entries: DomainStorageMigrationEntry[]
  skipped: DomainStorageMigrationSkippedEntry[]
}

interface StorageMigrationManifestEntry {
  key: string
  category: DomainStorageMigrationCategory
  validate: (raw: string) => boolean
}

type LocationLike = Pick<Location, 'origin' | 'pathname'>

const BUILDER_PERSISTENCE_VERSION = 2
const LEGACY_BUILDER_PERSISTENCE_VERSION = 1

const BOOLEAN_STORAGE_VALUES = new Set(['0', '1'])
const BUILDER_SORT_DIRECTIONS = new Set(['ASC', 'DESC'])
const BUILDER_TEAM_PREVIEW_MODES = new Set(['compact', 'expanded'])
const BUILDER_AWAKENER_SORT_KEYS = new Set([
  'name',
  'owned',
  'enlighten',
  'level',
  'rarity',
  'realm',
  'releaseDate',
])

const MANIFEST: StorageMigrationManifestEntry[] = [
  {key: BUILDER_PERSISTENCE_KEY, category: 'builder', validate: isValidCurrentBuilderSnapshot},
  {
    key: LEGACY_BUILDER_PERSISTENCE_KEY,
    category: 'builder',
    validate: isValidLegacyBuilderSnapshot,
  },
  {
    key: COLLECTION_OWNERSHIP_KEY,
    category: 'collection',
    validate: isValidCollectionSnapshot,
  },
  {
    key: COLLECTION_OWNERSHIP_LEGACY_KEY,
    category: 'collection',
    validate: isValidCollectionSnapshot,
  },
  {
    key: 'skeydb.builder.awakenerSortKey.v1',
    category: 'preference',
    validate: (raw) => BUILDER_AWAKENER_SORT_KEYS.has(raw),
  },
  {
    key: 'skeydb.builder.awakenerSortDirection.v1',
    category: 'preference',
    validate: (raw) => BUILDER_SORT_DIRECTIONS.has(raw),
  },
  {
    key: 'skeydb.builder.awakenerSortGroupByFaction.v1',
    category: 'preference',
    validate: (raw) => BOOLEAN_STORAGE_VALUES.has(raw),
  },
  {
    key: 'skeydb.builder.displayUnowned.v1',
    category: 'preference',
    validate: (raw) => BOOLEAN_STORAGE_VALUES.has(raw),
  },
  {
    key: 'skeydb.builder.allowDupes.v1',
    category: 'preference',
    validate: (raw) => BOOLEAN_STORAGE_VALUES.has(raw),
  },
  {
    key: 'skeydb.builder.promoteRecommendedGear.v1',
    category: 'preference',
    validate: (raw) => BOOLEAN_STORAGE_VALUES.has(raw),
  },
  {
    key: 'skeydb.builder.promoteMatchingWheelMainstats.v1',
    category: 'preference',
    validate: (raw) => BOOLEAN_STORAGE_VALUES.has(raw),
  },
  {
    key: 'skeydb.builder.sinkUnownedToBottom.v1',
    category: 'preference',
    validate: (raw) => BOOLEAN_STORAGE_VALUES.has(raw),
  },
  {
    key: 'skeydb.builder.teamPreviewMode.v1',
    category: 'preference',
    validate: (raw) => BUILDER_TEAM_PREVIEW_MODES.has(raw),
  },
  {
    key: 'skeydb.builder.awakenerSortExpanded.v1',
    category: 'preference',
    validate: (raw) => BOOLEAN_STORAGE_VALUES.has(raw),
  },
  {
    key: 'skeydb.collection.awakenerSort.v1',
    category: 'preference',
    validate: isJsonObject,
  },
  {
    key: 'database-detail-preferences',
    category: 'preference',
    validate: isValidDatabaseDetailPreferences,
  },
  ...createExportConfigManifest('skeydb.ownedBoxExport'),
  ...createExportConfigManifest('skeydb.ownedWheelBoxExport'),
]

export const DOMAIN_STORAGE_MIGRATION_KEYS = MANIFEST.map((entry) => entry.key)

export function createDomainStorageMigrationSnapshot(
  storage: StorageLike | null,
  locationLike: LocationLike,
  now: Date = new Date(),
): DomainStorageMigrationSnapshot {
  const entries: DomainStorageMigrationEntry[] = []
  const skipped: DomainStorageMigrationSkippedEntry[] = []

  for (const manifestEntry of MANIFEST) {
    const raw = safeStorageRead(storage, manifestEntry.key)
    if (raw === null) {
      skipped.push({key: manifestEntry.key, reason: 'missing'})
      continue
    }

    if (!manifestEntry.validate(raw)) {
      skipped.push({key: manifestEntry.key, reason: 'invalid'})
      continue
    }

    entries.push({
      key: manifestEntry.key,
      value: raw,
      category: manifestEntry.category,
    })
  }

  return {
    kind: DOMAIN_STORAGE_MIGRATION_SNAPSHOT_KIND,
    version: DOMAIN_STORAGE_MIGRATION_VERSION,
    createdAt: now.toISOString(),
    sourceOrigin: locationLike.origin,
    sourcePathname: locationLike.pathname,
    entries,
    skipped,
  }
}

export function isDomainStorageMigrationSnapshot(
  value: unknown,
): value is DomainStorageMigrationSnapshot {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.kind === DOMAIN_STORAGE_MIGRATION_SNAPSHOT_KIND &&
    value.version === DOMAIN_STORAGE_MIGRATION_VERSION &&
    typeof value.createdAt === 'string' &&
    typeof value.sourceOrigin === 'string' &&
    typeof value.sourcePathname === 'string' &&
    Array.isArray(value.entries) &&
    value.entries.every(isMigrationEntry) &&
    Array.isArray(value.skipped) &&
    value.skipped.every(isSkippedEntry)
  )
}

export function isKnownDomainStorageMigrationKey(key: string): boolean {
  return DOMAIN_STORAGE_MIGRATION_KEYS.includes(key)
}

function createExportConfigManifest(prefix: string): StorageMigrationManifestEntry[] {
  return [
    {key: `${prefix}.layout.v1`, category: 'export-config', validate: isJsonObject},
    {key: `${prefix}.visuals.v1`, category: 'export-config', validate: isJsonObject},
    {key: `${prefix}.sort.v1`, category: 'export-config', validate: isJsonObject},
    {key: `${prefix}.rarities.v1`, category: 'export-config', validate: isJsonObject},
  ]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isMigrationEntry(value: unknown): value is DomainStorageMigrationEntry {
  if (!isRecord(value)) {
    return false
  }

  const key = value.key
  if (typeof key !== 'string') {
    return false
  }

  const manifestEntry = MANIFEST.find((entry) => entry.key === key)
  if (!manifestEntry) {
    return false
  }

  return (
    typeof value.value === 'string' &&
    value.category === manifestEntry.category &&
    manifestEntry.validate(value.value)
  )
}

function isSkippedEntry(value: unknown): value is DomainStorageMigrationSkippedEntry {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.key === 'string' &&
    ['missing', 'invalid', 'unrecognized'].includes(String(value.reason))
  )
}

function isValidCurrentBuilderSnapshot(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw) as PersistedBuilderEnvelope<PersistedBuilderPayload>
    return (
      parsed.version === BUILDER_PERSISTENCE_VERSION &&
      isPersistedBuilderPayload(parsed.payload) &&
      deserializeBuilderDraft(parsed.payload) !== null
    )
  } catch {
    return false
  }
}

function isValidLegacyBuilderSnapshot(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw) as PersistedBuilderEnvelope
    return (
      parsed.version === LEGACY_BUILDER_PERSISTENCE_VERSION &&
      isBuilderDraftPayload(parsed.payload) &&
      normalizeBuilderDraft(parsed.payload) !== null
    )
  } catch {
    return false
  }
}

function isValidCollectionSnapshot(raw: string): boolean {
  return parseCollectionOwnershipSnapshot(raw).ok
}

function isValidDatabaseDetailPreferences(raw: string): boolean {
  try {
    normalizeDatabaseDetailPreferences(JSON.parse(raw))
    return true
  } catch {
    return false
  }
}

function isJsonObject(raw: string): boolean {
  try {
    return isRecord(JSON.parse(raw))
  } catch {
    return false
  }
}
