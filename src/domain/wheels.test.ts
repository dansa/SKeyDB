import { describe, expect, it } from 'vitest'
import { getWheels } from './wheels'

describe('getWheels', () => {
  it('returns parsed wheels with stable ids and full asset ids', () => {
    const wheels = getWheels()

    expect(wheels.length).toBeGreaterThan(0)
    expect(wheels[0]).toEqual({
      id: expect.any(String),
      assetId: expect.any(String),
    })
    expect(wheels.every((wheel) => wheel.id.trim().length > 0)).toBe(true)
    expect(wheels.every((wheel) => wheel.assetId.startsWith('Weapon_Full_'))).toBe(true)
  })

  it('ensures wheel ids are unique', () => {
    const wheels = getWheels()
    const ids = wheels.map((wheel) => wheel.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(ids.length)
  })
})

