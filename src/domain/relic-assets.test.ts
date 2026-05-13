import {describe, expect, it} from 'vitest'

import {
  getRelicAssetByAssetId,
  getRelicPortraitAssetByAssetId,
  getRelicPortraitAssetByIngameId,
} from './relic-assets'

describe('relic portrait assets', () => {
  it('resolves portrait relic asset by full asset id', () => {
    expect(getRelicPortraitAssetByAssetId('Icon_Creation_Unique_B01')).toMatch(
      /Icon_Creation_Unique_B01\.webp$/,
    )
  })

  it('resolves global relic assets by full asset id', () => {
    expect(getRelicAssetByAssetId('Icon_Creation_144_AT')).toMatch(/Icon_Creation_144_AT\.webp$/)
  })

  it('resolves portrait relic asset by compact in-game id', () => {
    expect(getRelicPortraitAssetByIngameId('b01')).toMatch(/Icon_Creation_Unique_B01\.webp$/)
  })
})
