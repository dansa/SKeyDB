import {describe, expect, it} from 'vitest'

import type {RelicDatabaseBrowseState} from './relic-database-browse-state'
import {buildRelicDatabaseView, buildRelicDatabaseViewResult} from './relic-database-view'
import {getRelics} from './relics'

const defaults: RelicDatabaseBrowseState = {
  categoryFilter: 'ALL',
  query: '',
  sortDirection: 'ASC',
  sortKey: 'BEST_MATCH',
  tierFilter: 'ALL',
}

describe('buildRelicDatabaseView', () => {
  const relics = getRelics()

  it('keeps the public catalog at family grain', () => {
    expect(relics).toHaveLength(286)
    expect(buildRelicDatabaseView(relics, defaults)).toHaveLength(286)
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

  it('filters families by variant tier without flattening variants', () => {
    const fixture = relics.find((relic) => relic.name === 'Malignant Child')
    expect(fixture).toBeDefined()
    if (!fixture) return

    const filtered = buildRelicDatabaseView(
      [
        {...fixture, id: 'relic-tier-silver', variantTiers: ['Silver']},
        {...fixture, id: 'relic-tier-cursed', variantTiers: ['Cursed']},
      ],
      {...defaults, tierFilter: 'SILVER'},
    )

    expect(filtered.map((relic) => relic.id)).toEqual(['relic-tier-silver'])
  })

  it('requires category and tier to belong to the same exact variant', () => {
    const malignantChild = relics.find((relic) => relic.name === 'Malignant Child')
    expect(malignantChild).toBeDefined()
    if (!malignantChild) return

    expect(
      buildRelicDatabaseView([malignantChild], {
        ...defaults,
        categoryFilter: 'FADED_LEGACY',
        tierFilter: 'GOLD',
      }),
    ).toEqual([])
    expect(
      buildRelicDatabaseView([malignantChild], {
        ...defaults,
        categoryFilter: 'FADED_LEGACY',
        tierFilter: 'SILVER',
      }),
    ).toEqual([malignantChild])
  })

  it('applies persistent display scopes with OR semantics and reports hidden query matches', () => {
    const standard = relics.find((relic) => relic.categories.includes('ASTRAL_REIGN'))
    const event = relics.find(
      (relic) => relic.categories.length === 1 && relic.categories.includes('EVENT'),
    )
    expect(standard).toBeDefined()
    expect(event).toBeDefined()
    if (!standard || !event) return

    const result = buildRelicDatabaseViewResult(
      [standard, event],
      {...defaults, query: event.name},
      {displayScopes: ['STANDARD']},
    )

    expect(result.relics).toEqual([])
    expect(result.hiddenByDisplayCount).toBe(1)
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
