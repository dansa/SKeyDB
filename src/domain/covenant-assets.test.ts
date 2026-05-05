import {describe, expect, it} from 'vitest'

import {getCovenantAssetById, getCovenantFullArtAssetById} from './covenant-assets'
import {getCovenants} from './covenants'

describe('getCovenantAssetById', () => {
  it('resolves public covenant ids to the current icon folder assets', () => {
    expect(getCovenantAssetById('covenant-0001')).toMatch(
      /covenants\/Icon\/Icon_Trinket_001\.webp$/,
    )
  })

  it('does not resolve compact pre-public asset ids', () => {
    expect(getCovenantAssetById('001')).toBeUndefined()
  })

  it('resolves icon and full-art assets for every covenant', () => {
    for (const covenant of getCovenants()) {
      expect(getCovenantAssetById(covenant.id), covenant.id).toBeTruthy()
      expect(getCovenantFullArtAssetById(covenant.id), covenant.id).toBeTruthy()
    }
  })
})
