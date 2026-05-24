import {describe, expect, it} from 'vitest'

import {getAwakenerById, getAwakeners, resolveAwakenerLiteStatsForLevel} from './awakeners'

describe('getAwakeners', () => {
  it('returns clean awakeners with canonical names and aliases', () => {
    const awakeners = getAwakeners()

    expect(awakeners.length).toBeGreaterThan(0)
    expect(awakeners[0]).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^awakener-\d{4}$/),
        numericId: expect.any(Number),
        name: expect.any(String),
        faction: expect.any(String),
        realm: expect.any(String),
        aliases: expect.any(Array),
        rarity: expect.any(String),
        type: expect.any(String),
        stats: expect.objectContaining({
          CON: expect.any(Number),
          ATK: expect.any(Number),
          DEF: expect.any(Number),
        }),
        tags: expect.any(Array),
      }),
    )
    expect(awakeners.every((a) => /^awakener-\d{4}$/.test(a.id))).toBe(true)
    expect(
      awakeners.every(
        (a) => typeof a.numericId === 'number' && Number.isInteger(a.numericId) && a.numericId > 0,
      ),
    ).toBe(true)
    expect(awakeners.every((a) => a.name.trim().length > 0)).toBe(true)
    expect(awakeners.every((a) => a.faction.trim().length > 0)).toBe(true)
    expect(awakeners.every((a) => a.realm.trim().length > 0)).toBe(true)
    expect(awakeners.every((a) => a.aliases.length > 0)).toBe(true)
    expect(awakeners.every((a) => !a.rarity || a.rarity.trim().length > 0)).toBe(true)
  })

  it('uses public V3 ids as runtime ids without legacy leakage', () => {
    const awakeners = getAwakeners()
    const firstAwakener = awakeners.find((awakener) => awakener.id === 'awakener-0001')

    expect(firstAwakener).toMatchObject({
      id: 'awakener-0001',
      numericId: 1,
    })
    expect(
      awakeners.every(
        (awakener) =>
          !('source' in awakener) &&
          !('legacyId' in awakener) &&
          !('sourceAwakenerId' in awakener) &&
          !('publicId' in awakener),
      ),
    ).toBe(true)
  })

  it('assigns unique stable ids to all awakeners', () => {
    const awakeners = getAwakeners()
    const ids = awakeners.map((a) => a.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(ids.length)
  })

  it('uses canonical runtime names while retaining public V3 display aliases', () => {
    const awakeners = getAwakeners()

    for (const [name, alias] of [
      ['helot: catena', 'Helot: Catena'],
      ['doll: inferno', 'Doll: Inferno'],
      ['ramona: timeworn', 'Ramona: Timeworn'],
      ['murphy: fauxborn', 'Murphy: Fauxborn'],
    ] as const) {
      const awakener = awakeners.find((a) => a.name === name)
      expect(awakener).toBeDefined()
      expect(awakener?.aliases).toContain(alias)
    }
  })

  it('assigns valid type to every awakener', () => {
    const awakeners = getAwakeners()
    const validTypes = new Set(['ASSAULT', 'WARDEN', 'CHORUS', 'TBD'])

    expect(awakeners.every((a) => a.type && validTypes.has(a.type))).toBe(true)
  })

  it('includes stats with CON, ATK, DEF for every awakener', () => {
    const awakeners = getAwakeners()

    expect(
      awakeners.every(
        (a) =>
          a.stats !== undefined &&
          typeof a.stats.CON === 'number' &&
          typeof a.stats.ATK === 'number' &&
          typeof a.stats.DEF === 'number',
      ),
    ).toBe(true)
  })

  it('includes default-maxed Gnostic primary stat bonuses in lite resolved stats', () => {
    const saya = getAwakenerById('awakener-0057')

    expect(saya?.defaultPrimaryStatBonusLevel).toBe(10)
    expect(saya ? resolveAwakenerLiteStatsForLevel(saya, 60) : undefined).toEqual({
      CON: 104,
      ATK: 104,
      DEF: 99,
    })
    expect(saya ? resolveAwakenerLiteStatsForLevel(saya, 70)?.ATK : undefined).toBe(115)
  })

  it('provides tags as an array for every awakener', () => {
    const awakeners = getAwakeners()

    expect(awakeners.every((a) => Array.isArray(a.tags))).toBe(true)
    expect(awakeners.some((a) => a.tags.length > 0)).toBe(true)
  })

  it('supports optional unreleased flag', () => {
    const awakeners = getAwakeners()

    expect(
      awakeners.every((a) => a.unreleased === undefined || typeof a.unreleased === 'boolean'),
    ).toBe(true)
  })

  it('supports optional in-game id linkage', () => {
    const awakeners = getAwakeners()
    expect(awakeners.every((a) => a.ingameId === undefined || typeof a.ingameId === 'string')).toBe(
      true,
    )
  })

  it('keeps in-game id linkage unique when present', () => {
    const awakeners = getAwakeners()
    const ingameIds = awakeners
      .map((awakener) => awakener.ingameId)
      .filter((ingameId): ingameId is string => Boolean(ingameId))
    expect(new Set(ingameIds).size).toBe(ingameIds.length)
  })
})
