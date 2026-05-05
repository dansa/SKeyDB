import {describe, expect, it} from 'vitest'

import type {AwakenerOverlayRecord} from './awakener-source-schema'
import {resolveDatabaseOverlay, resolveDatabaseReferenceInfo} from './database-reference-info'
import {buildWheelDatabaseReferenceLayer} from './wheels-database-reference-layer'
import type {WheelFullRecord} from './wheels-full'

function buildWheelRecord(): WheelFullRecord {
  return {
    id: 'wheel-0001',
    assetId: 'Weapon_Full_B01',
    name: 'Merciful Nurturing',
    rarity: 'SSR',
    realm: 'CARO',
    ownerAwakenerId: 'awakener-0999',
    ownerAwakenerName: 'Tester',
    awakener: 'Tester',
    aliases: ['Merciful Nurturing'],
    searchTags: [],
    mainstatKey: 'KEYFLARE_REGEN',
    mainstatSeriesKey: 'SSR:KEYFLARE_REGEN',
    descriptionTemplate: 'Gain {Status Alias}.',
    descriptionArgs: {},
  }
}

function buildOverlayRecords(): AwakenerOverlayRecord[] {
  return [
    {
      id: 'overlay.global.status',
      displayName: 'Status',
      ownerAwakenerId: 999,
      overlayType: 'mechanic',
      aliases: ['Status Alias'],
      descriptionTemplate: 'Status overlay text.',
      descriptionArgs: {},
    },
  ]
}

describe('wheels-database-reference-layer', () => {
  it('resolves overlay aliases through the neutral reference contract with shared labels', () => {
    const referenceLayer = buildWheelDatabaseReferenceLayer({
      activeWheelId: 'wheel-0001',
      overlays: buildOverlayRecords(),
      wheelRecords: [buildWheelRecord()],
    })

    expect(resolveDatabaseReferenceInfo(referenceLayer, 'Status Alias')).toEqual(
      expect.objectContaining({
        kind: 'overlay',
        id: 'overlay.global.status',
        label: 'Mechanic',
        description: 'Status overlay text.',
      }),
    )
    expect(resolveDatabaseOverlay(referenceLayer, 'Status Alias')).toEqual(
      expect.objectContaining({
        id: 'overlay.global.status',
        displayName: 'Status',
      }),
    )
  })
})
