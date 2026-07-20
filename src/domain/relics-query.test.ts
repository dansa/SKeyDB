import {describe, expect, it} from 'vitest'

import {getRelics} from './relics'
import {queryRelics} from './relics-query'
import {searchRelics} from './relics-search'

describe('relic database queries', () => {
  it('searches canonical family names through the public relic index', () => {
    expect(searchRelics(getRelics(), 'malignant child')[0]).toMatchObject({
      id: 'relic-0207',
      name: 'Malignant Child',
      variantCount: 5,
    })
  })

  it('includes shared families in each gameplay category without leaking event relics', () => {
    const astralReign = queryRelics(getRelics(), {category: 'ASTRAL_REIGN'})

    expect(astralReign.map((relic) => relic.id)).toContain('relic-0207')
    expect(astralReign.map((relic) => relic.id)).not.toContain('relic-0134')
    expect(queryRelics(getRelics(), {category: 'EVENT'}).map((relic) => relic.id)).toContain(
      'relic-0134',
    )
  })

  it('filters dimensional images by their linked public awakener', () => {
    expect(
      queryRelics(getRelics(), {
        category: 'DIMENSIONAL_IMAGE',
        ownerAwakenerId: 'awakener-0056',
      }),
    ).toEqual([
      expect.objectContaining({
        id: 'relic-0056',
        name: 'Dimensional Image: Arachne',
      }),
    ])
  })

  it('combines search and structured filters', () => {
    expect(
      queryRelics(getRelics(), {
        query: 'omen ritual bird',
        category: 'FADED_LEGACY',
      }),
    ).toEqual([expect.objectContaining({id: 'relic-0229', variantCount: 4})])
  })
})
