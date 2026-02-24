import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useOwnedAwakenerBoxEntries } from './useOwnedAwakenerBoxEntries'

vi.mock('../../domain/awakeners', () => ({
  getAwakeners: () => [{ id: 1, name: 'ramona', faction: 'CHAOS', aliases: [] }],
}))

vi.mock('../../domain/awakener-assets', () => ({
  getAwakenerCardAsset: () => null,
}))

describe('useOwnedAwakenerBoxEntries', () => {
  it('falls back to level 60 when getAwakenerLevel is omitted', () => {
    const { result } = renderHook(() =>
      useOwnedAwakenerBoxEntries((awakenerName) => (awakenerName === 'ramona' ? 4 : null)),
    )

    expect(result.current).toEqual([
      {
        name: 'ramona',
        displayName: 'Ramona',
        level: 4,
        awakenerLevel: 60,
        cardAsset: null,
      },
    ])
  })

  it('uses provided awakeners levels when getAwakenerLevel is passed', () => {
    const { result } = renderHook(() =>
      useOwnedAwakenerBoxEntries(
        (awakenerName) => (awakenerName === 'ramona' ? 4 : null),
        () => 77,
      ),
    )

    expect(result.current[0]?.awakenerLevel).toBe(77)
  })
})
