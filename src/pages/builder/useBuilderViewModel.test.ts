import { createRef } from 'react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAwakenerIdentityKey } from '../../domain/awakener-identity'
import { COLLECTION_OWNERSHIP_KEY, saveCollectionOwnership } from '../../domain/collection-ownership'
import { BUILDER_PERSISTENCE_KEY, clearBuilderDraft, saveBuilderDraft } from './builder-persistence'
import { useBuilderViewModel } from './useBuilderViewModel'

vi.mock('./useGlobalPickerSearchCapture', () => ({
  useGlobalPickerSearchCapture: vi.fn(),
}))

describe('useBuilderViewModel', () => {
  beforeEach(() => {
    window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
    window.localStorage.removeItem(COLLECTION_OWNERSHIP_KEY)
  })

  afterEach(() => {
    window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
    window.localStorage.removeItem(COLLECTION_OWNERSHIP_KEY)
  })

  it('initializes with a valid active team and slots', () => {
    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    expect(result.current.teams.length).toBeGreaterThan(0)
    expect(result.current.effectiveActiveTeamId).toBe(result.current.teams[0]?.id)
    expect(result.current.teamSlots).toHaveLength(4)
    expect(result.current.pickerTab).toBe('awakeners')
  })

  it('toggles card selection and syncs picker tab to awakeners', () => {
    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = result.current.teamSlots[0]?.slotId
    expect(targetSlot).toBeDefined()

    act(() => {
      result.current.setPickerTab('posses')
      result.current.handleCardClick(targetSlot!)
    })

    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({ kind: 'awakener', slotId: targetSlot })

    act(() => {
      result.current.handleCardClick(targetSlot!)
    })
    expect(result.current.activeSelection).toBeNull()
  })

  it('sets wheel selection and syncs picker tab to wheels', () => {
    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = result.current.teamSlots[0]?.slotId
    expect(targetSlot).toBeDefined()

    act(() => {
      result.current.handleWheelSlotClick(targetSlot!, 0)
    })

    expect(result.current.pickerTab).toBe('wheels')
    expect(result.current.activeSelection).toEqual({ kind: 'wheel', slotId: targetSlot, wheelIndex: 0 })
  })

  it('sets second wheel slot selection and keeps picker tab on wheels', () => {
    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = result.current.teamSlots[0]?.slotId
    expect(targetSlot).toBeDefined()

    act(() => {
      result.current.handleWheelSlotClick(targetSlot!, 1)
    })

    expect(result.current.pickerTab).toBe('wheels')
    expect(result.current.activeSelection).toEqual({ kind: 'wheel', slotId: targetSlot, wheelIndex: 1 })
  })

  it('removes an active awakener selection from a slot', () => {
    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = result.current.teamSlots[0]?.slotId
    expect(targetSlot).toBeDefined()

    act(() => {
      result.current.setActiveTeamSlots([
        ...result.current.teamSlots.map((slot, index) =>
          index === 0
            ? { ...slot, awakenerName: 'Goliath', faction: 'AEQUOR', wheels: [null, null] as [string | null, string | null] }
            : slot,
        ),
      ])
    })

    act(() => {
      result.current.setActiveSelection({ kind: 'awakener', slotId: targetSlot! })
    })

    act(() => {
      result.current.handleRemoveActiveSelection(targetSlot!)
    })

    expect(result.current.teamSlots[0]?.awakenerName).toBeUndefined()
    expect(result.current.activeSelection).toBeNull()
  })

  it('tracks used awakeners by identity key across teams', () => {
    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      const [firstTeam, ...rest] = result.current.teams
      result.current.setTeams([
        {
          ...firstTeam,
          slots: firstTeam.slots.map((slot, index) =>
            index === 0 ? { ...slot, awakenerName: 'Ramona', faction: 'CHAOS' } : slot,
          ),
        },
        ...rest,
      ])
    })

    expect(result.current.usedAwakenerIdentityKeys.has(getAwakenerIdentityKey('Ramona'))).toBe(true)
    expect(result.current.usedAwakenerIdentityKeys.has(getAwakenerIdentityKey('Ramona: Timeworn'))).toBe(true)
  })

  it('filters wheels by rarity and searches wheel metadata fields', () => {
    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.setWheelRarityFilter('R')
    })
    expect(result.current.filteredWheels.length).toBeGreaterThan(0)
    expect(result.current.filteredWheels.every((wheel) => wheel.rarity === 'R')).toBe(true)

    act(() => {
      result.current.setWheelRarityFilter('ALL')
      result.current.setPickerSearchByTab((prev) => ({ ...prev, wheels: 'ultra' }))
    })
    expect(result.current.filteredWheels.length).toBeGreaterThan(0)
    expect(result.current.filteredWheels.every((wheel) => wheel.faction === 'ULTRA')).toBe(true)

    act(() => {
      result.current.setPickerSearchByTab((prev) => ({ ...prev, wheels: 'b01' }))
    })
    expect(result.current.filteredWheels).toHaveLength(0)

    act(() => {
      result.current.setPickerSearchByTab((prev) => ({ ...prev, wheels: 'ghelot' }))
    })
    expect(result.current.filteredWheels.length).toBeGreaterThan(0)
    expect(result.current.filteredWheels.some((wheel) => wheel.awakener.toLowerCase() === 'helot: catena')).toBe(true)
  })

  it('sorts wheels by rarity, then faction, then id', () => {
    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    const wheels = result.current.filteredWheels
    expect(wheels.length).toBeGreaterThan(0)

    const rarityOrder = { SSR: 0, SR: 1, R: 2 } as const
    const factionOrder = { AEQUOR: 0, CARO: 1, CHAOS: 2, ULTRA: 3, NEUTRAL: 4 } as const

    for (let index = 1; index < wheels.length; index += 1) {
      const prev = wheels[index - 1]
      const next = wheels[index]
      const prevRarity = rarityOrder[prev.rarity]
      const nextRarity = rarityOrder[next.rarity]
      if (prevRarity !== nextRarity) {
        expect(prevRarity).toBeLessThanOrEqual(nextRarity)
        continue
      }

      const prevFaction = factionOrder[prev.faction]
      const nextFaction = factionOrder[next.faction]
      if (prevFaction !== nextFaction) {
        expect(prevFaction).toBeLessThanOrEqual(nextFaction)
        continue
      }

      expect(prev.id.localeCompare(next.id, undefined, { numeric: true, sensitivity: 'base' })).toBeLessThanOrEqual(0)
    }
  })

  it('renames a team via begin/commit flow', () => {
    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const teamId = result.current.teams[0]?.id
    expect(teamId).toBeDefined()

    act(() => {
      result.current.beginTeamRename(teamId!, 'Team 1')
    })

    act(() => {
      result.current.setEditingTeamName(' Arena Squad ')
    })

    act(() => {
      result.current.commitTeamRename(teamId!)
    })

    expect(result.current.teams[0]?.name).toBe('Arena Squad')
    expect(result.current.editingTeamId).toBeNull()
    expect(result.current.editingTeamName).toBe('')
  })

  it('hydrates teams and active team from persisted builder draft', () => {
    const persistedTeams = [
      {
        id: 'team-from-storage',
        name: 'Stored Team',
        slots: [
          { slotId: 'slot-1', awakenerName: 'Goliath', faction: 'AEQUOR', level: 60, wheels: [null, null] as [string | null, string | null] },
          { slotId: 'slot-2', wheels: [null, null] as [string | null, string | null] },
          { slotId: 'slot-3', wheels: [null, null] as [string | null, string | null] },
          { slotId: 'slot-4', wheels: [null, null] as [string | null, string | null] },
        ],
      },
    ]
    saveBuilderDraft(window.localStorage, { teams: persistedTeams, activeTeamId: 'team-from-storage' })

    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    expect(result.current.teams[0]?.id).toBe('team-from-storage')
    expect(result.current.effectiveActiveTeamId).toBe('team-from-storage')
  })

  it('autosaves team draft changes to localStorage', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.setTeams([
        {
          id: 'team-autosave',
          name: 'Autosave Team',
          slots: [
            { slotId: 'slot-1', wheels: [null, null] as [string | null, string | null] },
            { slotId: 'slot-2', wheels: [null, null] as [string | null, string | null] },
            { slotId: 'slot-3', wheels: [null, null] as [string | null, string | null] },
            { slotId: 'slot-4', wheels: [null, null] as [string | null, string | null] },
          ],
        },
      ])
      result.current.setActiveTeamId('team-autosave')
    })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    const storedRaw = window.localStorage.getItem(BUILDER_PERSISTENCE_KEY)
    expect(storedRaw).toBeTruthy()

    const parsed = JSON.parse(storedRaw!)
    expect(parsed.payload.activeTeamId).toBe('team-autosave')
    expect(parsed.payload.teams[0]?.name).toBe('Autosave Team')

    vi.useRealTimers()
    clearBuilderDraft(window.localStorage)
  })

  it('hydrates ownership and keeps linked awakeners synced', () => {
    saveCollectionOwnership(window.localStorage, {
      ownedAwakeners: { '42': 5 },
      ownedWheels: {},
      ownedPosses: {},
      displayUnowned: true,
    })

    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    expect(result.current.ownedAwakenerLevelByName.get('ramona')).toBe(5)
    expect(result.current.ownedAwakenerLevelByName.get('ramona: timeworn')).toBe(5)
  })

  it('hides unowned entries when displayUnowned is false', () => {
    const { result } = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.setDisplayUnowned(false)
    })

    expect(result.current.filteredAwakeners).toHaveLength(0)
    expect(result.current.filteredWheels).toHaveLength(0)
    expect(result.current.filteredPosses).toHaveLength(0)
  })
})
