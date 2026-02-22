import { describe, expect, it } from 'vitest'
import { getCovenantAssetById } from './covenant-assets'

describe('getCovenantAssetById', () => {
  it('resolves covenant asset by compact id', () => {
    expect(getCovenantAssetById('001')).toMatch(/Icon_Trinket_001\.png$/)
  })
})
