import {describe, expect, it} from 'vitest'

import {getAwakeners} from './awakeners'

describe('getAwakeners', () => {
  it('returns clean awakeners with canonical names and aliases', () => {
    const awakeners = getAwakeners()

    expect(awakeners.length).toBeGreaterThan(0)
    expect(awakeners[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
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
    expect(awakeners.every((a) => Number.isInteger(a.id) && a.id > 0)).toBe(true)
    expect(awakeners.every((a) => a.name.trim().length > 0)).toBe(true)
    expect(awakeners.every((a) => a.faction.trim().length > 0)).toBe(true)
    expect(awakeners.every((a) => a.realm.trim().length > 0)).toBe(true)
    expect(awakeners.every((a) => a.aliases.length > 0)).toBe(true)
    expect(awakeners.every((a) => !a.rarity || a.rarity.trim().length > 0)).toBe(true)
  })

  it('assigns unique stable ids to all awakeners', () => {
    const awakeners = getAwakeners()
    const ids = awakeners.map((a) => a.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(ids.length)
  })

  it('maps known alternate names to canonical display names', () => {
    const awakeners = getAwakeners()

    expect(awakeners.find((a) => a.name === 'helot: catena')).toBeDefined()
    expect(awakeners.find((a) => a.name === 'doll: inferno')).toBeDefined()
    expect(awakeners.find((a) => a.name === 'ramona: timeworn')).toBeDefined()
    expect(awakeners.find((a) => a.name === 'murphy: fauxborn')).toBeDefined()
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
