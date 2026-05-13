import {describe, expect, it} from 'vitest'

import {getLatestDzoneSeason} from '@/domain/dzone'

import {buildDZoneWaveCardViewModels, sortInitialRelicIds} from './d-zone-view-model'

describe('D-zone view model', () => {
  it('sorts shared season relics before wave-specific relics while preserving local order', () => {
    expect(sortInitialRelicIds(['relic-9001', 'relic-9004'], ['relic-9004'])).toEqual([
      'relic-9004',
      'relic-9001',
    ])
    expect(sortInitialRelicIds(['relic-9004', 'relic-9001', 'relic-9003'], [])).toEqual([
      'relic-9004',
      'relic-9001',
      'relic-9003',
    ])
  })

  it('builds wave card relic previews with the season realm relic first', () => {
    const [waveOne] = buildDZoneWaveCardViewModels(getLatestDzoneSeason())

    expect(waveOne.relics.map((relic) => relic.id)).toEqual(['relic-9004', 'relic-9001'])
    expect(waveOne.relics[0]).toMatchObject({
      id: 'relic-9004',
      name: '"Aequor Ring"',
    })
  })
})
