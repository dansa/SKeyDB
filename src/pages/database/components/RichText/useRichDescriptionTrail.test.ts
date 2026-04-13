import type React from 'react'

import {act, renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import type {AwakenerFull} from '@/domain/awakeners-full'

import {useRichDescriptionTrail} from './useRichDescriptionTrail'

const TEST_FULL_DATA: AwakenerFull = {
  id: 1,
  name: 'alpha',
  stats: {
    CON: '100',
    ATK: '200',
    DEF: '80',
    CritRate: '5%',
    CritDamage: '50%',
    AliemusRegen: '0',
    KeyflareRegen: '0',
    RealmMastery: '0',
    SigilYield: '0%',
    DamageAmplification: '0%',
    DeathResistance: '0%',
    BaseAliemus: '100',
  },
  primaryScalingBase: 20,
  statScaling: {CON: 1, ATK: 1, DEF: 1},
  substatScaling: {},
  cards: {
    C1: {name: 'Strike', cost: '2', description: 'Strike desc'},
    C2: {name: 'Guard', cost: '1', description: 'Guard desc'},
  },
  exalts: {
    exalt: {name: 'Exalt', description: 'Exalt desc'},
    over_exalt: {name: 'Over Exalt', description: 'Over exalt desc'},
  },
  talents: {},
  enlightens: {},
}

function createMouseEvent(rect: Partial<DOMRect> = {}) {
  return {
    currentTarget: {
      getBoundingClientRect: () =>
        ({
          top: 10,
          bottom: 30,
          left: 20,
          right: 40,
          width: 20,
          height: 20,
          x: 20,
          y: 10,
          toJSON: () => ({}),
          ...rect,
        }) as DOMRect,
    },
  } as React.MouseEvent
}

describe('useRichDescriptionTrail', () => {
  it('opens and deduplicates root skill trails', () => {
    const {result} = renderHook(() => useRichDescriptionTrail(TEST_FULL_DATA))

    act(() => {
      result.current.openSkillTrail('Strike', createMouseEvent())
      result.current.openSkillTrail('Strike', createMouseEvent({left: 100}))
    })

    expect(result.current.trail).toHaveLength(1)
    expect(result.current.trailAnchorRect?.left).toBe(100)
    expect(result.current.trailAnchorElement).not.toBeNull()
  })

  it('clears a previous owner trail when another trail opens', () => {
    const first = renderHook(() => useRichDescriptionTrail(TEST_FULL_DATA))
    const second = renderHook(() => useRichDescriptionTrail(TEST_FULL_DATA))

    act(() => {
      first.result.current.openSkillTrail('Strike', createMouseEvent())
    })
    expect(first.result.current.trail).toHaveLength(1)

    act(() => {
      second.result.current.openScalingTrail([10, 20], '%', 'ATK', createMouseEvent())
    })

    expect(first.result.current.trail).toHaveLength(0)
    expect(second.result.current.trail).toHaveLength(1)
  })

  it('trims descendants when opening nested entries from an earlier index and resets anchors when closed', () => {
    const {result} = renderHook(() => useRichDescriptionTrail(TEST_FULL_DATA))

    act(() => {
      result.current.openSkillTrail('Strike', createMouseEvent())
      result.current.openNestedSkillTrail('Guard', 0, createMouseEvent({left: 50}))
      result.current.openNestedScalingTrail([10, 20], '%', 'ATK', 1, createMouseEvent({left: 80}))
    })
    expect(result.current.trail).toHaveLength(3)

    act(() => {
      result.current.openNestedScalingTrail([5, 15], '%', 'CON', 0, createMouseEvent({left: 120}))
    })
    expect(result.current.trail).toHaveLength(2)
    expect(result.current.trail[1]?.key).toContain('scaling:CON')

    act(() => {
      result.current.closeTrailTop()
      result.current.closeTrailTop()
    })

    expect(result.current.trail).toHaveLength(0)
    expect(result.current.trailAnchorRect).toBeNull()
  })
})
