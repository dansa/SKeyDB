import {describe, expect, it} from 'vitest'

import {getWheelAssetById, getWheelMiniAssetById} from './wheel-assets'

describe('getWheelAssetById', () => {
  it('resolves wheel asset by compact id', () => {
    expect(getWheelAssetById('SR19')).toEqual(expect.any(String))
  })

  it('resolves generated mini wheel asset by compact id', () => {
    expect(getWheelMiniAssetById('SR19')).toEqual(expect.any(String))
  })
})
