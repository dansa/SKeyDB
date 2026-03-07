import {useState} from 'react'

export interface PendingAwakenerTransfer {
  kind: 'awakener'
  itemName: string
  awakenerName: string
  canUseSupport?: boolean
  fromTeamId: string
  toTeamId: string
  targetSlotId?: string
}

export interface PendingPosseTransfer {
  kind: 'posse'
  itemName: string
  posseId: string
  fromTeamId: string
  toTeamId: string
}

export interface PendingWheelTransfer {
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

interface RequestAwakenerTransfer {
  awakenerName: string
  canUseSupport?: boolean
  fromTeamId: string
  toTeamId: string
  targetSlotId?: string
}

interface RequestPosseTransfer {
  posseId: string
  posseName: string
  fromTeamId: string
  toTeamId: string
}

interface RequestWheelTransfer {
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
