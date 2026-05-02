import {describe, expect, it} from 'vitest'

import {getAwakeners} from './awakeners'
import {getPortraitRelicByAwakenerId, getPortraitRelics, getRelics} from './relics'

describe('getRelics', () => {
  it('returns parsed public V2 relics with stable ids', () => {
    const relics = getRelics()
    expect(relics.length).toBeGreaterThan(0)
    expect(relics[0]).toEqual({
      id: expect.stringMatching(/^relic-\d{4}$/),
      kind: expect.stringMatching(/^(PORTRAIT|GENERIC)$/),
      ownerAwakenerId: expect.stringMatching(/^awakener-\d{4}$/),
      ownerAwakenerName: expect.any(String),
      assetId: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
    })
  })

  it('does not leak unresolved source placeholders or wrappers into generated descriptions', () => {
    const relics = getRelics()
    expect(relics.every((relic) => !relic.description.includes('[Arg'))).toBe(true)
    expect(relics.every((relic) => !relic.description.includes('<'))).toBe(true)
  })
})

describe('getPortraitRelics', () => {
  it('returns portrait relics linked by public awakener id', () => {
    const portraits = getPortraitRelics()
    expect(portraits.length).toBeGreaterThan(0)
    expect(portraits.every((relic) => relic.ownerAwakenerId.trim().length > 0)).toBe(true)
  })

  it('enforces unique public awakener ids for portrait relic linkage', () => {
    const portraits = getPortraitRelics()
    const uniqueAwakenerIds = new Set(portraits.map((relic) => relic.ownerAwakenerId))
    expect(uniqueAwakenerIds.size).toBe(portraits.length)
  })

  it('only links portrait relics to known public awakeners', () => {
    const knownAwakenerIds = new Set(getAwakeners().map((awakener) => awakener.id))
    const portraits = getPortraitRelics()
    expect(portraits.every((relic) => knownAwakenerIds.has(relic.ownerAwakenerId))).toBe(true)
  })

  it('keeps portrait relic asset ids aligned with owner ingame ids', () => {
    const awakenerById = new Map(getAwakeners().map((awakener) => [awakener.id, awakener]))
    const mismatches = getPortraitRelics()
      .map((relic) => {
        const awakener = awakenerById.get(relic.ownerAwakenerId)
        const expectedAssetId = awakener?.ingameId
          ? `Icon_Creation_Unique_${awakener.ingameId}`
          : undefined
        return expectedAssetId && relic.assetId !== expectedAssetId
          ? `${relic.id}: expected ${expectedAssetId}, got ${relic.assetId}`
          : null
      })
      .filter((message): message is string => Boolean(message))

    expect(mismatches).toEqual([])
  })
})

describe('getPortraitRelicByAwakenerId', () => {
  it('resolves portrait relic lookup by public awakener id', () => {
    const arachne = getPortraitRelicByAwakenerId('awakener-0056')

    expect(arachne).toMatchObject({
      id: 'relic-0056',
      assetId: 'Icon_Creation_Unique_D10',
      name: 'Dimensional Image: Arachne',
      ownerAwakenerId: 'awakener-0056',
    })
  })

  it('keeps key relic references in canonical tagged form for the database UI', () => {
    expect(getPortraitRelicByAwakenerId('awakener-0002')?.description).toContain('{Reluctant Alms}')
    expect(getPortraitRelicByAwakenerId('awakener-0047')?.description).toContain(
      '{Silver Key Dawn}',
    )
    expect(getPortraitRelicByAwakenerId('awakener-0033')?.description).toContain('Temporary Strike')
  })
})
