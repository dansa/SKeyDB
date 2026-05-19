import {describe, expect, it, vi} from 'vitest'

import type {PublicSearchDocument} from '@/data-access/public-data/contract'

import {searchPublicEntities} from './public-search'

const {documentsById} = vi.hoisted(() => ({
  documentsById: new Map<string, PublicSearchDocument>(),
}))

vi.mock('@/data-access/public-data/searchRepository', () => ({
  getPublicSearchDocument: (_scope: string, id: string) => documentsById.get(id),
}))

describe('searchPublicEntities', () => {
  it('keeps generated tag values to exact and prefix lookup matches', () => {
    documentsById.clear()
    documentsById.set('awakener-test', {
      kind: 'awakener',
      id: 'awakener-test',
      name: 'Machine Oath',
      aliases: [],
      tokens: ['discard', 'machine', 'oath'],
      fields: {name: ['Machine Oath'], tag: ['Discard']},
    })
    const entities = [{id: 'awakener-test', name: 'Machine Oath'}]

    expect(searchPublicEntities('awakeners', entities, 'disc').map((entity) => entity.id)).toEqual([
      'awakener-test',
    ])
    expect(searchPublicEntities('awakeners', entities, 'car')).toEqual([])
  })

  it('allows short tag prefixes without ranking them above name matches', () => {
    documentsById.clear()
    documentsById.set('awakener-vulnerable', {
      kind: 'awakener',
      id: 'awakener-vulnerable',
      name: 'Machine Oath',
      aliases: [],
      tokens: ['machine', 'oath', 'vuln', 'vulnerable'],
      fields: {name: ['Machine Oath'], tag: ['vuln', 'vulnerable']},
    })
    documentsById.set('awakener-vu-name', {
      kind: 'awakener',
      id: 'awakener-vu-name',
      name: 'Vulcan',
      aliases: [],
      tokens: ['vulcan'],
      fields: {name: ['Vulcan']},
    })
    const entities = [
      {id: 'awakener-vulnerable', name: 'Machine Oath'},
      {id: 'awakener-vu-name', name: 'Vulcan'},
    ]

    expect(searchPublicEntities('awakeners', entities, 'vu').map((entity) => entity.id)).toEqual([
      'awakener-vu-name',
      'awakener-vulnerable',
    ])
    expect(searchPublicEntities('awakeners', entities, 'vul').map((entity) => entity.id)).toEqual([
      'awakener-vu-name',
      'awakener-vulnerable',
    ])
  })

  it('allows short tag prefixes when there is no name match', () => {
    documentsById.clear()
    documentsById.set('awakener-vulnerable', {
      kind: 'awakener',
      id: 'awakener-vulnerable',
      name: 'Machine Oath',
      aliases: [],
      tokens: ['machine', 'oath', 'vuln', 'vulnerable'],
      fields: {name: ['Machine Oath'], tag: ['vuln', 'vulnerable']},
    })
    const entities = [{id: 'awakener-vulnerable', name: 'Machine Oath'}]

    expect(searchPublicEntities('awakeners', entities, 'vu').map((entity) => entity.id)).toEqual([
      'awakener-vulnerable',
    ])
  })

  it('allows short tag prefixes alongside stronger name matches', () => {
    documentsById.clear()
    documentsById.set('awakener-clementine', {
      kind: 'awakener',
      id: 'awakener-clementine',
      name: 'Clementine',
      aliases: ['clementine'],
      tokens: ['clementine', 'cleanse'],
      fields: {name: ['Clementine'], alias: ['clementine'], tag: ['cleanse']},
    })
    documentsById.set('awakener-cleanse', {
      kind: 'awakener',
      id: 'awakener-cleanse',
      name: 'Machine Oath',
      aliases: [],
      tokens: ['machine', 'oath', 'cleanse'],
      fields: {name: ['Machine Oath'], tag: ['cleanse']},
    })
    const entities = [
      {id: 'awakener-clementine', name: 'Clementine'},
      {id: 'awakener-cleanse', name: 'Machine Oath'},
    ]

    expect(searchPublicEntities('awakeners', entities, 'cl').map((entity) => entity.id)).toEqual([
      'awakener-clementine',
      'awakener-cleanse',
    ])
  })

  it('keeps one-character queries focused on names even when tags share the prefix', () => {
    documentsById.clear()
    documentsById.set('awakener-caecus', {
      kind: 'awakener',
      id: 'awakener-caecus',
      name: 'Caecus',
      aliases: ['caecus'],
      tokens: ['caecus'],
      fields: {name: ['Caecus'], alias: ['caecus']},
    })
    documentsById.set('awakener-counter', {
      kind: 'awakener',
      id: 'awakener-counter',
      name: 'Machine Oath',
      aliases: [],
      tokens: ['machine', 'oath', 'counter'],
      fields: {name: ['Machine Oath'], tag: ['Counter']},
    })
    const entities = [
      {id: 'awakener-caecus', name: 'Caecus'},
      {id: 'awakener-counter', name: 'Machine Oath'},
    ]

    expect(searchPublicEntities('awakeners', entities, 'c').map((entity) => entity.id)).toEqual([
      'awakener-caecus',
    ])
  })

  it('does not match bare facet stopwords while preserving full facet phrases', () => {
    documentsById.clear()
    documentsById.set('awakener-fools', {
      kind: 'awakener',
      id: 'awakener-fools',
      name: 'Machine Oath',
      aliases: [],
      tokens: ['machine', 'oath', 'the', 'the fools'],
      fields: {name: ['Machine Oath'], facet: ['The Fools']},
    })
    documentsById.set('awakener-thais', {
      kind: 'awakener',
      id: 'awakener-thais',
      name: 'Thais',
      aliases: ['thais'],
      tokens: ['thais'],
      fields: {name: ['Thais'], alias: ['thais']},
    })
    const entities = [
      {id: 'awakener-fools', name: 'Machine Oath'},
      {id: 'awakener-thais', name: 'Thais'},
    ]

    expect(searchPublicEntities('awakeners', entities, 'the')).toEqual([])
    expect(
      searchPublicEntities('awakeners', entities, 'the fools').map((entity) => entity.id),
    ).toEqual(['awakener-fools'])
  })

  it('keeps generated facet values to exact and prefix lookup matches', () => {
    documentsById.clear()
    documentsById.set('awakener-test', {
      kind: 'awakener',
      id: 'awakener-test',
      name: 'Machine Oath',
      aliases: [],
      tokens: ['caro', 'machine', 'oath'],
      fields: {name: ['Machine Oath'], facet: ['CARO']},
    })
    const entities = [{id: 'awakener-test', name: 'Machine Oath'}]

    expect(searchPublicEntities('awakeners', entities, 'car').map((entity) => entity.id)).toEqual([
      'awakener-test',
    ])
    expect(searchPublicEntities('awakeners', entities, 'aro')).toEqual([])
  })

  it('keeps generated owner values to exact, prefix, and word-prefix lookup matches', () => {
    documentsById.clear()
    documentsById.set('posse-test', {
      kind: 'posse',
      id: 'posse-test',
      name: 'Blue Pact',
      aliases: [],
      tokens: ['blue', 'catena', 'helot', 'pact'],
      fields: {name: ['Blue Pact'], owner: ['Helot: Catena', 'g-helot']},
    })
    const entities = [{id: 'posse-test', name: 'Blue Pact'}]

    expect(searchPublicEntities('posses', entities, 'g-helot').map((entity) => entity.id)).toEqual([
      'posse-test',
    ])
    expect(searchPublicEntities('posses', entities, 'cat').map((entity) => entity.id)).toEqual([
      'posse-test',
    ])
    expect(searchPublicEntities('posses', entities, 'tena')).toEqual([])
  })

  it('does not search generated facets unless they are explicit search fields', () => {
    documentsById.clear()
    documentsById.set('covenant-test', {
      kind: 'covenant',
      id: 'covenant-test',
      name: 'Machine Oath',
      aliases: [],
      tokens: ['machine', 'oath'],
      fields: {name: ['Machine Oath']},
      facets: {setBonus: ['6-piece']},
    })

    expect(
      searchPublicEntities('covenants', [{id: 'covenant-test', name: 'Machine Oath'}], '6-piece'),
    ).toEqual([])
  })

  it('does not reuse an earlier search index when fallback fields change', () => {
    documentsById.clear()
    const entities = [{id: 'awakener-fallback', name: 'Silent Bell'}]

    expect(searchPublicEntities('awakeners', entities, 'ember')).toEqual([])
    expect(
      searchPublicEntities('awakeners', entities, 'ember', {
        getFallbackFields: () => ({alias: ['Ember Bell']}),
      }).map((entity) => entity.id),
    ).toEqual(['awakener-fallback'])
  })

  it('builds fallback fields once when a query uses both direct and fuzzy search paths', () => {
    documentsById.clear()
    const entities = [{id: 'awakener-fallback', name: 'Silent Bell'}]
    const fallbackFields = vi.fn(() => ({alias: ['Silent Bell']}))

    expect(
      searchPublicEntities('awakeners', entities, 'sile', {
        getFallbackFields: fallbackFields,
      }).map((entity) => entity.id),
    ).toEqual(['awakener-fallback'])
    expect(fallbackFields).toHaveBeenCalledOnce()
  })

  it('searches generated tokens as explicit low-priority runtime fields', () => {
    documentsById.clear()
    documentsById.set('awakener-token', {
      kind: 'awakener',
      id: 'awakener-token',
      name: 'Silent Bell',
      aliases: [],
      tokens: ['emberline'],
      fields: {name: ['Silent Bell']},
    })

    expect(
      searchPublicEntities('awakeners', [{id: 'awakener-token', name: 'Silent Bell'}], 'ember').map(
        (entity) => entity.id,
      ),
    ).toEqual(['awakener-token'])
  })

  it('keeps fuzzy typo tolerance scoped to names and aliases', () => {
    documentsById.clear()
    documentsById.set('awakener-clementine', {
      kind: 'awakener',
      id: 'awakener-clementine',
      name: 'Clementine',
      aliases: ['clementine'],
      tokens: ['clementine'],
      fields: {name: ['Clementine'], alias: ['clementine']},
    })
    documentsById.set('awakener-cleanse', {
      kind: 'awakener',
      id: 'awakener-cleanse',
      name: 'Caecus',
      aliases: ['caecus'],
      tokens: ['caecus', 'cleanse', 'clear'],
      fields: {name: ['Caecus'], alias: ['caecus'], tag: ['cleanse', 'clear']},
    })
    const entities = [
      {id: 'awakener-clementine', name: 'Clementine'},
      {id: 'awakener-cleanse', name: 'Caecus'},
    ]

    expect(searchPublicEntities('awakeners', entities, 'clem').map((entity) => entity.id)).toEqual([
      'awakener-clementine',
    ])
    expect(
      searchPublicEntities('awakeners', entities, 'clemntine').map((entity) => entity.id),
    ).toEqual(['awakener-clementine'])
  })
})
