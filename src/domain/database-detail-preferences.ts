import {z} from 'zod'

import {
  normalizeAwakenerDatabaseSelection,
  normalizeAwakenerDatabaseSelectionForRecord,
  selectedEnlightenSlotSchema,
  type AwakenerDatabaseSelection,
} from './awakener-database-state'
import {type AwakenerFullV2Record} from './awakeners-full-v2'
import {clampAccountLevel} from './gameplay-math-metadata'
import {
  getBrowserLocalStorage,
  safeStorageRead,
  safeStorageWrite,
  type StorageLike,
} from './storage'
import {clampWheelEnhanceLevel} from './wheel-enhance'

const STORAGE_KEY = 'database-detail-preferences'

const fontScaleSchema = z.enum(['small', 'medium', 'large'])
export type DatabaseDetailFontScale = z.infer<typeof fontScaleSchema>

export interface DatabaseDetailSharedPreferences {
  showTagIcons: boolean
  clickOutsideClosesPopovers: boolean
  fontScale: DatabaseDetailFontScale
  accountLevel: number
}

export interface DatabaseAwakenerDetailPreferences {
  showVisibleScaling: boolean
  defaultSelection: AwakenerDatabaseSelection
}

export interface DatabaseWheelDetailPreferences {
  defaultEnhanceLevel: number
  expandLoreByDefault: boolean
}

export interface DatabaseDetailPreferences {
  shared: DatabaseDetailSharedPreferences
  awakener: DatabaseAwakenerDetailPreferences
  wheel: DatabaseWheelDetailPreferences
}

export interface DatabaseDetailPreferencesPatch {
  shared?: Partial<DatabaseDetailSharedPreferences>
  awakener?: Partial<DatabaseAwakenerDetailPreferences>
  wheel?: Partial<DatabaseWheelDetailPreferences>
}

const DEFAULT_DATABASE_DETAIL_SHARED_PREFERENCES: DatabaseDetailSharedPreferences = {
  showTagIcons: true,
  clickOutsideClosesPopovers: true,
  fontScale: 'small',
  accountLevel: 50,
}

const DEFAULT_DATABASE_DETAIL_AWAKENER_PREFERENCES: DatabaseAwakenerDetailPreferences = {
  showVisibleScaling: true,
  defaultSelection: normalizeAwakenerDatabaseSelection(),
}

const DEFAULT_DATABASE_DETAIL_WHEEL_PREFERENCES: DatabaseWheelDetailPreferences = {
  defaultEnhanceLevel: 0,
  expandLoreByDefault: false,
}

const databaseDetailSharedPreferencesSchema = z.object({
  showTagIcons: z.boolean().default(DEFAULT_DATABASE_DETAIL_SHARED_PREFERENCES.showTagIcons),
  clickOutsideClosesPopovers: z
    .boolean()
    .default(DEFAULT_DATABASE_DETAIL_SHARED_PREFERENCES.clickOutsideClosesPopovers),
  fontScale: fontScaleSchema.default(DEFAULT_DATABASE_DETAIL_SHARED_PREFERENCES.fontScale),
  accountLevel: z.number().default(DEFAULT_DATABASE_DETAIL_SHARED_PREFERENCES.accountLevel),
})

const databaseDetailAwakenerPreferencesSchema = z.object({
  showVisibleScaling: z
    .boolean()
    .default(DEFAULT_DATABASE_DETAIL_AWAKENER_PREFERENCES.showVisibleScaling),
  defaultSelection: z
    .object({
      awakenerLevel: z.number().optional(),
      psycheSurgeOffset: z.number().optional(),
      skillLevel: z.number().optional(),
      selectedEnlightenSlot: selectedEnlightenSlotSchema.optional(),
      soulforgeLevel: z.number().optional(),
    })
    .default(DEFAULT_DATABASE_DETAIL_AWAKENER_PREFERENCES.defaultSelection),
})

const databaseDetailWheelPreferencesSchema = z.object({
  defaultEnhanceLevel: z
    .number()
    .default(DEFAULT_DATABASE_DETAIL_WHEEL_PREFERENCES.defaultEnhanceLevel),
  expandLoreByDefault: z
    .boolean()
    .default(DEFAULT_DATABASE_DETAIL_WHEEL_PREFERENCES.expandLoreByDefault),
})

const databaseDetailPreferencesSchema = z.object({
  shared: databaseDetailSharedPreferencesSchema.default(DEFAULT_DATABASE_DETAIL_SHARED_PREFERENCES),
  awakener: databaseDetailAwakenerPreferencesSchema.default(
    DEFAULT_DATABASE_DETAIL_AWAKENER_PREFERENCES,
  ),
  wheel: databaseDetailWheelPreferencesSchema.default(DEFAULT_DATABASE_DETAIL_WHEEL_PREFERENCES),
})

export const DEFAULT_DATABASE_DETAIL_PREFERENCES: DatabaseDetailPreferences = {
  shared: DEFAULT_DATABASE_DETAIL_SHARED_PREFERENCES,
  awakener: DEFAULT_DATABASE_DETAIL_AWAKENER_PREFERENCES,
  wheel: DEFAULT_DATABASE_DETAIL_WHEEL_PREFERENCES,
}

function extractLegacyPreferences(input: Record<string, unknown>) {
  return {
    shared: {
      showTagIcons: input.showTagIcons,
      clickOutsideClosesPopovers: input.clickOutsideClosesPopovers,
      fontScale: input.fontScale,
      accountLevel: input.accountLevel,
    },
    awakener: {
      showVisibleScaling: input.showVisibleScaling,
      defaultSelection: input.defaultSelection,
    },
    wheel: {
      defaultEnhanceLevel: input.defaultWheelEnhanceLevel,
      expandLoreByDefault: input.expandWheelLoreByDefault,
    },
  }
}

export function normalizeDatabaseDetailPreferences(input: unknown = {}): DatabaseDetailPreferences {
  const rawInput = typeof input === 'object' && input ? (input as Record<string, unknown>) : {}
  const parsed = databaseDetailPreferencesSchema.parse(
    'shared' in rawInput || 'awakener' in rawInput || 'wheel' in rawInput
      ? rawInput
      : extractLegacyPreferences(rawInput),
  )

  return {
    shared: {
      showTagIcons: parsed.shared.showTagIcons,
      clickOutsideClosesPopovers: parsed.shared.clickOutsideClosesPopovers,
      fontScale: parsed.shared.fontScale,
      accountLevel: clampAccountLevel(parsed.shared.accountLevel),
    },
    awakener: {
      showVisibleScaling: parsed.awakener.showVisibleScaling,
      defaultSelection: normalizeAwakenerDatabaseSelection(parsed.awakener.defaultSelection),
    },
    wheel: {
      defaultEnhanceLevel: clampWheelEnhanceLevel(parsed.wheel.defaultEnhanceLevel),
      expandLoreByDefault: parsed.wheel.expandLoreByDefault,
    },
  }
}

export function mergeDatabaseDetailPreferences(
  current: DatabaseDetailPreferences,
  next: DatabaseDetailPreferencesPatch,
): DatabaseDetailPreferences {
  return normalizeDatabaseDetailPreferences({
    shared: {
      ...current.shared,
      ...(next.shared ?? {}),
    },
    awakener: {
      ...current.awakener,
      ...(next.awakener ?? {}),
      defaultSelection: next.awakener?.defaultSelection ?? current.awakener.defaultSelection,
    },
    wheel: {
      ...current.wheel,
      ...(next.wheel ?? {}),
    },
  })
}

export function readDatabaseDetailPreferences(
  storage: StorageLike | null = getBrowserLocalStorage(),
): DatabaseDetailPreferences {
  const raw = safeStorageRead(storage, STORAGE_KEY)
  if (!raw) {
    return DEFAULT_DATABASE_DETAIL_PREFERENCES
  }

  try {
    return normalizeDatabaseDetailPreferences(JSON.parse(raw))
  } catch {
    return DEFAULT_DATABASE_DETAIL_PREFERENCES
  }
}

export function writeDatabaseDetailPreferences(
  next: DatabaseDetailPreferencesPatch,
  storage: StorageLike | null = getBrowserLocalStorage(),
): boolean {
  const normalized = mergeDatabaseDetailPreferences(readDatabaseDetailPreferences(storage), next)

  return safeStorageWrite(storage, STORAGE_KEY, JSON.stringify(normalized))
}

export function resolveDatabaseDetailDefaultSelection(
  record: AwakenerFullV2Record,
  preferences:
    | DatabaseDetailPreferencesPatch
    | DatabaseDetailPreferences = DEFAULT_DATABASE_DETAIL_PREFERENCES,
): AwakenerDatabaseSelection {
  const normalizedPreferences = normalizeDatabaseDetailPreferences(preferences)
  return normalizeAwakenerDatabaseSelectionForRecord(
    record,
    normalizedPreferences.awakener.defaultSelection,
  )
}
