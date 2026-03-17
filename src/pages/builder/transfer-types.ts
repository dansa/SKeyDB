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

export interface RequestAwakenerTransfer {
  awakenerName: string
  canUseSupport?: boolean
  fromTeamId: string
  toTeamId: string
  targetSlotId?: string
}

export interface RequestPosseTransfer {
  posseId: string
  posseName: string
  fromTeamId: string
  toTeamId: string
}

export interface RequestWheelTransfer {
  wheelId: string
  fromTeamId: string
  fromSlotId: string
  fromWheelIndex: number
  toTeamId: string
  targetSlotId: string
  targetWheelIndex: number
}
