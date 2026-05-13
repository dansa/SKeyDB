import {describe, expect, it} from 'vitest'

import {getDzoneMonsters} from './dzone'
import {buildDzoneMonsterPreviewAssetMap, getDzoneMonsterPreviewAsset} from './dzone-assets'

describe('D-zone monster preview assets', () => {
  it('resolves every monster assetName to a webp asset', () => {
    for (const monster of getDzoneMonsters()) {
      expect(getDzoneMonsterPreviewAsset(monster.assetName), monster.assetName).toMatch(/\.webp$/)
    }
  })

  it('supports shared monster preview assets', () => {
    const sharedAssetName = 'Portrait_Small_Monster_S2C0501_AT'

    expect(
      getDzoneMonsters().filter((monster) => monster.assetName === sharedAssetName),
    ).toHaveLength(2)
    expect(getDzoneMonsterPreviewAsset(sharedAssetName)).toMatch(/\.webp$/)
  })

  it('rejects duplicate asset basenames instead of overwriting', () => {
    expect(() =>
      buildDzoneMonsterPreviewAssetMap({
        '../assets/monster-preview/Duplicate.webp': '/assets/first.webp',
        '../other/monster-preview/Duplicate.webp': '/assets/second.webp',
      }),
    ).toThrow('Duplicate D-zone monster preview asset basename "Duplicate".')
  })
})
