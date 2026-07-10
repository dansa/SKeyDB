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

  it.each([
    ['argent-return-birth', 'relic-0067', '/database/relics/argent-return'],
    ['faded-photograph', 'relic-0161', '/database/relics/faded-photo'],
    ['little-ns-pristine-camera', 'relic-0200', '/database/relics/little-ns-camera'],
    ['medal-of-rescue-diamond', 'relic-0209', '/database/relics/medal-of-rescue'],
    ['pure-silver-core-sorrow', 'relic-0244', '/database/relics/pure-silver-core'],
  ])('resolves former family slug %s to its canonical family', (slug, familyId, canonicalPath) => {
    const family = findRelicByDatabaseSlug(relics, slug)

    expect(family?.id).toBe(familyId)
    expect(family && buildDatabaseRelicPath(family)).toBe(canonicalPath)
  })

  it('keeps applicable browse state but strips exact detail variant state', () => {
    expect(
      sanitizeDatabaseEntitySearch(
        'relics',
        '?q=child&category=ASTRAL_REIGN&rarity=N&sort=VARIANT_COUNT&variant=relic-variant-0338&private=1',
      ),
    ).toBe('?q=child&category=ASTRAL_REIGN&sort=VARIANT_COUNT')
  })
})
