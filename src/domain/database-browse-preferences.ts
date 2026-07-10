import {z} from 'zod'

import {type CollectionSortDirection} from './collection-sorting'
import {
  DATABASE_BROWSE_DEFAULTS,
  DATABASE_SORT_OPTIONS,
  type DatabaseBrowseState,
} from './database-browse-state'
import {
  DEFAULT_RELIC_DATABASE_DISPLAY_SCOPES,
  RELIC_DATABASE_DISPLAY_SCOPE_IDS,
  type RelicDatabaseDisplayScopeId,
} from './relic-database-display-scopes'
import {
  getBrowserLocalStorage,
  safeStorageRead,
  safeStorageWrite,
  type StorageLike,
} from './storage'
import {
  WHEELS_DATABASE_BROWSE_DEFAULTS,
  WHEELS_DATABASE_SORT_OPTIONS,
  type WheelsDatabaseBrowseState,
} from './wheels-database-browse-state'

const STORAGE_KEY = 'database-browse-preferences'

const sortDirectionSchema = z.enum(['ASC', 'DESC'])

export interface DatabaseBrowseSortPreferences {
  sortKey: DatabaseBrowseState['sortKey']
  sortDirection: CollectionSortDirection
  groupByRealm: boolean
}

export interface WheelsDatabaseBrowseSortPreferences {
  sortKey: WheelsDatabaseBrowseState['sortKey']
  sortDirection: CollectionSortDirection
}

export interface DatabaseBrowsePreferences {
  awakeners: DatabaseBrowseSortPreferences
  relics: RelicDatabaseDisplayPreferences
  wheels: WheelsDatabaseBrowseSortPreferences
}

export interface RelicDatabaseDisplayPreferences {
  displayScopes: RelicDatabaseDisplayScopeId[]
}

export const DEFAULT_DATABASE_BROWSE_PREFERENCES: DatabaseBrowsePreferences = {
  awakeners: {
    sortKey: DATABASE_BROWSE_DEFAULTS.sortKey,
    sortDirection: DATABASE_BROWSE_DEFAULTS.sortDirection,
    groupByRealm: DATABASE_BROWSE_DEFAULTS.groupByRealm,
  },
  relics: {
    displayScopes: [...DEFAULT_RELIC_DATABASE_DISPLAY_SCOPES],
  },
  wheels: {
    sortKey: WHEELS_DATABASE_BROWSE_DEFAULTS.sortKey,
    sortDirection: WHEELS_DATABASE_BROWSE_DEFAULTS.sortDirection,
  },
}

const awakenerSortPreferencesSchema = z
  .object({
    sortKey: z
      .enum(DATABASE_SORT_OPTIONS)
      .catch(DEFAULT_DATABASE_BROWSE_PREFERENCES.awakeners.sortKey),
    sortDirection: sortDirectionSchema.catch(
      DEFAULT_DATABASE_BROWSE_PREFERENCES.awakeners.sortDirection,
    ),
    groupByRealm: z.boolean().catch(DEFAULT_DATABASE_BROWSE_PREFERENCES.awakeners.groupByRealm),
  })
  .partial()
  .catch({})

const wheelsSortPreferencesSchema = z
  .object({
    sortKey: z
      .enum(WHEELS_DATABASE_SORT_OPTIONS)
      .catch(DEFAULT_DATABASE_BROWSE_PREFERENCES.wheels.sortKey),
    sortDirection: sortDirectionSchema.catch(
      DEFAULT_DATABASE_BROWSE_PREFERENCES.wheels.sortDirection,
    ),
  })
  .partial()
  .catch({})

const relicDisplayPreferencesSchema = z
  .object({
    displayScopes: z
      .array(z.enum(RELIC_DATABASE_DISPLAY_SCOPE_IDS))
      .transform((scopes) =>
        RELIC_DATABASE_DISPLAY_SCOPE_IDS.filter((scope) => scopes.includes(scope)),
      )
      .catch([...DEFAULT_RELIC_DATABASE_DISPLAY_SCOPES]),
  })
  .partial()
  .catch({})

const databaseBrowsePreferencesSchema = z
  .object({
    awakeners: awakenerSortPreferencesSchema.optional(),
    relics: relicDisplayPreferencesSchema.optional(),
    wheels: wheelsSortPreferencesSchema.optional(),
  })
  .catch({})

export function normalizeDatabaseBrowsePreferences(input: unknown = {}): DatabaseBrowsePreferences {
  const parsed = databaseBrowsePreferencesSchema.parse(input)
  return {
    awakeners: {
      ...DEFAULT_DATABASE_BROWSE_PREFERENCES.awakeners,
      ...parsed.awakeners,
    },
    wheels: {
      ...DEFAULT_DATABASE_BROWSE_PREFERENCES.wheels,
      ...parsed.wheels,
    },
    relics: {
      ...DEFAULT_DATABASE_BROWSE_PREFERENCES.relics,
      ...parsed.relics,
    },
  }
}

export function readDatabaseBrowsePreferences(
  storage: StorageLike | null = getBrowserLocalStorage(),
): DatabaseBrowsePreferences {
  const raw = safeStorageRead(storage, STORAGE_KEY)
  if (!raw) {
    return DEFAULT_DATABASE_BROWSE_PREFERENCES
  }

  try {
    return normalizeDatabaseBrowsePreferences(JSON.parse(raw))
  } catch {
    return DEFAULT_DATABASE_BROWSE_PREFERENCES
  }
}

export function writeAwakenerDatabaseBrowseSortPreferences(
  next: DatabaseBrowseSortPreferences,
  storage: StorageLike | null = getBrowserLocalStorage(),
): boolean {
  const current = readDatabaseBrowsePreferences(storage)
  return safeStorageWrite(storage, STORAGE_KEY, JSON.stringify({...current, awakeners: next}))
}

export function writeWheelsDatabaseBrowseSortPreferences(
  next: WheelsDatabaseBrowseSortPreferences,
  storage: StorageLike | null = getBrowserLocalStorage(),
): boolean {
  const current = readDatabaseBrowsePreferences(storage)
  const normalized = {
    sortKey: next.sortKey,
    sortDirection: next.sortDirection,
  }
  return safeStorageWrite(storage, STORAGE_KEY, JSON.stringify({...current, wheels: normalized}))
}

export function writeRelicDatabaseDisplayPreferences(
  next: RelicDatabaseDisplayPreferences,
  storage: StorageLike | null = getBrowserLocalStorage(),
): boolean {
  const current = readDatabaseBrowsePreferences(storage)
  const displayScopes = RELIC_DATABASE_DISPLAY_SCOPE_IDS.filter((scope) =>
    next.displayScopes.includes(scope),
  )
  return safeStorageWrite(
    storage,
    STORAGE_KEY,
    JSON.stringify({...current, relics: {displayScopes}}),
  )
}

export function hasAwakenerSortSearchParams(searchParams: URLSearchParams): boolean {
  return searchParams.has('sort') || searchParams.has('dir') || searchParams.has('group')
}

export function hasWheelsSortSearchParams(searchParams: URLSearchParams): boolean {
  return searchParams.has('sort') || searchParams.has('dir')
}
