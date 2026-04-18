import {describe, expect, it} from 'vitest'

import {wheelMainstatScalingSourceSchema, wheelSourceDatasetSchema} from './wheel-source-schema'

describe('wheelSourceDatasetSchema', () => {
  it('rejects duplicate wheel ids', () => {
    try {
      wheelSourceDatasetSchema.parse([
        {
          id: 'B01',
          assetId: 'Weapon_Full_B01',
          rarity: 'SSR',
          realm: 'CARO',
          mainstatKey: 'KEYFLARE_REGEN',
          name: 'First',
          descriptionTemplate: 'First description.',
          descriptionArgs: {},
        },
        {
          id: 'B01',
          assetId: 'Weapon_Full_B01_DUP',
          rarity: 'SSR',
          realm: 'CARO',
          mainstatKey: 'DMG_AMP',
          name: 'Duplicate',
          descriptionTemplate: 'Duplicate description.',
          descriptionArgs: {},
        },
      ])
      throw new Error('Expected duplicate wheel id parse to fail.')
    } catch (error) {
      expect(String(error)).toContain('Duplicate wheel id \\"B01\\"')
    }
  })
})

describe('wheelMainstatScalingSourceSchema', () => {
  it('rejects duplicate series keys', () => {
    try {
      wheelMainstatScalingSourceSchema.parse({
        growthStartLevel: 4,
        series: [
          {
            seriesKey: 'SR:CRIT_RATE',
            rarity: 'SR',
            mainstatKey: 'CRIT_RATE',
            baseValue: '7.2%',
            perLevel: '0.6%',
          },
          {
            seriesKey: 'SR:CRIT_RATE',
            rarity: 'SR',
            mainstatKey: 'CRIT_RATE',
            baseValue: '7.2%',
            perLevel: '0.6%',
          },
        ],
      })
      throw new Error('Expected duplicate wheel mainstat series parse to fail.')
    } catch (error) {
      expect(String(error)).toContain('Duplicate wheel mainstat series key \\"SR:CRIT_RATE\\"')
    }
  })
})
