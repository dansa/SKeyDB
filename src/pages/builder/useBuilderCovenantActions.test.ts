import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBuilderCovenantActions } from './useBuilderCovenantActions'
import type { ActiveSelection, TeamSlot } from './types'

function buildSlots(): TeamSlot[] {
  return [
    {
      slotId: 'slot-1',
      awakenerName: 'goliath',
      faction: 'AEQUOR',
      level: 60,
      wheels: [null, null],
      covenantId: '001',
    },
    {
      slotId: 'slot-2',
      awakenerName: 'miryam',
      faction: 'CHAOS',
      level: 60,
      wheels: [null, null],
    },
  ]
}

function createHook(options?: {
  teamSlots?: TeamSlot[]
  resolvedActiveSelection?: ActiveSelection
}) {
  const setActiveTeamSlots = vi.fn()
  const setActiveSelection = vi.fn()
  const clearPendingDelete = vi.fn()
  const clearTransfer = vi.fn()
  const showToast = vi.fn()

  const { result } = renderHook(() =>
    useBuilderCovenantActions({
      teamSlots: options?.teamSlots ?? buildSlots(),
      resolvedActiveSelection: options?.resolvedActiveSelection ?? null,
      setActiveTeamSlots,
      setActiveSelection,
      clearPendingDelete,
      clearTransfer,
      showToast,
    }),
  )

  return {
    actions: result.current,
    setActiveTeamSlots,
    setActiveSelection,
    clearPendingDelete,
    clearTransfer,
    showToast,
  }
}

describe('useBuilderCovenantActions', () => {
  it('assigns picker covenant to target slot and activates covenant selection on drop', () => {
    const { actions, setActiveSelection, setActiveTeamSlots } = createHook()

    actions.handleDropPickerCovenant('002', 'slot-2')

    expect(setActiveTeamSlots).toHaveBeenCalledWith([
      expect.objectContaining({ slotId: 'slot-1', covenantId: '001' }),
      expect.objectContaining({ slotId: 'slot-2', covenantId: '002' }),
    ])
    expect(setActiveSelection).toHaveBeenCalledWith({ kind: 'covenant', slotId: 'slot-2' })
  })

  it('swaps team covenant assignments between slots', () => {
    const { actions, setActiveSelection, setActiveTeamSlots } = createHook({
      teamSlots: [
        {
          slotId: 'slot-1',
          awakenerName: 'goliath',
          faction: 'AEQUOR',
          level: 60,
          wheels: [null, null],
          covenantId: '001',
        },
        {
          slotId: 'slot-2',
          awakenerName: 'miryam',
          faction: 'CHAOS',
          level: 60,
          wheels: [null, null],
          covenantId: '002',
        },
      ],
    })

    actions.handleDropTeamCovenant('slot-1', 'slot-2')

    expect(setActiveTeamSlots).toHaveBeenCalledWith([
      expect.objectContaining({ slotId: 'slot-1', covenantId: '002' }),
      expect.objectContaining({ slotId: 'slot-2', covenantId: '001' }),
    ])
    expect(setActiveSelection).toHaveBeenCalledWith({ kind: 'covenant', slotId: 'slot-2' })
  })

  it('clears covenant when dropping team covenant to picker and clears matching active selection', () => {
    const { actions, setActiveSelection, setActiveTeamSlots } = createHook({
      resolvedActiveSelection: { kind: 'covenant', slotId: 'slot-1' },
    })

    actions.handleDropTeamCovenantToPicker('slot-1')

    expect(setActiveTeamSlots).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ slotId: 'slot-1', covenantId: undefined }),
        expect.objectContaining({ slotId: 'slot-2' }),
      ]),
    )
    expect(setActiveSelection).toHaveBeenCalledWith(null)
  })

  it('shows guidance toast when picker covenant is clicked without active card/covenant selection', () => {
    const { actions, showToast, setActiveTeamSlots } = createHook({
      resolvedActiveSelection: null,
    })

    actions.handlePickerCovenantClick('002')

    expect(showToast).toHaveBeenCalledWith('Select a covenant slot on a unit card first.')
    expect(setActiveTeamSlots).not.toHaveBeenCalled()
  })

  it('assigns covenant from picker when awakener card is active and keeps selection unchanged', () => {
    const { actions, setActiveSelection, setActiveTeamSlots } = createHook({
      resolvedActiveSelection: { kind: 'awakener', slotId: 'slot-2' },
    })

    actions.handlePickerCovenantClick('002')

    expect(setActiveTeamSlots).toHaveBeenCalledWith([
      expect.objectContaining({ slotId: 'slot-1', covenantId: '001' }),
      expect.objectContaining({ slotId: 'slot-2', covenantId: '002' }),
    ])
    expect(setActiveSelection).not.toHaveBeenCalled()
  })
})
