import {describe, expect, it} from 'vitest'

import {
  DEFAULT_DATABASE_BROWSE_PREFERENCES,
  hasAwakenerSortSearchParams,
  hasWheelsSortSearchParams,
  readDatabaseBrowsePreferences,
  writeAwakenerDatabaseBrowseSortPreferences,
  writeWheelsDatabaseBrowseSortPreferences,
} from './database-browse-preferences'
import type {StorageLike} from './storage'

function createStorage(initial: Record<string, string> = {}): StorageLike {
  const entries = new Map(Object.entries(initial))
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value)
    },
    removeItem: (key) => {
      entries.delete(key)
    },
  }
}

describe('database-browse-preferences', () => {
  it('reads defaults for missing or invalid stored browse preferences', () => {
    expect(readDatabaseBrowsePreferences(createStorage())).toEqual(
      DEFAULT_DATABASE_BROWSE_PREFERENCES,
    )
    expect(
      readDatabaseBrowsePreferences(createStorage({'database-browse-preferences': '{bad'})),
    ).toEqual(DEFAULT_DATABASE_BROWSE_PREFERENCES)
  })

  it('persists only awakener and wheel sort preferences', () => {
    const storage = createStorage()

    expect(
      writeAwakenerDatabaseBrowseSortPreferences(
        {sortKey: 'ATK', sortDirection: 'DESC', groupByRealm: true},
        storage,
      ),
    ).toBe(true)
    expect(
      writeWheelsDatabaseBrowseSortPreferences(
        {sortKey: 'ALPHABETICAL', sortDirection: 'ASC'},
        storage,
      ),
    ).toBe(true)

    expect(readDatabaseBrowsePreferences(storage)).toEqual({
      awakeners: {sortKey: 'ATK', sortDirection: 'DESC', groupByRealm: true},
      wheels: {sortKey: 'ALPHABETICAL', sortDirection: 'ASC'},
    })
  })

  it('detects URL sort params that should override storage', () => {
    expect(hasAwakenerSortSearchParams(new URLSearchParams('q=alpha'))).toBe(false)
    expect(hasAwakenerSortSearchParams(new URLSearchParams('group=1'))).toBe(true)
    expect(hasWheelsSortSearchParams(new URLSearchParams('mainstat=ATK'))).toBe(false)
    expect(hasWheelsSortSearchParams(new URLSearchParams('dir=ASC'))).toBe(true)
  })
})
