import {describe, expect, it} from 'vitest'

import type {RelicDatabaseBrowseState} from './relic-database-browse-state'
import {buildRelicDatabaseView} from './relic-database-view'
import {getRelics} from './relics'

const defaults: RelicDatabaseBrowseState = {
  categoryFilter: 'ALL',
  query: '',
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
    expect(
      buildRelicDatabaseView(relics, {...defaults, query: 'Events'}).every((relic) =>
        relic.categories.includes('EVENT'),
      ),
    ).toBe(true)
  })

  it('filters by category without depending on family rarity', () => {
    const filtered = buildRelicDatabaseView(relics, {
      ...defaults,
      categoryFilter: 'PENDULUM',
    })
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((relic) => relic.categories.includes('PENDULUM'))).toBe(true)
  })

  it('sorts by variant count with deterministic name ties', () => {
    const byVariants = buildRelicDatabaseView(relics, {
      ...defaults,
      sortDirection: 'DESC',
      sortKey: 'VARIANT_COUNT',
    })
    expect(byVariants[0]?.variantCount).toBe(9)
  })

  it('ignores leading quote punctuation for alphabetical order', () => {
    const fixture = relics[0]
    const sorted = buildRelicDatabaseView(
      [
        {...fixture, id: 'relic-sort-memory', name: '"Memory"'},
        {...fixture, id: 'relic-sort-dream', name: 'Dream'},
      ],
      {...defaults, sortKey: 'ALPHABETICAL'},
    )

    expect(sorted.map((relic) => relic.name)).toEqual(['Dream', '"Memory"'])
  })
})
