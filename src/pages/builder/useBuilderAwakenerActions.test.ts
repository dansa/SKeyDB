import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBuilderAwakenerActions } from './useBuilderAwakenerActions'
import type { Awakener } from '../../domain/awakeners'
import type { ActiveSelection, TeamSlot } from './types'

const awakenerByName = new Map<string, Awakener>([
  ['Goliath', { id: 1, name: 'Goliath', faction: 'AEQUOR', aliases: ['Goliath'] }],
  ['Ramona', { id: 2, name: 'Ramona', faction: 'CHAOS', aliases: ['Ramona'] }],
])

function buildSlots(): TeamSlot[] {
  return [
    { slotId: 'slot-1', awakenerName: 'Goliath', faction: 'AEQUOR', level: 60, wheels: [null, null] },
    { slotId: 'slot-2', wheels: [null, null] },
  ]
}

function createHook(options?: {
  teamSlots?: TeamSlot[]
  resolvedActiveSelection?: ActiveSelection
  usedAwakenerByIdentityKey?: Map<string, string>
}) {
  const setActiveTeamSlots = vi.fn()
  const setActiveSelection = vi.fn()
  const requestAwakenerTransfer = vi.fn()
  const clearPendingDelete = vi.fn()
  const clearTransfer = vi.fn()
  const notifyViolation = vi.fn()

  const { result } = renderHook(() =>
    useBuilderAwakenerActions({
      teamSlots: options?.teamSlots ?? buildSlots(),
      awakenerByName,
      effectiveActiveTeamId: 'team-1',
      usedAwakenerByIdentityKey: options?.usedAwakenerByIdentityKey ?? new Map(),
      resolvedActiveSelection: options?.resolvedActiveSelection ?? null,
      setActiveTeamSlots,
      setActiveSelection,
      requestAwakenerTransfer,
      clearPendingDelete,
      clearTransfer,
      notifyViolation,
    }),
  )

  return {
    actions: result.current,
    setActiveTeamSlots,
    setActiveSelection,
    requestAwakenerTransfer,
    clearPendingDelete,
    clearTransfer,
    notifyViolation,
  }
}

describe('useBuilderAwakenerActions', () => {
  it('handles drop assignment and activates dropped slot', () => {
    const { actions, setActiveTeamSlots, setActiveSelection } = createHook({
      teamSlots: [
        { slotId: 'slot-1', wheels: [null, null] },
        { slotId: 'slot-2', wheels: [null, null] },
      ],
    })

    actions.handleDropPickerAwakener('Goliath', 'slot-2')

    expect(setActiveTeamSlots).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ slotId: 'slot-1' }),
        expect.objectContaining({ slotId: 'slot-2', awakenerName: 'Goliath' }),
      ]),
    )
    expect(setActiveSelection).toHaveBeenCalledWith({ kind: 'awakener', slotId: 'slot-2' })
  })

  it('requests transfer for owning team instead of applying state update', () => {
    const { actions, requestAwakenerTransfer, setActiveTeamSlots } = createHook({
      usedAwakenerByIdentityKey: new Map([['ramona', 'team-2']]),
    })

    actions.handleDropPickerAwakener('Ramona', 'slot-2')

    expect(setActiveTeamSlots).not.toHaveBeenCalled()
    expect(requestAwakenerTransfer).toHaveBeenCalledWith({
      awakenerName: 'Ramona',
      fromTeamId: 'team-2',
      toTeamId: 'team-1',
      targetSlotId: 'slot-2',
    })
  })

  it('click assignment respects active awakener target slot', () => {
    const { actions, setActiveTeamSlots } = createHook({
      teamSlots: [
        { slotId: 'slot-1', awakenerName: 'Goliath', faction: 'AEQUOR', level: 60, wheels: [null, null] },
        { slotId: 'slot-2', wheels: [null, null] },
      ],
      resolvedActiveSelection: { kind: 'awakener', slotId: 'slot-2' },
    })

    actions.handlePickerAwakenerClick('Ramona')

    expect(setActiveTeamSlots).toHaveBeenCalledWith([
      expect.objectContaining({ slotId: 'slot-1', awakenerName: 'Goliath' }),
      expect.objectContaining({ slotId: 'slot-2', awakenerName: 'Ramona' }),
    ])
  })
})
