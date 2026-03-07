import {describe, expect, it} from 'vitest'

import type {Awakener} from './awakeners'
import {
  buildDatabaseAwakenerPath,
  findAwakenerByDatabaseSlug,
  toDatabaseAwakenerSlug,
} from './database-paths'

function makeAwakener(overrides: Partial<Awakener>): Awakener {
  return {
    id: 1,
    name: 'thais',
    faction: 'Test',
    realm: 'CARO',
    rarity: 'SSR',
    type: 'ASSAULT',
    aliases: ['Thais'],
    tags: [],
    ...overrides,
  }
}

describe('database paths', () => {
  it('builds a stable awakener detail path from canonical name', () => {
    expect(buildDatabaseAwakenerPath(makeAwakener({name: 'helot: catena'}))).toBe(
      '/database/awk/helot-catena',
    )
  })

  it('normalizes awakener names into shareable slugs', () => {
    expect(toDatabaseAwakenerSlug('Ramona: Timeworn')).toBe('ramona-timeworn')
    expect(toDatabaseAwakenerSlug('Kathigu-Ra')).toBe('kathigu-ra')
    expect(toDatabaseAwakenerSlug('24')).toBe('24')
  })

  it('finds awakeners by canonical slug', () => {
    const awakeners = [
      makeAwakener({id: 1, name: 'thais'}),
      makeAwakener({id: 2, name: 'helot: catena'}),
    ]

    expect(findAwakenerByDatabaseSlug(awakeners, 'helot-catena')?.id).toBe(2)
  })

  it('returns null for unknown slugs', () => {
    expect(findAwakenerByDatabaseSlug([makeAwakener({id: 1, name: 'thais'})], 'missing')).toBeNull()
  })
})
