import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from './awakeners'
import {resolveTimelineBannerDerivedPool, type DerivedPoolInput} from './timeline-banner-pools'
import type {Wheel} from './wheels'

function owner(id: string, releaseDate: string | undefined): Awakener {
  return {
    id,
    name: id,
    aliases: [id],
    releaseDate,
    faction: 'test',
    realm: 'CHAOS',
    rarity: 'SSR',
    type: 'CHORUS',
    gender: 'Female',
    availabilityType: 'LIMITED_ASTRAL_REIGN',
    lineupToken: id,
    tags: [],
  }
}

function signature(awakener: Awakener): Wheel {
  return {
    id: `wheel-${awakener.id}`,
    name: `Wheel ${awakener.name}`,
    aliases: [],
    assetId: 'test',
    awakener: awakener.name,
    ownerAwakenerId: awakener.id,
    rarity: 'SSR',
    realm: 'CHAOS',
    mainstatKey: 'CRIT_RATE',
    lineupToken: awakener.id,
    tags: [],
  }
}

const openingDay = '2026-05-18'
const released = [owner('earlier', '2026-05-17'), owner('opening-day', openingDay)]
const inputs: DerivedPoolInput[] = [
  {slotCount: 4},
  {linkedPairs: true},
  {
    slots: [
      {kind: 'awakener', gender: 'Female', linked: true},
      {kind: 'wheel', gender: 'Female', count: 2},
    ],
  },
]

describe('banner opening-date eligibility', () => {
  it.each(inputs)(
    'does not grow existing owner/wheel pools after roster additions: %j',
    (input) => {
      const context = {
        awakeners: released,
        wheels: released.map(signature),
        releaseDateCutoff: openingDay,
      }
      const baseline = resolveTimelineBannerDerivedPool(input, 'test', context)
      const expanded = [
        ...released,
        owner('mid-banner', '2026-05-19'),
        owner('future', '2027-01-01'),
      ]
      vi.useFakeTimers()
      try {
        vi.setSystemTime(new Date('2028-01-01T00:00:00Z'))
        expect(
          resolveTimelineBannerDerivedPool(input, 'test', {
            ...context,
            awakeners: expanded,
            wheels: expanded.map(signature),
          }),
        ).toEqual(baseline)
      } finally {
        vi.useRealTimers()
      }
      expect(baseline[0].pool.map((unit) => unit.name)).toEqual(['earlier', 'opening-day'])
    },
  )

  it('keeps explicit exclusions for released characters and their signature wheels', () => {
    const slots = resolveTimelineBannerDerivedPool({excludeNames: ['opening-day']}, 'test', {
      awakeners: released,
      wheels: released.map(signature),
      releaseDateCutoff: openingDay,
    })
    expect(slots[0].pool.map((unit) => unit.name)).toEqual(['earlier'])
    expect(slots[1].pool.map((unit) => unit.name)).toEqual(['Wheel earlier'])
  })

  it.each([undefined, 'unknown', '2026-02-30'])(
    'reports missing/invalid eligible release dates instead of silently adding them: %s',
    (date) => {
      expect(() =>
        resolveTimelineBannerDerivedPool({linkedPairs: true}, 'test', {
          awakeners: [owner('unknown-date', date)],
          wheels: [],
          releaseDateCutoff: openingDay,
        }),
      ).toThrow(/unknown-date has no valid release date/)
    },
  )
})
