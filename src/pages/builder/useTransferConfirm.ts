import { useState } from 'react'

export type PendingAwakenerTransfer = {
  kind: 'awakener'
  itemName: string
  awakenerName: string
  fromTeamId: string
  toTeamId: string
  targetSlotId?: string
}

export type PendingPosseTransfer = {
  kind: 'posse'
  itemName: string
  posseId: string
  fromTeamId: string
  toTeamId: string
}

export type PendingWheelTransfer = {
  kind: 'wheel'
  itemName: string
  wheelId: string
  fromTeamId: string
  fromSlotId: string
  fromWheelIndex: number
  toTeamId: string
  targetSlotId: string
  targetWheelIndex: number
}

export type PendingTransfer = PendingAwakenerTransfer | PendingPosseTransfer | PendingWheelTransfer

type RequestAwakenerTransfer = {
  awakenerName: string
  fromTeamId: string
  toTeamId: string
  targetSlotId?: string
}

type RequestPosseTransfer = {
  posseId: string
  posseName: string
  fromTeamId: string
  toTeamId: string
}

type RequestWheelTransfer = {
  wheelId: string
  fromTeamId: string
  fromSlotId: string
  fromWheelIndex: number
  toTeamId: string
  targetSlotId: string
  targetWheelIndex: number
}

export function useTransferConfirm() {
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null)

  function requestAwakenerTransfer({ awakenerName, fromTeamId, toTeamId, targetSlotId }: RequestAwakenerTransfer) {
    setPendingTransfer({
      kind: 'awakener',
      itemName: awakenerName,
      awakenerName,
      fromTeamId,
      toTeamId,
      targetSlotId,
    })
  }

  function requestPosseTransfer({ posseId, posseName, fromTeamId, toTeamId }: RequestPosseTransfer) {
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
