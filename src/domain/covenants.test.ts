import { describe, expect, it } from 'vitest'
import { getCovenants } from './covenants'

describe('getCovenants', () => {
  it('returns parsed covenants with ids and asset ids', () => {
    const covenants = getCovenants()

    expect(covenants.length).toBeGreaterThan(0)
    expect(covenants[0]).toEqual({
      id: '001',
      assetId: 'Icon_Trinket_001',
      name: 'Deus Ex Machina',
    })
  })
})
