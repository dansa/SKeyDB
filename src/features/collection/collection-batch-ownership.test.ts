import {describe, expect, it} from 'vitest'

import type {Awakener} from '@/domain/awakeners'
import {
  clearOwnedEntry,
  normalizeCollectionOwnershipState,
  setOwnedLevel,
  type CollectionOwnershipCatalog,
} from '@/domain/collection-ownership'
import type {Posse} from '@/domain/posses'
import type {Wheel} from '@/domain/wheels'

import {
  markFilteredAwakenerOwnership,
  markFilteredPosseOwnership,
  markFilteredWheelOwnership,
} from './collection-batch-ownership'

const catalog: CollectionOwnershipCatalog = {
  awakenerIds: ['awakener-a', 'awakener-b'],
  wheelIds: ['wheel-a', 'wheel-b'],
  posseIds: ['posse-a', 'posse-b'],
}

const awakener = (id: string, name: string): Awakener => ({
  id,
  name,
  faction: 'Aequor',
  realm: 'AEQUOR',
  aliases: [],
  tags: [],
  lineupToken: id,
})

const wheel = (id: string): Wheel => ({
  id,
  assetId: id,
  name: id,
  rarity: 'SSR',
  realm: 'AEQUOR',
  awakener: '',
  aliases: [],
  tags: [],
  mainstatKey: 'CRIT_RATE',
  lineupToken: id,
})

const posse = (id: string): Posse => ({
  id,
  index: 1,
  name: id,
  realm: 'AEQUOR',
  isFadedLegacy: false,
  lineupToken: id,
})

describe('collection batch ownership', () => {
  it('marks filtered awakeners owned with current, remembered, or default levels', () => {
    const initial = clearOwnedEntry(
      setOwnedLevel(
        normalizeCollectionOwnershipState(null, catalog),
        'awakeners',
        'awakener-a',
        4,
        catalog,
      ),
      'awakeners',
      'awakener-b',
      catalog,
    )

    const next = markFilteredAwakenerOwnership(
      initial,
      [awakener('awakener-a', 'alpha'), awakener('awakener-b', 'beta')],
      new Map([
        ['alpha', 'awakener-a'],
        ['beta', 'awakener-b'],
      ]),
      {['awakener-b']: 7},
      catalog,
    )

    expect(next.ownedAwakeners).toMatchObject({
      'awakener-a': 4,
      'awakener-b': 7,
    })
  })

  it('marks filtered wheels owned with remembered levels when currently unowned', () => {
    const initial = clearOwnedEntry(
      setOwnedLevel(
        normalizeCollectionOwnershipState(null, catalog),
        'wheels',
        'wheel-a',
        5,
        catalog,
      ),
      'wheels',
      'wheel-b',
      catalog,
    )

    const next = markFilteredWheelOwnership(
      initial,
      [wheel('wheel-a'), wheel('wheel-b')],
      {['wheel-b']: 8},
      catalog,
    )

    expect(next.ownedWheels).toMatchObject({
      'wheel-a': 5,
      'wheel-b': 8,
    })
  })

  it('marks filtered posses owned with posse-normalized levels', () => {
    const initial = normalizeCollectionOwnershipState(null, catalog)

    const next = markFilteredPosseOwnership(
      initial,
      [posse('posse-a'), posse('posse-b')],
      {['posse-b']: 9},
      catalog,
    )

    expect(next.ownedPosses).toMatchObject({
      'posse-a': 0,
      'posse-b': 0,
    })
  })
})
