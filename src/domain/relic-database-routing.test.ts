import {describe, expect, it} from 'vitest'

import {sanitizeDatabaseEntitySearch} from './database-entity-search'
import {
  buildDatabaseRelicBrowsePath,
  buildDatabaseRelicPath,
  findRelicByDatabaseSlug,
} from './database-paths'
import {getRelics} from './relics'

describe('relic database routing', () => {
  const relics = getRelics()

  it('builds canonical family browse and detail routes', () => {
    const malignantChild = relics.find((relic) => relic.id === 'relic-0207')
    expect(buildDatabaseRelicBrowsePath()).toBe('/database/relics')
    expect(malignantChild && buildDatabaseRelicPath(malignantChild)).toBe(
      '/database/relics/malignant-child',
    )
    expect(findRelicByDatabaseSlug(relics, 'malignant-child')?.id).toBe('relic-0207')
  })

  it('keeps applicable browse state but strips exact detail variant state', () => {
    expect(
      sanitizeDatabaseEntitySearch(
        'relics',
        '?q=child&category=ASTRAL_REIGN&rarity=N&sort=VARIANT_COUNT&variant=relic-variant-0338&private=1',
      ),
    ).toBe('?q=child&category=ASTRAL_REIGN&rarity=N&sort=VARIANT_COUNT')
  })
})
