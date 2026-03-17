import type {PendingTransfer} from '../../transfer-types'
import type {BuilderSet, TransferSlice} from './types'

export function createTransferSlice(set: BuilderSet): TransferSlice {
  return {
    pendingTransfer: null,

    requestAwakenerTransfer: ({
      awakenerName,
      canUseSupport,
      fromTeamId,
      toTeamId,
      targetSlotId,
    }) => {
      set((state) => {
        state.pendingTransfer = {
          kind: 'awakener',
          itemName: awakenerName,
          awakenerName,
          canUseSupport,
          fromTeamId,
          toTeamId,
          targetSlotId,
        }
      })
    },

    requestPosseTransfer: ({posseId, posseName, fromTeamId, toTeamId}) => {
      set((state) => {
        state.pendingTransfer = {
          kind: 'posse',
          itemName: posseName,
          posseId,
          fromTeamId,
          toTeamId,
        }
      })
    },

    requestWheelTransfer: ({
      wheelId,
      fromTeamId,
      fromSlotId,
      fromWheelIndex,
      toTeamId,
      targetSlotId,
      targetWheelIndex,
    }) => {
      set((state) => {
        state.pendingTransfer = {
          kind: 'wheel',
          itemName: wheelId,
          wheelId,
          fromTeamId,
          fromSlotId,
          fromWheelIndex,
          toTeamId,
          targetSlotId,
          targetWheelIndex,
        }
      })
    },

    clearTransfer: () => {
      set((state) => {
        state.pendingTransfer = null
      })
    },
  }
}

export function applyTransferState(
  state: {pendingTransfer: PendingTransfer | null},
  pendingTransfer: PendingTransfer | null,
): void {
  state.pendingTransfer = pendingTransfer
}
