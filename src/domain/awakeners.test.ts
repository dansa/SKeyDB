import { describe, expect, it } from 'vitest'
import { getAwakeners } from './awakeners'

describe('getAwakeners', () => {
  it('returns clean awakeners with canonical names and aliases', () => {
    const awakeners = getAwakeners()

    expect(awakeners.length).toBeGreaterThan(0)
    expect(awakeners[0]).toEqual({
      name: expect.any(String),
      faction: expect.any(String),
      aliases: expect.any(Array),
    })
    expect(awakeners.every((a) => a.name.trim().length > 0)).toBe(true)
    expect(awakeners.every((a) => a.faction.trim().length > 0)).toBe(true)
    expect(awakeners.every((a) => a.aliases.length > 0)).toBe(true)
  })

  it('maps known alternate names to canonical display names', () => {
    const awakeners = getAwakeners()

    expect(awakeners.find((a) => a.name === 'helot: catena')).toBeDefined()
    expect(awakeners.find((a) => a.name === 'doll: inferno')).toBeDefined()
    expect(awakeners.find((a) => a.name === 'ramona: timeworn')).toBeDefined()
    expect(awakeners.find((a) => a.name === 'murphy: fauxborn')).toBeDefined()
  })
})
