import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getWheelById } from '../../domain/wheels'
import { usePendingTransferDialog } from './usePendingTransferDialog'
import type { Team } from './types'

function buildTeams(): Team[] {
  return [
    {
      id: 'team-1',
      name: 'Team 1',
      slots: [
        { slotId: 'slot-1', wheels: [null, null] },
        { slotId: 'slot-2', wheels: [null, null] },
        { slotId: 'slot-3', wheels: [null, null] },
        { slotId: 'slot-4', wheels: [null, null] },
      ],
    },
    {
      id: 'team-2',
      name: 'Team 2',
      slots: [
        { slotId: 'slot-1', wheels: [null, null] },
        { slotId: 'slot-2', wheels: [null, null] },
        { slotId: 'slot-3', wheels: [null, null] },
        { slotId: 'slot-4', wheels: [null, null] },
      ],
    },
  ]
}

describe('usePendingTransferDialog', () => {
  it('resolves wheel display name from wheelId instead of itemName', () => {
    const wheelId = 'SR19'
    const wheelName = getWheelById(wheelId)?.name
    expect(wheelName).toBeTruthy()

    const { result } = renderHook(() =>
      usePendingTransferDialog({
        pendingTransfer: {
          kind: 'wheel',
          itemName: 'WHEEL_PLACEHOLDER',
          wheelId,
          fromTeamId: 'team-1',
          fromSlotId: 'slot-1',
          fromWheelIndex: 0,
          toTeamId: 'team-2',
          targetSlotId: 'slot-1',
          targetWheelIndex: 0,
        },
        teams: buildTeams(),
        setTeams: vi.fn(),
        clearTransfer: vi.fn(),
      }),
    )

    expect(result.current).not.toBeNull()
    expect(result.current?.title).toBe(`Move ${wheelName}`)
    expect(result.current?.message).toContain(`${wheelName} is already used in Team 1.`)
  })
})

