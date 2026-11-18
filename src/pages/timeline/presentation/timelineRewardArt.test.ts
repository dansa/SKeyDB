import {describe, expect, it} from 'vitest'

import events from '@/data/timeline/events.json'
import type {EventEntry} from '@/domain/timeline'

import {rewardArtNames} from './timelineRewardArt'

describe('timeline reward art', () => {
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
