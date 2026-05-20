import {describe, expect, it} from 'vitest'

import type {Awakener} from './awakeners'
import {
  buildDatabaseAwakenerPath,
  buildDatabaseWheelPath,
  DATABASE_AWAKENER_TABS,
  DATABASE_AWAKENER_VISIBLE_TABS,
  findAwakenerByDatabaseSlug,
  findWheelByDatabaseSlug,
  resolveDatabaseAwakenerTab,
  resolveDatabaseAwakenerVisibleTab,
  toDatabaseAwakenerSlug,
  toDatabaseWheelSlug,
} from './database-paths'
import type {Wheel} from './wheels'

function makeAwakener(overrides: Partial<Awakener>): Awakener {
  return {
    id: 'awakener-0001',
    numericId: 1,
    name: 'thais',
    faction: 'Test',
    realm: 'CARO',
    rarity: 'SSR',
    type: 'ASSAULT',
    aliases: ['Thais'],
    tags: [],
    lineupToken: 'a',
    ...overrides,
  }
}

function makeWheel(overrides: Partial<Wheel>): Wheel {
  return {
    id: 'B01',
    assetId: 'Weapon_Full_B01',
    name: 'Merciful Nurturing',
    rarity: 'SSR',
    realm: 'CARO',
    awakener: 'thais',
    aliases: ['Merciful Nurturing'],
    tags: ['Caro'],
    mainstatKey: 'KEYFLARE_REGEN',
    lineupToken: 'a',
    ...overrides,
  }
}

describe('database paths', () => {
  it('builds a stable awakener detail path from canonical name', () => {
    expect(
      buildDatabaseAwakenerPath(makeAwakener({id: 'awakener-0019', name: 'helot: catena'})),
    ).toBe('/database/awakeners/helot-catena')
    expect(
      buildDatabaseAwakenerPath(makeAwakener({id: 'awakener-0019', name: 'helot: catena'}), 'lore'),
    ).toBe('/database/awakeners/helot-catena/lore')
  })

  it('normalizes awakener names into shareable slugs', () => {
    expect(toDatabaseAwakenerSlug('Ramona: Timeworn')).toBe('ramona-timeworn')
    expect(toDatabaseAwakenerSlug('Kathigu-Ra')).toBe('kathigu-ra')
    expect(toDatabaseAwakenerSlug('24')).toBe('24')
  })

  it('builds a stable wheel detail path from canonical name', () => {
    expect(buildDatabaseWheelPath(makeWheel({name: 'Merciful Nurturing'}))).toBe(
      '/database/wheels/merciful-nurturing',
    )
  })

  it('normalizes wheel names into shareable slugs', () => {
    expect(toDatabaseWheelSlug('Merciful Nurturing')).toBe('merciful-nurturing')
    expect(toDatabaseWheelSlug('Helot: Catena')).toBe('helot-catena')
  })

  it('finds awakeners by canonical slug', () => {
    const awakeners = [
      makeAwakener({id: 'awakener-0001', name: 'thais'}),
      makeAwakener({id: 'awakener-0019', name: 'helot: catena'}),
    ]

    expect(findAwakenerByDatabaseSlug(awakeners, 'helot-catena')?.id).toBe('awakener-0019')
  })

  it('returns null for unknown slugs', () => {
    expect(
      findAwakenerByDatabaseSlug([makeAwakener({id: 'awakener-0001', name: 'thais'})], 'missing'),
    ).toBeNull()
  })

  it('finds wheels by canonical slug', () => {
    const wheels = [
      makeWheel({id: 'B01', name: 'Merciful Nurturing'}),
      makeWheel({id: 'D12', name: 'Shared Dream'}),
    ]

    expect(findWheelByDatabaseSlug(wheels, 'shared-dream')?.id).toBe('D12')
  })

  it('returns null for unknown wheel slugs', () => {
    expect(findWheelByDatabaseSlug([makeWheel({id: 'B01'})], 'missing')).toBeNull()
  })

  it('resolves allowed database tab slugs', () => {
    expect(resolveDatabaseAwakenerTab('builds')).toBe('builds')
    expect(resolveDatabaseAwakenerTab('Builds')).toBe('builds')
    expect(resolveDatabaseAwakenerTab('lore')).toBe('lore')
    expect(resolveDatabaseAwakenerTab('upgrades')).toBe('upgrades')
    expect(resolveDatabaseAwakenerTab('skills')).toBe('skills')
    expect(resolveDatabaseAwakenerTab('cards')).toBe('skills')
    expect(resolveDatabaseAwakenerTab(undefined)).toBeNull()
    expect(resolveDatabaseAwakenerTab('missing')).toBeNull()
    expect(DATABASE_AWAKENER_TABS).toEqual([
      'overview',
      'upgrades',
      'skills',
      'builds',
      'teams',
      'lore',
    ])
    expect(DATABASE_AWAKENER_VISIBLE_TABS).toEqual(['upgrades', 'skills', 'teams', 'lore'])
  })

  it('uses upgrades as the visible fallback for hidden or disabled awakener tabs', () => {
    expect(buildDatabaseAwakenerPath(makeAwakener({name: 'thais'}))).toBe(
      '/database/awakeners/thais',
    )
    expect(buildDatabaseAwakenerPath(makeAwakener({name: 'thais'}), 'overview')).toBe(
      '/database/awakeners/thais',
    )
    expect(buildDatabaseAwakenerPath(makeAwakener({name: 'thais'}), 'builds')).toBe(
      '/database/awakeners/thais',
    )
    expect(resolveDatabaseAwakenerVisibleTab('overview')).toBe('upgrades')
    expect(resolveDatabaseAwakenerVisibleTab('builds')).toBe('upgrades')
    expect(resolveDatabaseAwakenerVisibleTab(null)).toBe('upgrades')
  })
})
