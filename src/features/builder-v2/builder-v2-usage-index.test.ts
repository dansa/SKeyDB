import {describe, expect, it} from 'vitest'

import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'

import {createEmptyTeamSlots} from '../builder/constants'
import type {Team} from '../builder/types'
import {buildBuilderV2UsageIndex} from './builder-v2-usage-index'

describe('buildBuilderV2UsageIndex', () => {
  it('indexes first non-support owners for awakeners, wheels, and posses', () => {
    const teamOneSlots = createEmptyTeamSlots()
    teamOneSlots[0] = {
      ...teamOneSlots[0],
      awakenerId: 'awakener-0021',
      wheels: ['wheel-0050', null],
      covenantId: 'c01',
    }
    teamOneSlots[1] = {
      ...teamOneSlots[1],
      awakenerId: 'awakener-0020',
      isSupport: true,
      wheels: ['wheel-0051', null],
    }

    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      wheels: ['wheel-0050', 'wheel-0052'],
    }

    const teams: Team[] = [
      {id: 'team-1', name: 'Team 1', slots: teamOneSlots, posseId: 'posse-0033'},
      {id: 'team-2', name: 'Team 2', slots: teamTwoSlots, posseId: 'posse-0033'},
    ]

    const index = buildBuilderV2UsageIndex(teams)

    expect(index.awakenerByIdentityKey.get(getAwakenerIdentityKeyById('awakener-0021'))).toEqual({
      teamId: 'team-1',
      teamOrder: 0,
    })
    expect(index.awakenerByIdentityKey.has(getAwakenerIdentityKeyById('awakener-0020'))).toBe(false)
    expect(index.wheelById.get('wheel-0050')).toEqual({
      teamOrder: 0,
      teamId: 'team-1',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
    expect(index.wheelById.has('wheel-0051')).toBe(false)
    expect(index.wheelById.get('wheel-0052')).toEqual({
      teamOrder: 1,
      teamId: 'team-2',
      slotId: 'slot-1',
      wheelIndex: 1,
    })
    expect(index.posseById.get('posse-0033')).toBe(0)
  })
})
