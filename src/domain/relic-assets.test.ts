import {describe, expect, it} from 'vitest'

import {getRelicPortraitAssetByAssetId, getRelicPortraitAssetByIngameId} from './relic-assets'

describe('relic portrait assets', () => {
  it('resolves portrait relic asset by full asset id', () => {
    expect(getRelicPortraitAssetByAssetId('Icon_Creation_Unique_B01')).toMatch(
      /Icon_Creation_Unique_B01\.png$/,
    )
  })

  it('resolves portrait relic asset by compact in-game id', () => {
    expect(getRelicPortraitAssetByIngameId('b01')).toMatch(/Icon_Creation_Unique_B01\.png$/)
  })
})
