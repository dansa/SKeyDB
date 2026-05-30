import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createEmptyCollectionOwnershipState} from '@/domain/collection-ownership'
import {
  COLLECTION_OWNERSHIP_KEY,
  COLLECTION_OWNERSHIP_LEGACY_KEY,
} from '@/features/collection/collectionMigrations'
import {collectionOwnershipStore} from '@/stores/collectionOwnershipStore'

import {createInitialRememberedLevels, useCollectionViewModel} from './useCollectionViewModel'

const COLLECTION_AWAKENER_SORT_KEY = 'skeydb.collection.awakenerSort.v1'

describe('useCollectionViewModel', () => {
  beforeEach(() => {
    window.localStorage.removeItem(COLLECTION_OWNERSHIP_KEY)
    window.localStorage.removeItem(COLLECTION_OWNERSHIP_LEGACY_KEY)
    window.localStorage.removeItem(COLLECTION_AWAKENER_SORT_KEY)
    collectionOwnershipStore.getState().replaceOwnership(createEmptyCollectionOwnershipState())
  })

  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.removeItem(COLLECTION_OWNERSHIP_KEY)
    window.localStorage.removeItem(COLLECTION_OWNERSHIP_LEGACY_KEY)
    window.localStorage.removeItem(COLLECTION_AWAKENER_SORT_KEY)
  })

  it('toggles awakener ownership and keeps linked awakeners synced', () => {
    const {result} = renderHook(() => useCollectionViewModel())

    expect(result.current.getAwakenerOwnedLevel('ramona')).toBe(0)
    expect(result.current.getAwakenerOwnedLevel('ramona: timeworn')).toBe(0)

    act(() => {
      result.current.toggleOwned('awakeners', 'awakener-0042')
    })

    expect(result.current.getAwakenerOwnedLevel('ramona')).toBeNull()
    expect(result.current.getAwakenerOwnedLevel('ramona: timeworn')).toBeNull()

    act(() => {
      result.current.increaseLevel('awakeners', 'awakener-0042')
    })

    expect(result.current.getAwakenerOwnedLevel('ramona')).toBe(0)
    expect(result.current.getAwakenerOwnedLevel('ramona: timeworn')).toBe(0)
  })

  it('clamps wheel level to 15 and does not decrease below 0', () => {
    const {result} = renderHook(() => useCollectionViewModel())

    expect(result.current.getWheelOwnedLevel('wheel-0095')).toBe(0)

    for (let index = 0; index < 20; index += 1) {
      act(() => {
        result.current.increaseLevel('wheels', 'wheel-0095')
      })
    }
    expect(result.current.getWheelOwnedLevel('wheel-0095')).toBe(15)

    for (let index = 0; index < 30; index += 1) {
      act(() => {
        result.current.decreaseLevel('wheels', 'wheel-0095')
      })
    }
    expect(result.current.getWheelOwnedLevel('wheel-0095')).toBe(0)
  })

  it('restores previous wheel level after toggling unowned then owned again', () => {
    const {result} = renderHook(() => useCollectionViewModel())

    act(() => {
      result.current.increaseLevel('wheels', 'wheel-0095')
      result.current.increaseLevel('wheels', 'wheel-0095')
      result.current.increaseLevel('wheels', 'wheel-0095')
    })
    expect(result.current.getWheelOwnedLevel('wheel-0095')).toBe(3)

    act(() => {
      result.current.toggleOwned('wheels', 'wheel-0095')
    })
    expect(result.current.getWheelOwnedLevel('wheel-0095')).toBeNull()

    act(() => {
      result.current.toggleOwned('wheels', 'wheel-0095')
    })
    expect(result.current.getWheelOwnedLevel('wheel-0095')).toBe(3)
  })

  it('creates independent remembered-level containers per hook instance', () => {
    const first = createInitialRememberedLevels()
    const second = createInitialRememberedLevels()

    first.wheels['wheel-0095'] = 7

    expect(second.wheels['wheel-0095']).toBeUndefined()
  })

  it('appends and clears search query on active tab', () => {
    const {result} = renderHook(() => useCollectionViewModel())

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
    const {result} = renderHook(() => useCollectionViewModel())

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
    const {result} = renderHook(() => useCollectionViewModel())

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
    const {result} = renderHook(() => useCollectionViewModel())

    expect(result.current.awakenerSortKey).toBe('LEVEL')
    expect(result.current.awakenerSortDirection).toBe('DESC')
    expect(result.current.awakenerSortGroupByRealm).toBe(false)
  })

  it('persists awakener sort preferences across hook remounts', () => {
    const first = renderHook(() => useCollectionViewModel())

    act(() => {
      first.result.current.setAwakenerSortKey('ALPHABETICAL')
      first.result.current.toggleAwakenerSortDirection()
      first.result.current.setAwakenerSortGroupByRealm(true)
    })

    first.unmount()

    const second = renderHook(() => useCollectionViewModel())
    expect(second.result.current.awakenerSortKey).toBe('ALPHABETICAL')
    expect(second.result.current.awakenerSortDirection).toBe('ASC')
    expect(second.result.current.awakenerSortGroupByRealm).toBe(true)
  })

  it('loads legacy v1 ownership snapshots and saves the current storage key', () => {
    window.localStorage.setItem(
      COLLECTION_OWNERSHIP_LEGACY_KEY,
      JSON.stringify({
        version: 1,
        payload: {
          ownedAwakeners: {42: 4},
          awakenerLevels: {42: 71},
          ownedWheels: {SR19: 3},
          ownedPosses: {},
          displayUnowned: true,
        },
      }),
    )

    const {result} = renderHook(() => useCollectionViewModel())

    expect(result.current.getAwakenerOwnedLevel('ramona')).toBe(4)
    expect(result.current.getAwakenerLevel('ramona')).toBe(71)
    expect(result.current.getWheelOwnedLevel('wheel-0095')).toBe(3)
    expect(window.localStorage.getItem(COLLECTION_OWNERSHIP_LEGACY_KEY)).toBeTruthy()
    expect(window.localStorage.getItem(COLLECTION_OWNERSHIP_KEY)).toContain('"version":2')
  })

  it('does not fall back to v1 or autosave over an invalid existing current snapshot on mount', () => {
    vi.useFakeTimers()
    window.localStorage.setItem(COLLECTION_OWNERSHIP_KEY, '{"version":999,"payload":{}}')
    window.localStorage.setItem(
      COLLECTION_OWNERSHIP_LEGACY_KEY,
      JSON.stringify({
        version: 1,
        payload: {
          ownedAwakeners: {42: 5},
          awakenerLevels: {42: 79},
          ownedWheels: {SR19: 4},
          ownedPosses: {},
          displayUnowned: true,
        },
      }),
    )

    const {result} = renderHook(() => useCollectionViewModel())

    expect(result.current.getAwakenerOwnedLevel('ramona')).toBe(0)
    expect(result.current.getAwakenerLevel('ramona')).toBe(60)
    expect(result.current.getWheelOwnedLevel('wheel-0095')).toBe(0)

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(window.localStorage.getItem(COLLECTION_OWNERSHIP_KEY)).toBe(
      '{"version":999,"payload":{}}',
    )
    vi.useRealTimers()
  })

  it('exports current snapshots and imports migrated v1 snapshots', () => {
    const {result} = renderHook(() => useCollectionViewModel())

    const exported = result.current.exportOwnershipSnapshot()
    expect(exported).toContain('"version":2')

    act(() => {
      const parsed = result.current.importOwnershipSnapshot(
        JSON.stringify({
          version: 1,
          payload: {
            ownedAwakeners: {42: 5},
            awakenerLevels: {42: 75},
            ownedWheels: {SR19: 6},
            ownedPosses: {},
            displayUnowned: true,
          },
        }),
      )
      expect(parsed).toEqual(
        expect.objectContaining({
          ok: true,
          migratedFromVersion: 1,
        }),
      )
    })

    expect(result.current.getAwakenerOwnedLevel('ramona')).toBe(5)
    expect(result.current.getAwakenerLevel('ramona')).toBe(75)
    expect(result.current.getWheelOwnedLevel('wheel-0095')).toBe(6)
    expect(window.localStorage.getItem(COLLECTION_OWNERSHIP_KEY)).toContain('"version":2')
    expect(window.localStorage.getItem(COLLECTION_OWNERSHIP_KEY)).toContain('"awakener-0042"')
  })

  it('marks awakener sort pending after level changes and clears after apply', () => {
    const {result} = renderHook(() => useCollectionViewModel())

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

  it('freezes awakener visible order after level changes until apply', () => {
    const {result} = renderHook(() => useCollectionViewModel())
    const initialNames = result.current.filteredAwakeners.map((awakener) => awakener.name)
    const targetName = initialNames[1]

    act(() => {
      result.current.setAwakenerLevel(targetName, 90)
    })

    expect(result.current.awakenerSortHasPendingChanges).toBe(true)
    expect(result.current.filteredAwakeners.map((awakener) => awakener.name)).toEqual(initialNames)

    act(() => {
      result.current.applyAwakenerSortChanges()
    })

    expect(result.current.awakenerSortHasPendingChanges).toBe(false)
    expect(result.current.filteredAwakeners[0]?.name).toBe(targetName)
  })

  it('auto-refreshes awakener visible order when search changes after pending level changes', () => {
    const {result} = renderHook(() => useCollectionViewModel())
    const targetName = result.current.filteredAwakeners[1].name

    act(() => {
      result.current.setAwakenerLevel(targetName, 90)
    })
    expect(result.current.awakenerSortHasPendingChanges).toBe(true)

    act(() => {
      result.current.setQuery(targetName)
    })

    expect(result.current.awakenerSortHasPendingChanges).toBe(false)
    expect(result.current.filteredAwakeners[0]?.name).toBe(targetName)
  })

  it('marks wheel sort pending after level changes and clears after apply', () => {
    const {result} = renderHook(() => useCollectionViewModel())

    expect(result.current.wheelSortHasPendingChanges).toBe(false)

    act(() => {
      result.current.increaseLevel('wheels', 'wheel-0095')
    })
    expect(result.current.wheelSortHasPendingChanges).toBe(true)

    act(() => {
      result.current.applyWheelSortChanges()
    })
    expect(result.current.wheelSortHasPendingChanges).toBe(false)
  })

  it('freezes wheel visible order after level changes until apply', () => {
    const {result} = renderHook(() => useCollectionViewModel())
    const initialIds = result.current.filteredWheels.map((wheel) => wheel.id)
    const targetId = initialIds[1]

    act(() => {
      result.current.increaseLevel('wheels', targetId)
    })

    expect(result.current.wheelSortHasPendingChanges).toBe(true)
    expect(result.current.filteredWheels.map((wheel) => wheel.id)).toEqual(initialIds)

    act(() => {
      result.current.applyWheelSortChanges()
    })

    expect(result.current.wheelSortHasPendingChanges).toBe(false)
    expect(result.current.filteredWheels[0]?.id).toBe(targetId)
  })

  it('auto-refreshes wheel visible order when search changes after pending level changes', () => {
    const {result} = renderHook(() => useCollectionViewModel())
    act(() => {
      result.current.setTab('wheels')
    })
    const targetWheel = result.current.filteredWheels[1]

    act(() => {
      result.current.increaseLevel('wheels', targetWheel.id)
    })
    expect(result.current.wheelSortHasPendingChanges).toBe(true)

    act(() => {
      result.current.setQuery(targetWheel.name)
    })

    expect(result.current.wheelSortHasPendingChanges).toBe(false)
    expect(result.current.filteredWheels[0]?.id).toBe(targetWheel.id)
  })

  it('does not mark wheel sort pending when toggling posse ownership', () => {
    const {result} = renderHook(() => useCollectionViewModel())

    expect(result.current.wheelSortHasPendingChanges).toBe(false)

    act(() => {
      result.current.toggleOwned('posses', 'posse-0001')
    })

    expect(result.current.wheelSortHasPendingChanges).toBe(false)
  })

  it('marks filtered awakeners owned with remembered levels and pending sort', () => {
    const {result} = renderHook(() => useCollectionViewModel())

    act(() => {
      result.current.increaseLevel('awakeners', 'awakener-0042')
      result.current.increaseLevel('awakeners', 'awakener-0042')
      result.current.markFilteredUnowned()
      result.current.applyAwakenerSortChanges()
    })
    expect(result.current.getAwakenerOwnedLevel('ramona')).toBeNull()
    expect(result.current.awakenerSortHasPendingChanges).toBe(false)

    act(() => {
      result.current.markFilteredOwned()
    })

    expect(result.current.getAwakenerOwnedLevel('ramona')).toBe(2)
    expect(result.current.getAwakenerOwnedLevel('ramona: timeworn')).toBe(2)
    expect(result.current.awakenerSortHasPendingChanges).toBe(true)
    expect(result.current.wheelSortHasPendingChanges).toBe(false)
  })

  it('marks filtered wheels owned with remembered levels and pending sort', () => {
    const {result} = renderHook(() => useCollectionViewModel())

    act(() => {
      result.current.setTab('wheels')
    })
    act(() => {
      result.current.increaseLevel('wheels', 'wheel-0095')
      result.current.increaseLevel('wheels', 'wheel-0095')
      result.current.increaseLevel('wheels', 'wheel-0095')
      result.current.markFilteredUnowned()
      result.current.applyWheelSortChanges()
    })
    expect(result.current.getWheelOwnedLevel('wheel-0095')).toBeNull()
    expect(result.current.wheelSortHasPendingChanges).toBe(false)

    act(() => {
      result.current.markFilteredOwned()
    })

    expect(result.current.getWheelOwnedLevel('wheel-0095')).toBe(3)
    expect(result.current.wheelSortHasPendingChanges).toBe(true)
    expect(result.current.awakenerSortHasPendingChanges).toBe(false)
  })

  it('marks filtered posses owned without marking sort pending', () => {
    const {result} = renderHook(() => useCollectionViewModel())

    act(() => {
      result.current.setTab('posses')
    })
    act(() => {
      result.current.markFilteredUnowned()
    })
    expect(result.current.getPosseOwnedLevel('posse-0001')).toBeNull()
    expect(result.current.awakenerSortHasPendingChanges).toBe(false)
    expect(result.current.wheelSortHasPendingChanges).toBe(false)

    act(() => {
      result.current.markFilteredOwned()
    })

    expect(result.current.getPosseOwnedLevel('posse-0001')).toBe(0)
    expect(result.current.awakenerSortHasPendingChanges).toBe(false)
    expect(result.current.wheelSortHasPendingChanges).toBe(false)
  })
})
