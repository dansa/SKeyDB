import {describe, expect, it} from 'vitest'

import {getWheels, type Wheel} from './wheels'
import {searchWheels} from './wheels-search'

function makeWheel(overrides: Partial<Wheel> & Pick<Wheel, 'id' | 'name'>): Wheel {
  const {id, name, ...restOverrides} = overrides

  return {
    id,
    assetId: `Weapon_Full_${id}`,
    name,
    rarity: 'SSR',
    realm: 'CARO',
    awakener: 'alpha',
    ownerAwakenerId: 'awakener-0001',
    ownerAwakenerName: 'alpha',
    aliases: [name],
    tags: [],
    mainstatKey: 'KEYFLARE_REGEN',
    lineupToken: 'a',
    ...restOverrides,
  }
}

describe('searchWheels', () => {
  const wheels = [
    makeWheel({
      id: 'B01',
      name: 'Merciful Nurturing',
      aliases: ['Merciful Nurturing', 'Nurturing'],
      ownerAwakenerName: 'alpha',
      tags: ['Embryo Fusion', 'Hand Limit'],
    }),
    makeWheel({
      id: 'D12',
      name: 'Shared Dream',
      realm: 'CHAOS',
      ownerAwakenerName: 'beta',
      mainstatKey: 'CRIT_RATE',
      tags: ['Bleed'],
    }),
  ]

  it('matches wheel names', () => {
    expect(searchWheels(wheels, 'Merciful').map((wheel) => wheel.id)).toEqual(['B01'])
  })

  it('matches wheel aliases', () => {
    expect(searchWheels(wheels, 'Nurturing').map((wheel) => wheel.id)).toEqual(['B01'])
  })

  it('matches description-derived or lite search tags', () => {
    expect(searchWheels(wheels, 'Embryo Fusion').map((wheel) => wheel.id)).toEqual(['B01'])
  })

  it('matches generated owner and realm search fields', () => {
    const realWheels = getWheels()

    expect(searchWheels(realWheels, 'Thais').map((wheel) => wheel.name)).toContain(
      'Merciful Nurturing',
    )
    expect(searchWheels(realWheels, 'Caro').some((wheel) => wheel.realm === 'CARO')).toBe(true)
  })

  it('does not treat wheel mainstats as searchable effect text', () => {
    const realWheels = getWheels()

    expect(
      searchWheels(realWheels, 'Keyflare Regen').filter(
        (wheel) => wheel.mainstatKey === 'KEYFLARE_REGEN',
      ),
    ).toEqual([])
  })

  it('keeps single-character queries scoped to primary wheel names', () => {
    expect(searchWheels(wheels, 'm').map((wheel) => wheel.id)).toEqual(['B01'])
    expect(searchWheels(wheels, 'b')).toEqual([])
  })

  it('matches short exact owner names from generated search fields', () => {
    expect(searchWheels(getWheels(), 'Xu').map((wheel) => wheel.ownerAwakenerName)).toContain('Xu')
  })
})
