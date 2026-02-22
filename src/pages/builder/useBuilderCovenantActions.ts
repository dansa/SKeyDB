import { useCallback } from 'react'
import { assignCovenantToSlot, swapCovenantAssignments } from './team-state'
import { nextSelectionAfterCovenantRemoved } from './selection-state'
import type { ActiveSelection, TeamSlot } from './types'

type UseBuilderCovenantActionsOptions = {
  teamSlots: TeamSlot[]
  resolvedActiveSelection: ActiveSelection
  setActiveTeamSlots: (nextSlots: TeamSlot[]) => void
  setActiveSelection: (nextSelection: ActiveSelection) => void
  clearPendingDelete: () => void
  clearTransfer: () => void
  showToast: (message: string) => void
}

export function useBuilderCovenantActions({
  teamSlots,
  resolvedActiveSelection,
  setActiveTeamSlots,
  setActiveSelection,
  clearPendingDelete,
  clearTransfer,
  showToast,
}: UseBuilderCovenantActionsOptions) {
  const assignPickerCovenantToTarget = useCallback(
    (covenantId: string | undefined, targetSlotId: string, options?: { setActiveOnAssign?: boolean }) => {
      const targetSlot = teamSlots.find((slot) => slot.slotId === targetSlotId)
      if (!targetSlot?.awakenerName) {
        return
      }

      const result = assignCovenantToSlot(teamSlots, targetSlotId, covenantId)
      setActiveTeamSlots(result.nextSlots)
      if (options?.setActiveOnAssign ?? true) {
        setActiveSelection({ kind: 'covenant', slotId: targetSlotId })
      }
    },
    [setActiveSelection, setActiveTeamSlots, teamSlots],
  )

  const handleDropPickerCovenant = useCallback(
    (covenantId: string, targetSlotId: string) => {
      clearPendingDelete()
      clearTransfer()
      assignPickerCovenantToTarget(covenantId, targetSlotId, { setActiveOnAssign: true })
    },
    [assignPickerCovenantToTarget, clearPendingDelete, clearTransfer],
  )

  const handleDropTeamCovenant = useCallback(
    (sourceSlotId: string, targetSlotId: string) => {
      if (sourceSlotId === targetSlotId) {
        return
      }
      const result = swapCovenantAssignments(teamSlots, sourceSlotId, targetSlotId)
      setActiveTeamSlots(result.nextSlots)
      setActiveSelection({ kind: 'covenant', slotId: targetSlotId })
    },
    [setActiveSelection, setActiveTeamSlots, teamSlots],
  )

  const handleDropTeamCovenantToSlot = useCallback(
    (sourceSlotId: string, targetSlotId: string) => {
      if (sourceSlotId === targetSlotId) {
        return
      }
      const result = swapCovenantAssignments(teamSlots, sourceSlotId, targetSlotId)
      setActiveTeamSlots(result.nextSlots)
      setActiveSelection({ kind: 'covenant', slotId: targetSlotId })
    },
    [setActiveSelection, setActiveTeamSlots, teamSlots],
  )

  const handleDropTeamCovenantToPicker = useCallback(
    (sourceSlotId: string) => {
      const result = assignCovenantToSlot(teamSlots, sourceSlotId, undefined)
      setActiveTeamSlots(result.nextSlots)
      const nextSelection = nextSelectionAfterCovenantRemoved(resolvedActiveSelection, sourceSlotId)
      if (nextSelection !== resolvedActiveSelection) {
        setActiveSelection(nextSelection)
      }
    },
    [resolvedActiveSelection, setActiveSelection, setActiveTeamSlots, teamSlots],
  )

  const handlePickerCovenantClick = useCallback(
    (covenantId?: string) => {
      clearPendingDelete()
      clearTransfer()
      if (resolvedActiveSelection?.kind !== 'covenant' && resolvedActiveSelection?.kind !== 'awakener') {
        showToast('Select a covenant slot on a unit card first.')
        return
      }

      const targetSlotId = resolvedActiveSelection.slotId
      assignPickerCovenantToTarget(covenantId, targetSlotId, {
        setActiveOnAssign: resolvedActiveSelection.kind === 'covenant',
      })
    },
    [assignPickerCovenantToTarget, clearPendingDelete, clearTransfer, resolvedActiveSelection, showToast],
  )

  return {
    handleDropPickerCovenant,
    handleDropTeamCovenant,
    handleDropTeamCovenantToSlot,
    handleDropTeamCovenantToPicker,
    handlePickerCovenantClick,
  }
}
