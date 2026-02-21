import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useTransferConfirm } from './useTransferConfirm'

describe('useTransferConfirm', () => {
  it('stores and clears awakener transfer requests', () => {
    const { result } = renderHook(() => useTransferConfirm())

    act(() => {
      result.current.requestAwakenerTransfer({
        awakenerName: 'goliath',
        fromTeamId: 'team-1',
        toTeamId: 'team-2',
        targetSlotId: 'slot-1',
      })
    })

    expect(result.current.pendingTransfer).toEqual({
      kind: 'awakener',
      itemName: 'goliath',
      awakenerName: 'goliath',
      fromTeamId: 'team-1',
      toTeamId: 'team-2',
      targetSlotId: 'slot-1',
    })

    act(() => {
      result.current.clearTransfer()
    })
    expect(result.current.pendingTransfer).toBeNull()
  })

  it('stores posse transfer requests with shared shape', () => {
    const { result } = renderHook(() => useTransferConfirm())

    act(() => {
      result.current.requestPosseTransfer({
        posseId: 'posse-1',
        posseName: 'Taverns Opening',
        fromTeamId: 'team-1',
        toTeamId: 'team-2',
      })
    })

    expect(result.current.pendingTransfer).toEqual({
      kind: 'posse',
      itemName: 'Taverns Opening',
      fromTeamId: 'team-1',
      toTeamId: 'team-2',
      posseId: 'posse-1',
    })
  })
})
