import {describe, expect, it} from 'vitest'

import {getDzoneSeasonById} from '@/domain/dzone'

import {getDZoneCountdownDisplay} from './d-zone-countdown'

describe('getDZoneCountdownDisplay', () => {
  it('only displays countdown text for active D-zone seasons', () => {
    const activeSeason = getDzoneSeasonById('dzone-0060')
    const endedSeason = getDzoneSeasonById('dzone-0001')

    if (!activeSeason || !endedSeason) {
      throw new Error('Expected fixture seasons to exist.')
    }

    expect(getDZoneCountdownDisplay(activeSeason, new Date('2026-05-12T00:00:00.000Z'))).toMatch(
      /^Ends in/,
    )
    expect(getDZoneCountdownDisplay(endedSeason, new Date('2026-05-12T00:00:00.000Z'))).toBe('')
  })
})
