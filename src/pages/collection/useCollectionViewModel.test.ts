import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { COLLECTION_OWNERSHIP_KEY } from '../../domain/collection-ownership'
import { useCollectionViewModel } from './useCollectionViewModel'

const COLLECTION_AWAKENER_SORT_KEY = 'skeydb.collection.awakenerSort.v1'

describe('useCollectionViewModel', () => {
  beforeEach(() => {
    window.localStorage.removeItem(COLLECTION_OWNERSHIP_KEY)
    window.localStorage.removeItem(COLLECTION_AWAKENER_SORT_KEY)
  })

  afterEach(() => {
    window.localStorage.removeItem(COLLECTION_OWNERSHIP_KEY)
    window.localStorage.removeItem(COLLECTION_AWAKENER_SORT_KEY)
  })

  it('toggles awakener ownership and keeps linked awakeners synced', () => {
    const { result } = renderHook(() => useCollectionViewModel())

    expect(result.current.getAwakenerOwnedLevel('ramona')).toBe(0)
    expect(result.current.getAwakenerOwnedLevel('ramona: timeworn')).toBe(0)

    act(() => {
      result.current.toggleOwned('awakeners', '42')
    })

    expect(result.current.getAwakenerOwnedLevel('ramona')).toBeNull()
    expect(result.current.getAwakenerOwnedLevel('ramona: timeworn')).toBeNull()

    act(() => {
      result.current.increaseLevel('awakeners', '42')
    })

    expect(result.current.getAwakenerOwnedLevel('ramona')).toBe(0)
    expect(result.current.getAwakenerOwnedLevel('ramona: timeworn')).toBe(0)
  })

  it('clamps wheel level to 15 and does not decrease below 0', () => {
    const { result } = renderHook(() => useCollectionViewModel())

    expect(result.current.getWheelOwnedLevel('SR19')).toBe(0)

    for (let index = 0; index < 20; index += 1) {
      act(() => {
        result.current.increaseLevel('wheels', 'SR19')
      })
    }
    expect(result.current.getWheelOwnedLevel('SR19')).toBe(15)

    for (let index = 0; index < 30; index += 1) {
      act(() => {
        result.current.decreaseLevel('wheels', 'SR19')
      })
    }
    expect(result.current.getWheelOwnedLevel('SR19')).toBe(0)
  })

  it('restores previous wheel level after toggling unowned then owned again', () => {
    const { result } = renderHook(() => useCollectionViewModel())

    act(() => {
      result.current.increaseLevel('wheels', 'SR19')
      result.current.increaseLevel('wheels', 'SR19')
      result.current.increaseLevel('wheels', 'SR19')
    })
    expect(result.current.getWheelOwnedLevel('SR19')).toBe(3)

    act(() => {
      result.current.toggleOwned('wheels', 'SR19')
    })
    expect(result.current.getWheelOwnedLevel('SR19')).toBeNull()

    act(() => {
      result.current.toggleOwned('wheels', 'SR19')
    })
    expect(result.current.getWheelOwnedLevel('SR19')).toBe(3)
  })

  it('appends and clears search query on active tab', () => {
    const { result } = renderHook(() => useCollectionViewModel())

    act(() => {
      result.current.appendSearchCharacter('r')
      result.current.appendSearchCharacter('a')
    })
    expect(result.current.activeQuery).toBe('ra')

    act(() => {
      result.current.clearActiveQuery()
    })
    expect(result.current.activeQuery).toBe('')
  })

  it('tracks editable awakener level with 1-90 clamp and default 60', () => {
    const { result } = renderHook(() => useCollectionViewModel())

    expect(result.current.getAwakenerLevel('ramona')).toBe(60)
    expect(result.current.getAwakenerLevel('ramona: timeworn')).toBe(60)

    act(() => {
      result.current.setAwakenerLevel('ramona', 78)
    })
    expect(result.current.getAwakenerLevel('ramona')).toBe(78)
    expect(result.current.getAwakenerLevel('ramona: timeworn')).toBe(78)

    act(() => {
      result.current.setAwakenerLevel('ramona', 0)
    })
    expect(result.current.getAwakenerLevel('ramona')).toBe(1)
    expect(result.current.getAwakenerLevel('ramona: timeworn')).toBe(1)

    act(() => {
      result.current.setAwakenerLevel('ramona', 999)
    })
    expect(result.current.getAwakenerLevel('ramona')).toBe(90)
    expect(result.current.getAwakenerLevel('ramona: timeworn')).toBe(90)
  })

  it('applies awakener level +/-10 preset once per linked awakener group', () => {
    const { result } = renderHook(() => useCollectionViewModel())

    act(() => {
      result.current.setAwakenerLevel('ramona', 60)
      result.current.setFilteredAwakenerLevelsPreset('+10')
    })
    expect(result.current.getAwakenerLevel('ramona')).toBe(70)
    expect(result.current.getAwakenerLevel('ramona: timeworn')).toBe(70)

    act(() => {
      result.current.setFilteredAwakenerLevelsPreset('-10')
    })
    expect(result.current.getAwakenerLevel('ramona')).toBe(60)
    expect(result.current.getAwakenerLevel('ramona: timeworn')).toBe(60)
  })

  it('defaults awakener sort to level descending with faction grouping off', () => {
    const { result } = renderHook(() => useCollectionViewModel())

    expect(result.current.awakenerSortKey).toBe('LEVEL')
    expect(result.current.awakenerSortDirection).toBe('DESC')
    expect(result.current.awakenerSortGroupByFaction).toBe(false)
  })

  it('persists awakener sort preferences across hook remounts', () => {
    const first = renderHook(() => useCollectionViewModel())

    act(() => {
      first.result.current.setAwakenerSortKey('ALPHABETICAL')
      first.result.current.toggleAwakenerSortDirection()
      first.result.current.setAwakenerSortGroupByFaction(true)
    })

    first.unmount()

    const second = renderHook(() => useCollectionViewModel())
    expect(second.result.current.awakenerSortKey).toBe('ALPHABETICAL')
    expect(second.result.current.awakenerSortDirection).toBe('ASC')
    expect(second.result.current.awakenerSortGroupByFaction).toBe(true)
  })

  it('marks awakener sort pending after level changes and clears after apply', () => {
    const { result } = renderHook(() => useCollectionViewModel())

    expect(result.current.awakenerSortHasPendingChanges).toBe(false)

    act(() => {
      result.current.setAwakenerLevel('ramona', 70)
    })
    expect(result.current.awakenerSortHasPendingChanges).toBe(true)

    act(() => {
      result.current.applyAwakenerSortChanges()
    })
    expect(result.current.awakenerSortHasPendingChanges).toBe(false)
  })

  it('marks wheel sort pending after level changes and clears after apply', () => {
    const { result } = renderHook(() => useCollectionViewModel())

    expect(result.current.wheelSortHasPendingChanges).toBe(false)

    act(() => {
      result.current.increaseLevel('wheels', 'SR19')
    })
    expect(result.current.wheelSortHasPendingChanges).toBe(true)

    act(() => {
      result.current.applyWheelSortChanges()
    })
    expect(result.current.wheelSortHasPendingChanges).toBe(false)
  })
})
