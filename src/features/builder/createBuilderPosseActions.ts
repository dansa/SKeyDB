import type {Posse} from '@/domain/posses'

import type {Team, TeamSlot} from './types'

interface PosseTransferRequest {
  posseId: string
  posseName: string
  fromTeamId: string
  toTeamId: string
}

interface BuilderPosseActionsOptions {
  allowDupes: boolean
  effectiveActiveTeamId: string
  teams: Team[]
  pickerPosses: Posse[]
  usedPosseByTeamOrder: Map<string, number>
  quickLineupPosseStep: boolean
  updateActiveTeam: (updater: (team: Team) => Team) => void
  advanceQuickLineupStep: (nextSlots?: TeamSlot[]) => void
  requestPosseTransfer: (request: PosseTransferRequest) => void
  clearPendingDelete: () => void
  clearTransfer: () => void
}

export function createBuilderPosseActions({
  allowDupes,
  effectiveActiveTeamId,
  teams,
  pickerPosses,
  usedPosseByTeamOrder,
  quickLineupPosseStep,
  updateActiveTeam,
  advanceQuickLineupStep,
  requestPosseTransfer,
  clearPendingDelete,
  clearTransfer,
}: BuilderPosseActionsOptions) {
  function handleSetActivePosse(posseId: string | undefined) {
    clearPendingDelete()
    clearTransfer()

    if (!posseId) {
      updateActiveTeam((team) => ({...team, posseId: undefined}))
      clearTransfer()
      if (quickLineupPosseStep) {
        advanceQuickLineupStep()
      }
      return
    }

    const usedByTeamOrder = allowDupes ? undefined : usedPosseByTeamOrder.get(posseId)
    const usedByTeam = usedByTeamOrder === undefined ? undefined : teams[usedByTeamOrder]
    const isUsedByOtherTeam = usedByTeam && usedByTeam.id !== effectiveActiveTeamId
    if (isUsedByOtherTeam) {
      const posse = pickerPosses.find((entry) => entry.id === posseId)
      requestPosseTransfer({
        posseId,
        posseName: posse?.name ?? 'Posse',
        fromTeamId: usedByTeam.id,
        toTeamId: effectiveActiveTeamId,
      })
      return
    }

    updateActiveTeam((team) => ({...team, posseId}))
    clearTransfer()
    if (quickLineupPosseStep) {
      advanceQuickLineupStep()
    }
  }

  return {handleSetActivePosse}
}
