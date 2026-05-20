import type {CollectionSortDirection} from '@/domain/collection-sorting'
import type {DatabaseSortKey} from '@/domain/database-browse-state'
import type {WheelsDatabaseSortKey} from '@/domain/wheels-database-browse-state'

const DATABASE_SORT_LABELS: Record<DatabaseSortKey, string> = {
  ALPHABETICAL: 'Alphabetical',
  ATK: 'ATK',
  CON: 'CON',
  DEF: 'DEF',
  RARITY: 'Rarity',
  RELEASE_DATE: 'Release date',
}

const WHEEL_SORT_LABELS: Record<WheelsDatabaseSortKey, string> = {
  ALPHABETICAL: 'Alphabetical',
  MAINSTAT: 'Main stat',
  RARITY: 'Rarity',
}

export function getDatabaseSortLabel(sortKey: DatabaseSortKey): string {
  return DATABASE_SORT_LABELS[sortKey]
}

export function getDatabaseSortDirectionLabel(
  sortKey: DatabaseSortKey,
  direction: CollectionSortDirection,
): string {
  if (sortKey === 'ALPHABETICAL') {
    return direction === 'ASC' ? 'A → Z' : 'Z → A'
  }
  if (sortKey === 'RELEASE_DATE') {
    return direction === 'ASC' ? 'Old → New' : 'New → Old'
  }
  return direction === 'ASC' ? 'Low → High' : 'High → Low'
}

export function getWheelSortLabel(sortKey: WheelsDatabaseSortKey): string {
  return WHEEL_SORT_LABELS[sortKey]
}

export function getWheelSortDirectionLabel(
  sortKey: WheelsDatabaseSortKey,
  direction: CollectionSortDirection,
): string {
  if (sortKey === 'RARITY') {
    return direction === 'ASC' ? 'Low → High' : 'High → Low'
  }
  return direction === 'ASC' ? 'A → Z' : 'Z → A'
}
