import { describe, expect, it } from 'vitest'
import { getPosses } from './posses'

describe('getPosses', () => {
  it('returns posses with stable numeric indexes', () => {
    const posses = getPosses()

    expect(posses.length).toBeGreaterThan(0)
    expect(posses[0]).toMatchObject({
      id: expect.any(String),
      index: expect.any(Number),
      name: expect.any(String),
      faction: expect.any(String),
      isFadedLegacy: expect.any(Boolean),
    })
    expect(posses.every((posse) => Number.isInteger(posse.index) && posse.index >= 0)).toBe(true)
  })

  it('ensures posse indexes are unique', () => {
    const posses = getPosses()
    const indices = posses.map((posse) => posse.index)
    const uniqueIndices = new Set(indices)

    expect(uniqueIndices.size).toBe(indices.length)
  })
})
