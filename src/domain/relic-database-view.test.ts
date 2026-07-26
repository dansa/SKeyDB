import {describe, expect, it} from 'vitest'

import type {RelicDatabaseBrowseState} from './relic-database-browse-state'
import {buildRelicDatabaseViewResult} from './relic-database-view'
import {getRelics} from './relics'

const defaults: RelicDatabaseBrowseState = {
  categoryFilter: 'ALL',
  query: '',
  sortDirection: 'ASC',
  sortKey: 'BEST_MATCH',
  tierFilter: 'ALL',
}

describe('buildRelicDatabaseViewResult', () => {
  const relics = getRelics()

  it('keeps the public catalog at family grain', () => {
    expect(relics).toHaveLength(287)
    expect(buildRelicDatabaseViewResult(relics, defaults).relics).toHaveLength(287)
  })

  it('searches aliases, owner Awakeners, and facets', () => {
    expect(
      buildRelicDatabaseViewResult(relics, {
        ...defaults,
        query: 'Painted Malignant Child',
      }).relics.map((relic) => relic.name),
    ).toContain('Malignant Child')
    expect(
      buildRelicDatabaseViewResult(relics, {...defaults, query: 'Agrippa'}).relics.some(
        (relic) => relic.name === 'Dimensional Image: Agrippa',
      ),
    ).toBe(true)
    expect(
      buildRelicDatabaseViewResult(relics, {...defaults, query: 'Pendulum'}).relics.every((relic) =>
        relic.categories.includes('PENDULUM'),
      ),
    ).toBe(true)
    expect(
      buildRelicDatabaseViewResult(relics, {...defaults, query: 'Events'}).relics.every((relic) =>
        relic.categories.includes('EVENT'),
      ),
    ).toBe(true)
  })

  it('filters by category without depending on family rarity', () => {
    const filtered = buildRelicDatabaseViewResult(relics, {
      ...defaults,
      categoryFilter: 'PENDULUM',
    }).relics
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((relic) => relic.categories.includes('PENDULUM'))).toBe(true)
  })

  it('filters families by variant tier without flattening variants', () => {
    const fixture = relics.find((relic) => relic.name === 'Malignant Child')
    expect(fixture).toBeDefined()
    if (!fixture) return

    const filtered = buildRelicDatabaseViewResult(
      [
        {...fixture, id: 'relic-tier-silver', variantTiers: ['Silver']},
        {...fixture, id: 'relic-tier-cursed', variantTiers: ['Cursed']},
      ],
      {...defaults, tierFilter: 'SILVER'},
    ).relics

    expect(filtered.map((relic) => relic.id)).toEqual(['relic-tier-silver'])
  })

  it('requires category and tier to belong to the same exact variant', () => {
    const malignantChild = relics.find((relic) => relic.name === 'Malignant Child')
    expect(malignantChild).toBeDefined()
    if (!malignantChild) return

    expect(
      buildRelicDatabaseViewResult([malignantChild], {
        ...defaults,
        categoryFilter: 'FADED_LEGACY',
        tierFilter: 'GOLD',
      }).relics,
    ).toEqual([])
    expect(
      buildRelicDatabaseViewResult([malignantChild], {
        ...defaults,
        categoryFilter: 'FADED_LEGACY',
        tierFilter: 'SILVER',
      }).relics,
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
    const byVariants = buildRelicDatabaseViewResult(relics, {
      ...defaults,
      sortDirection: 'DESC',
      sortKey: 'VARIANT_COUNT',
    }).relics
    expect(byVariants[0]?.variantCount).toBe(9)
  })

  it('ignores leading quote punctuation for alphabetical order', () => {
    const fixture = relics[0]
    const sorted = buildRelicDatabaseViewResult(
      [
        {...fixture, id: 'relic-sort-memory', name: '"Memory"'},
        {...fixture, id: 'relic-sort-dream', name: 'Dream'},
      ],
      {...defaults, sortKey: 'ALPHABETICAL'},
    ).relics

    expect(sorted.map((relic) => relic.name)).toEqual(['Dream', '"Memory"'])
  })
})
