import {describe, expect, it, vi} from 'vitest'

import {createOwnedAwakenerBoxEntries} from './useOwnedAwakenerBoxEntries'

vi.mock('../../domain/awakeners', () => ({
  getAwakeners: () => [
    {id: 1, name: 'ramona', faction: 'The Fools', realm: 'CHAOS', aliases: [], rarity: 'SSR'},
  ],
}))

vi.mock('../../domain/awakener-assets', () => ({
  getAwakenerCardAsset: () => null,
}))

describe('createOwnedAwakenerBoxEntries', () => {
  it('falls back to level 60 when getAwakenerLevel is omitted', () => {
    const result = createOwnedAwakenerBoxEntries((awakenerName) =>
      awakenerName === 'ramona' ? 4 : null,
    )

    expect(result).toEqual([
      {
        name: 'ramona',
        displayName: 'Ramona',
        realm: 'CHAOS',
        rarity: 'SSR',
        index: 1,
        level: 4,
        awakenerLevel: 60,
        cardAsset: null,
      },
    ])
  })

  it('uses provided awakeners levels when getAwakenerLevel is passed', () => {
    const result = createOwnedAwakenerBoxEntries(
      (awakenerName) => (awakenerName === 'ramona' ? 4 : null),
      () => 77,
    )

    expect(result[0]?.awakenerLevel).toBe(77)
    expect(result[0]?.realm).toBe('CHAOS')
    expect(result[0]?.rarity).toBe('SSR')
    expect(result[0]?.index).toBe(1)
  })
})
