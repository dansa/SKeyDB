import { describe, expect, it } from 'vitest'
import { getMainstatByKey } from './mainstats'
import { getWheelMainstatLabel, getWheels } from './wheels'

describe('getWheels', () => {
  it('returns parsed wheels with stable ids and full asset ids', () => {
    const wheels = getWheels()

    expect(wheels.length).toBeGreaterThan(0)
    expect(wheels[0]).toEqual({
      id: expect.any(String),
      assetId: expect.any(String),
      name: expect.any(String),
      rarity: expect.stringMatching(/^(SSR|SR|R)$/),
      faction: expect.stringMatching(/^(AEQUOR|CARO|CHAOS|ULTRA|NEUTRAL)$/),
      awakener: expect.any(String),
      mainstatKey: expect.any(String),
    })
    expect(wheels.every((wheel) => wheel.id.trim().length > 0)).toBe(true)
    expect(wheels.every((wheel) => wheel.assetId.startsWith('Weapon_Full_'))).toBe(true)
    expect(wheels.every((wheel) => wheel.name.trim().length > 0)).toBe(true)
    expect(wheels.every((wheel) => typeof wheel.awakener === 'string')).toBe(true)
    expect(wheels.every((wheel) => typeof wheel.mainstatKey === 'string')).toBe(true)
  })

  it('ensures wheel ids are unique', () => {
    const wheels = getWheels()
    const ids = wheels.map((wheel) => wheel.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(ids.length)
  })

  it('applies wheel metadata overrides and defaults', () => {
    const wheels = getWheels()

    const d12 = wheels.find((wheel) => wheel.id === 'D12')
    const sr01 = wheels.find((wheel) => wheel.id === 'SR01')
    const p01 = wheels.find((wheel) => wheel.id === 'P01')
    const jp01 = wheels.find((wheel) => wheel.id === 'JP01')

    expect(d12?.faction).toBe('CHAOS')
    expect(sr01?.rarity).toBe('SR')
    expect(sr01?.faction).toBe('NEUTRAL')
    expect(p01?.rarity).toBe('R')
    expect(p01?.faction).toBe('NEUTRAL')
    expect(jp01?.rarity).toBe('SSR')
    expect(jp01?.faction).toBe('NEUTRAL')
  })

  it('keeps wheel mainstats linked to canonical mainstat keys', () => {
    const wheels = getWheels()
    expect(wheels.length).toBeGreaterThan(0)

    wheels.forEach((wheel) => {
      expect(wheel.mainstatKey.trim().length).toBeGreaterThan(0)
      expect(getMainstatByKey(wheel.mainstatKey)).toBeDefined()
      expect(getWheelMainstatLabel(wheel)).toBe(getMainstatByKey(wheel.mainstatKey)?.label ?? '')
    })
  })
})

