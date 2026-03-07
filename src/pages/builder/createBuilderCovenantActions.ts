import {assignCovenantToSlot, swapCovenantAssignments} from './team-state'
import type {ActiveSelection, TeamSlot} from './types'

interface BuilderCovenantActionsOptions {
  teamSlots: TeamSlot[]
  resolvedActiveSelection: ActiveSelection
  setActiveTeamSlots: (nextSlots: TeamSlot[]) => void
  setActiveSelection: (nextSelection: ActiveSelection) => void
  clearPendingDelete: () => void
  clearTransfer: () => void
  showToast: (message: string) => void
  onPickerAssignSuccess?: (nextSlots: TeamSlot[]) => void
}

export function createBuilderCovenantActions({
  teamSlots,
  resolvedActiveSelection,
  setActiveTeamSlots,
  setActiveSelection,
  clearPendingDelete,
  clearTransfer,
  showToast,
  onPickerAssignSuccess,
}: BuilderCovenantActionsOptions) {
  function moveTeamCovenant(sourceSlotId: string, targetSlotId: string) {
    if (sourceSlotId === targetSlotId) {
      return
    }
    const result = swapCovenantAssignments(teamSlots, sourceSlotId, targetSlotId)
    setActiveTeamSlots(result.nextSlots)
    setActiveSelection({kind: 'covenant', slotId: targetSlotId})
  }

  function assignPickerCovenantToTarget(
    covenantId: string | undefined,
    targetSlotId: string,
    options?: {setActiveOnAssign?: boolean},
  ) {
    const targetSlot = teamSlots.find((slot) => slot.slotId === targetSlotId)
    if (!targetSlot?.awakenerName) {
      return
    }

    const result = assignCovenantToSlot(teamSlots, targetSlotId, covenantId)
    setActiveTeamSlots(result.nextSlots)
    if (options?.setActiveOnAssign ?? true) {
      setActiveSelection({kind: 'covenant', slotId: targetSlotId})
    }
    onPickerAssignSuccess?.(result.nextSlots)
  }

  function handleDropPickerCovenant(covenantId: string, targetSlotId: string) {
    clearPendingDelete()
    clearTransfer()
    assignPickerCovenantToTarget(covenantId, targetSlotId, {setActiveOnAssign: true})
  }

  function handleDropTeamCovenant(sourceSlotId: string, targetSlotId: string) {
    moveTeamCovenant(sourceSlotId, targetSlotId)
  }

  function handleDropTeamCovenantToSlot(sourceSlotId: string, targetSlotId: string) {
    moveTeamCovenant(sourceSlotId, targetSlotId)
  }

  function handlePickerCovenantClick(covenantId?: string) {
    clearPendingDelete()
    clearTransfer()
    if (
      resolvedActiveSelection?.kind !== 'covenant' &&
      resolvedActiveSelection?.kind !== 'awakener'
    ) {
      showToast('Select a covenant slot on a unit card first.')
      return
    }

    const targetSlotId = resolvedActiveSelection.slotId
    assignPickerCovenantToTarget(covenantId, targetSlotId, {
      setActiveOnAssign: resolvedActiveSelection.kind === 'covenant',
    })
  }

  return {
    handleDropPickerCovenant,
    handleDropTeamCovenant,
    handleDropTeamCovenantToSlot,
    handlePickerCovenantClick,
  }
}
