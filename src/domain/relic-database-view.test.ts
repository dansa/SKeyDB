import {describe, expect, it} from 'vitest'

import type {RelicDatabaseBrowseState} from './relic-database-browse-state'
import {buildRelicDatabaseView} from './relic-database-view'
import {getRelics} from './relics'

const defaults: RelicDatabaseBrowseState = {
  categoryFilter: 'ALL',
  query: '',
  rarityFilter: 'ALL',
  sortDirection: 'ASC',
  sortKey: 'BEST_MATCH',
}

describe('buildRelicDatabaseView', () => {
  const relics = getRelics()

  it('keeps the public catalog at family grain', () => {
    expect(relics).toHaveLength(305)
    expect(buildRelicDatabaseView(relics, defaults)).toHaveLength(305)
  })

  it('searches aliases, owner Awakeners, and facets', () => {
    expect(
      buildRelicDatabaseView(relics, {...defaults, query: 'Painted Malignant Child'}).map(
        (relic) => relic.name,
      ),
    ).toContain('Malignant Child')
    expect(
      buildRelicDatabaseView(relics, {...defaults, query: 'Agrippa'}).some(
        (relic) => relic.name === 'Dimensional Image: Agrippa',
      ),
    ).toBe(true)
    expect(
      buildRelicDatabaseView(relics, {...defaults, query: 'Pendulum'}).every((relic) =>
        relic.categories.includes('PENDULUM'),
      ),
    ).toBe(true)
  })

  it('combines category and rarity filters', () => {
    const filtered = buildRelicDatabaseView(relics, {
      ...defaults,
      categoryFilter: 'PENDULUM',
      rarityFilter: 'SR',
    })
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((relic) => relic.categories.includes('PENDULUM'))).toBe(true)
    expect(filtered.every((relic) => relic.rarity === 'SR')).toBe(true)
  })

  it('sorts by rarity and variant count with deterministic name ties', () => {
    const byRarity = buildRelicDatabaseView(relics, {
      ...defaults,
      sortDirection: 'DESC',
      sortKey: 'RARITY',
    })
    expect(byRarity[0]?.rarity).toBe('SSR')

    const byVariants = buildRelicDatabaseView(relics, {
      ...defaults,
      sortDirection: 'DESC',
      sortKey: 'VARIANT_COUNT',
    })
    expect(byVariants[0]?.variantCount).toBe(9)
  })
})
