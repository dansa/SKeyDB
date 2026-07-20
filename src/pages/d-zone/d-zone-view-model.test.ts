import {describe, expect, it} from 'vitest'

import type {DzoneSeason} from '@/domain/dzone'

import {buildDZoneWaveCardViewModels, sortInitialRelicIds} from './d-zone-view-model'

const TEST_DZONE_SEASON: DzoneSeason = {
  id: 'dzone-9999',
  period: 9999,
  name: 'Test Zone',
  start: '2026-03-09T01:00:00.000Z',
  end: '2026-03-23T00:59:58.000Z',
  stageEffect: 'Astral Reign',
  waves: [
    {
      id: 'wave-1',
      name: 'Wave 1',
      initialRelicIds: ['relic-0241', 'relic-0084'],
      initialRelicVariantIds: ['relic-variant-0411', 'relic-variant-0105'],
      monsterIds: [],
      alerts: [{id: 'alert-1', name: 'Alert I', monsters: []}],
    },
    {
      id: 'wave-2',
      name: 'Wave 2',
      initialRelicIds: ['relic-0084'],
      initialRelicVariantIds: ['relic-variant-0105'],
      monsterIds: [],
      alerts: [{id: 'alert-1', name: 'Alert I', monsters: []}],
    },
  ],
}

describe('D-zone view model', () => {
  it('sorts shared season relics before wave-specific relics while preserving local order', () => {
    expect(sortInitialRelicIds(['relic-0241', 'relic-0084'], ['relic-0084'])).toEqual([
      'relic-0084',
      'relic-0241',
    ])
    expect(sortInitialRelicIds(['relic-0084', 'relic-0241', 'relic-0259'], [])).toEqual([
      'relic-0084',
      'relic-0241',
      'relic-0259',
    ])
  })

  it('builds wave card relic previews with the season realm relic first', () => {
    const [waveOne] = buildDZoneWaveCardViewModels(TEST_DZONE_SEASON)

    expect(waveOne.relics.map((relic) => relic.id)).toEqual(['relic-0084', 'relic-0241'])
    expect(waveOne.relics[0]).toMatchObject({
      id: 'relic-0084',
      variantId: 'relic-variant-0105',
      name: 'Caro Ring',
    })
    expect(waveOne.relics[1]).toMatchObject({
      id: 'relic-0241',
      variantId: 'relic-variant-0411',
      name: "Prophet's Lamp",
    })
  })
})
