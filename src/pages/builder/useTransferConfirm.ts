import {useState} from 'react'

import type {
  PendingTransfer,
  RequestAwakenerTransfer,
  RequestPosseTransfer,
  RequestWheelTransfer,
} from './transfer-types'

export function useTransferConfirm() {
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null)

  function requestAwakenerTransfer({
    awakenerName,
    canUseSupport,
    fromTeamId,
    toTeamId,
    targetSlotId,
  }: RequestAwakenerTransfer) {
    setPendingTransfer({
      kind: 'awakener',
      itemName: awakenerName,
      awakenerName,
      canUseSupport,
      fromTeamId,
      toTeamId,
      targetSlotId,
    })
  }

  function requestPosseTransfer({posseId, posseName, fromTeamId, toTeamId}: RequestPosseTransfer) {
    setPendingTransfer({
      kind: 'posse',
      itemName: posseName,
      posseId,
      fromTeamId,
      toTeamId,
    })
  }

  function requestWheelTransfer({
    wheelId,
    fromTeamId,
    fromSlotId,
    fromWheelIndex,
    toTeamId,
    targetSlotId,
    targetWheelIndex,
  }: RequestWheelTransfer) {
    setPendingTransfer({
      kind: 'wheel',
      itemName: wheelId,
      wheelId,
      fromTeamId,
      fromSlotId,
      fromWheelIndex,
      toTeamId,
      targetSlotId,
      targetWheelIndex,
    })
  }

  function clearTransfer() {
    setPendingTransfer(null)
  }

  return {
    pendingTransfer,
    requestAwakenerTransfer,
    requestPosseTransfer,
    requestWheelTransfer,
    clearTransfer,
  }
}
