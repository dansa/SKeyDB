import {describe, expect, it} from 'vitest'

import events from '@/data/timeline/events.json'
import type {EventEntry} from '@/domain/timeline'

import {getRewardArt, rewardArtNames} from './timelineRewardArt'

describe('timeline reward art', () => {
  it('uses the in-game Synaptic Enzyme icon without treating it as a cosmetic', () => {
    const art = getRewardArt({name: 'Synaptic Enzyme'})
    expect(art?.icon).toContain('synaptic-enzyme.webp')
    expect(art?.highlight).toBeFalsy()
  })

  it('resolves every Curriculum cosmetic by item ID regardless of localized name', () => {
    const cosmetics = (events as EventEntry[])
      .filter(({category}) => category === 'curriculum')
      .flatMap(({rewards}) => rewards?.flatMap(({items}) => items) ?? [])
      .filter(({itemId}) => itemId !== undefined)

    expect(cosmetics.length).toBeGreaterThanOrEqual(220)
    for (const {itemId} of cosmetics) {
      expect(getRewardArt({itemId, name: 'Renamed cosmetic'})).toMatchObject({
        highlight: true,
        icon: expect.stringContaining(`curriculum-${String(itemId)}.webp`),
      })
    }
  })

  it('only registers names used by reward, mission, or claim items', () => {
    const names = new Set<string>()
    for (const event of events as EventEntry[]) {
      for (const group of event.rewards ?? []) {
        for (const item of group.items) names.add(item.name)
        for (const claim of group.claims ?? []) {
          for (const item of claim.items) names.add(item.name)
        }
      }
      for (const mission of event.missions ?? []) {
        for (const item of [...mission.standard, ...(mission.premium ?? [])]) names.add(item.name)
      }
    }
    expect(rewardArtNames.filter((name) => !names.has(name))).toEqual([])
  })
})
