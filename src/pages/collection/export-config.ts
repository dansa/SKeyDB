import {
  DEFAULT_AWAKENER_SORT_CONFIG,
  resolveAwakenerSortKey,
  resolveGroupByRealm,
  resolveSortDirection,
  type AwakenerSortKey,
  type CollectionSortDirection,
} from '@/domain/collection-sorting'
import {safeStorageRead, type StorageLike} from '@/domain/storage'

export interface ExportBoxConfig {
  columns: number
  cardWidthPx: number
  cardGapPx: number
  levelTextScalePct: number
  outerPaddingXPx: number
  outerPaddingYPx: number
  pixelRatio: number
}

export interface ExportVisualConfig {
  disableNames: boolean
  nameOnTop: boolean
  enlightensOnCard: boolean
  showLevels: boolean
  disableEmoji: boolean
}

export interface ExportSortConfig {
  key: AwakenerSortKey
  direction: CollectionSortDirection
  groupByRealm: boolean
}

export interface RarityOption<R extends string> {
  value: R
  label: string
}

export const DEFAULT_EXPORT_BOX_CONFIG: ExportBoxConfig = {
  columns: 8,
  cardWidthPx: 96,
  cardGapPx: 6,
  levelTextScalePct: 100,
  outerPaddingXPx: 8,
  outerPaddingYPx: 4,
  pixelRatio: 1,
}

export const DEFAULT_EXPORT_VISUAL_CONFIG: ExportVisualConfig = {
  disableNames: false,
  nameOnTop: false,
  enlightensOnCard: false,
  showLevels: true,
  disableEmoji: false,
}

export const DEFAULT_EXPORT_SORT_CONFIG: ExportSortConfig = {
  ...DEFAULT_AWAKENER_SORT_CONFIG,
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function sanitizeConfig(config: ExportBoxConfig): ExportBoxConfig {
  return {
    columns: clamp(Math.round(config.columns), 3, 10),
    cardWidthPx: clamp(Math.round(config.cardWidthPx), 52, 150),
    cardGapPx: clamp(Math.round(config.cardGapPx), 2, 16),
    levelTextScalePct: clamp(Math.round(config.levelTextScalePct), 60, 200),
    outerPaddingXPx: clamp(Math.round(config.outerPaddingXPx), 0, 32),
    outerPaddingYPx: clamp(Math.round(config.outerPaddingYPx), 0, 24),
    pixelRatio: clamp(Number(config.pixelRatio.toFixed(2)), 0.5, 2),
  }
}

export function getExportLayoutWidth(config: ExportBoxConfig) {
  return (
    config.outerPaddingXPx * 2 +
    config.columns * config.cardWidthPx +
    (config.columns - 1) * config.cardGapPx
  )
}

export function loadStoredLayoutConfig(
  storage: StorageLike | null,
  storageKeyPrefix: string,
): ExportBoxConfig {
  try {
    const raw = safeStorageRead(storage, `${storageKeyPrefix}.layout.v1`)
    if (!raw) return DEFAULT_EXPORT_BOX_CONFIG
    const parsed = JSON.parse(raw) as Partial<ExportBoxConfig>
    return sanitizeConfig({
      ...DEFAULT_EXPORT_BOX_CONFIG,
      ...parsed,
    })
  } catch {
    return DEFAULT_EXPORT_BOX_CONFIG
  }
}

export function loadStoredVisualConfig(
  storage: StorageLike | null,
  storageKeyPrefix: string,
): ExportVisualConfig {
  try {
    const raw = safeStorageRead(storage, `${storageKeyPrefix}.visuals.v1`)
    if (!raw) return DEFAULT_EXPORT_VISUAL_CONFIG
    const parsed = JSON.parse(raw) as Partial<ExportVisualConfig>
    return {
      ...DEFAULT_EXPORT_VISUAL_CONFIG,
      ...parsed,
    }
  } catch {
    return DEFAULT_EXPORT_VISUAL_CONFIG
  }
}

export function loadStoredSortConfig(
  storage: StorageLike | null,
  storageKeyPrefix: string,
): ExportSortConfig {
  try {
    const raw = safeStorageRead(storage, `${storageKeyPrefix}.sort.v1`)
    if (!raw) return DEFAULT_EXPORT_SORT_CONFIG
    const parsed = JSON.parse(raw) as Partial<ExportSortConfig> & {groupByFaction?: boolean}
    return {
      key: resolveAwakenerSortKey(parsed.key, DEFAULT_EXPORT_SORT_CONFIG),
      direction: resolveSortDirection(parsed.direction, DEFAULT_EXPORT_SORT_CONFIG),
      groupByRealm: resolveGroupByRealm(parsed, DEFAULT_EXPORT_SORT_CONFIG),
    }
  } catch {
    return DEFAULT_EXPORT_SORT_CONFIG
  }
}

export interface OwnedAssetBoxEntry<R extends string = never> {
  id: string
  label: string
  level: number
  cardLevel?: number
  asset: string | null
  rarity?: R
  realm?: string
  sortIndex?: number
}

export function loadStoredIncludedRarities<R extends string>(
  storage: StorageLike | null,
  storageKeyPrefix: string,
  defaultIncludedRarities: Record<R, boolean>,
): Record<R, boolean> {
  try {
    const raw = safeStorageRead(storage, `${storageKeyPrefix}.rarities.v1`)
    if (!raw) return {...defaultIncludedRarities}
    const parsed = JSON.parse(raw) as Partial<Record<R, boolean>>
    return {
      ...defaultIncludedRarities,
      ...parsed,
    }
  } catch {
    return {...defaultIncludedRarities}
  }
}
