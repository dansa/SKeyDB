import {describe, expect, it} from 'vitest'

import {getMainstatByKey} from './mainstats'
import type {Wheel} from './wheels'
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
    ownerAwakenerId: 1,
    ownerAwakenerName: 'alpha',
    aliases: [name],
    tags: [],
    mainstatKey: 'KEYFLARE_REGEN',
    ...restOverrides,
  }
}

describe('searchWheels', () => {
  const keyflareLabel = getMainstatByKey('KEYFLARE_REGEN')?.label ?? 'Keyflare Regen'
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

  it('matches owner awakener names', () => {
    expect(searchWheels(wheels, 'beta').map((wheel) => wheel.id)).toEqual(['D12'])
  })

  it('matches realm labels', () => {
    expect(searchWheels(wheels, 'Caro').map((wheel) => wheel.id)).toEqual(['B01'])
  })

  it('matches wheel mainstat labels', () => {
    expect(searchWheels(wheels, keyflareLabel).map((wheel) => wheel.id)).toEqual(['B01'])
  })

  it('matches description-derived or lite search tags', () => {
    expect(searchWheels(wheels, 'Embryo Fusion').map((wheel) => wheel.id)).toEqual(['B01'])
  })

  it('keeps single-character queries scoped to primary wheel names', () => {
    expect(searchWheels(wheels, 'm').map((wheel) => wheel.id)).toEqual(['B01'])
    expect(searchWheels(wheels, 'b')).toEqual([])
  })

  it('still matches short supplemental queries like two-letter owner names', () => {
    const shortOwnerWheel = makeWheel({
      id: 'N11',
      name: "Magnolia's Lure",
      ownerAwakenerName: 'xu',
    })

    expect(searchWheels([shortOwnerWheel], 'xu').map((wheel) => wheel.id)).toEqual(['N11'])
  })

  it('formats neutral realms through the shared realm label helper', () => {
    const neutralWheel = makeWheel({
      id: 'R01',
      name: 'Blessing',
      realm: 'NEUTRAL',
    })

    expect(searchWheels([neutralWheel], 'Neutral').map((wheel) => wheel.id)).toEqual(['R01'])
  })
})
