import { createRef } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getAwakenerIdentityKey } from '../../domain/awakener-identity'
import { useBuilderViewModel } from './useBuilderViewModel'

vi.mock('./useGlobalPickerSearchCapture', () => ({
  useGlobalPickerSearchCapture: vi.fn(),
}))

describe('useBuilderViewModel', () => {
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
})
