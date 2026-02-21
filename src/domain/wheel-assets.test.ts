import { describe, expect, it } from 'vitest'
import { getWheelAssetById } from './wheel-assets'

describe('getWheelAssetById', () => {
  it('resolves wheel asset by compact id', () => {
    expect(getWheelAssetById('SR19')).toEqual(expect.any(String))
  })
})

