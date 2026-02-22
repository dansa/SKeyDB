import { useCallback } from 'react'
import { assignWheelToSlot, swapWheelAssignments, type TeamStateUpdateResult } from './team-state'
import {
  nextSelectionAfterWheelRemoved,
  nextSelectionAfterWheelSwap,
  shouldSetActiveWheelOnPickerAssign,
} from './selection-state'
import type { ActiveSelection, TeamSlot, WheelUsageLocation } from './types'

type WheelTransferRequest = {
  wheelId: string
  fromTeamId: string
  fromSlotId: string
  fromWheelIndex: number
  toTeamId: string
  targetSlotId: string
  targetWheelIndex: number
}

type UseBuilderWheelActionsOptions = {
  teamSlots: TeamSlot[]
  effectiveActiveTeamId: string
  usedWheelByTeamOrder: Map<string, WheelUsageLocation>
  resolvedActiveSelection: ActiveSelection
  setActiveTeamSlots: (nextSlots: TeamSlot[]) => void
  setActiveSelection: (nextSelection: ActiveSelection) => void
  requestWheelTransfer: (request: WheelTransferRequest) => void
  clearPendingDelete: () => void
  clearTransfer: () => void
  showToast: (message: string) => void
}

export function useBuilderWheelActions({
  teamSlots,
  effectiveActiveTeamId,
  usedWheelByTeamOrder,
  resolvedActiveSelection,
  setActiveTeamSlots,
  setActiveSelection,
  requestWheelTransfer,
  clearPendingDelete,
  clearTransfer,
  showToast,
}: UseBuilderWheelActionsOptions) {
  const getFirstEmptyWheelIndex = useCallback(
    (slotId: string): number | null => {
      const slot = teamSlots.find((entry) => entry.slotId === slotId)
      if (!slot?.awakenerName) {
        return null
      }
      const firstEmptyIndex = slot.wheels.findIndex((wheel) => !wheel)
      return firstEmptyIndex === -1 ? null : firstEmptyIndex
    },
    [teamSlots],
  )

  const assignPickerWheelToTarget = useCallback(
    (
      wheelId: string,
      targetSlotId: string,
      targetWheelIndex?: number,
      options?: { setActiveOnAssign?: boolean },
    ) => {
      const setActiveOnAssign = options?.setActiveOnAssign ?? true
      const resolvedWheelIndex = targetWheelIndex ?? getFirstEmptyWheelIndex(targetSlotId)
      if (resolvedWheelIndex === null || resolvedWheelIndex === undefined) {
        return
      }

      const wheelOwner = usedWheelByTeamOrder.get(wheelId)
      if (
        wheelOwner &&
        wheelOwner.teamId === effectiveActiveTeamId &&
        (wheelOwner.slotId !== targetSlotId || wheelOwner.wheelIndex !== resolvedWheelIndex)
      ) {
        const result = swapWheelAssignments(
          teamSlots,
          wheelOwner.slotId,
          wheelOwner.wheelIndex,
          targetSlotId,
          resolvedWheelIndex,
        )
        setActiveTeamSlots(result.nextSlots)
        if (setActiveOnAssign) {
          setActiveSelection({ kind: 'wheel', slotId: targetSlotId, wheelIndex: resolvedWheelIndex })
        }
        return
      }

      if (wheelOwner && wheelOwner.teamId !== effectiveActiveTeamId) {
        requestWheelTransfer({
          wheelId,
          fromTeamId: wheelOwner.teamId,
          fromSlotId: wheelOwner.slotId,
          fromWheelIndex: wheelOwner.wheelIndex,
          toTeamId: effectiveActiveTeamId,
          targetSlotId,
          targetWheelIndex: resolvedWheelIndex,
        })
        return
      }

      const result = assignWheelToSlot(teamSlots, targetSlotId, resolvedWheelIndex, wheelId)
      setActiveTeamSlots(result.nextSlots)
      if (setActiveOnAssign) {
        setActiveSelection({ kind: 'wheel', slotId: targetSlotId, wheelIndex: resolvedWheelIndex })
      }
    },
    [
      effectiveActiveTeamId,
      getFirstEmptyWheelIndex,
      requestWheelTransfer,
      setActiveSelection,
      setActiveTeamSlots,
      teamSlots,
      usedWheelByTeamOrder,
    ],
  )

  const handleDropPickerWheel = useCallback(
    (wheelId: string, targetSlotId: string, targetWheelIndex?: number) => {
      clearPendingDelete()
      clearTransfer()
      assignPickerWheelToTarget(wheelId, targetSlotId, targetWheelIndex, { setActiveOnAssign: true })
    },
    [assignPickerWheelToTarget, clearPendingDelete, clearTransfer],
  )

  const handleDropTeamWheel = useCallback(
    (sourceSlotId: string, sourceWheelIndex: number, targetSlotId: string, targetWheelIndex: number) => {
      if (sourceSlotId === targetSlotId && sourceWheelIndex === targetWheelIndex) {
        return
      }
      const result = swapWheelAssignments(
        teamSlots,
        sourceSlotId,
        sourceWheelIndex,
        targetSlotId,
        targetWheelIndex,
      )
      setActiveTeamSlots(result.nextSlots)

      if (sourceSlotId !== targetSlotId) {
        setActiveSelection({ kind: 'wheel', slotId: targetSlotId, wheelIndex: targetWheelIndex })
        return
      }

      const nextSelection = nextSelectionAfterWheelSwap(
        resolvedActiveSelection,
        sourceSlotId,
        sourceWheelIndex,
        targetSlotId,
        targetWheelIndex,
      )
      if (nextSelection !== resolvedActiveSelection) {
        setActiveSelection(nextSelection)
      }
    },
    [resolvedActiveSelection, setActiveSelection, setActiveTeamSlots, teamSlots],
  )

  const handleDropTeamWheelToSlot = useCallback(
    (sourceSlotId: string, sourceWheelIndex: number, targetSlotId: string) => {
      const targetWheelIndex = getFirstEmptyWheelIndex(targetSlotId)
      if (targetWheelIndex === null) {
        return
      }
      const result = swapWheelAssignments(
        teamSlots,
        sourceSlotId,
        sourceWheelIndex,
        targetSlotId,
        targetWheelIndex,
      )
      setActiveTeamSlots(result.nextSlots)
      setActiveSelection({ kind: 'wheel', slotId: targetSlotId, wheelIndex: targetWheelIndex })
    },
    [getFirstEmptyWheelIndex, setActiveSelection, setActiveTeamSlots, teamSlots],
  )

  const handleDropTeamWheelToPicker = useCallback(
    (sourceSlotId: string, sourceWheelIndex: number) => {
      const result: TeamStateUpdateResult = assignWheelToSlot(teamSlots, sourceSlotId, sourceWheelIndex, null)
      setActiveTeamSlots(result.nextSlots)
      const nextSelection = nextSelectionAfterWheelRemoved(resolvedActiveSelection, sourceSlotId, sourceWheelIndex)
      if (nextSelection !== resolvedActiveSelection) {
        setActiveSelection(nextSelection)
      }
    },
    [resolvedActiveSelection, setActiveSelection, setActiveTeamSlots, teamSlots],
  )

  const handlePickerWheelClick = useCallback(
    (wheelId?: string) => {
      clearPendingDelete()
      clearTransfer()
      if (resolvedActiveSelection?.kind !== 'wheel' && resolvedActiveSelection?.kind !== 'awakener') {
        showToast('Select a wheel slot on a unit card first.')
        return
      }

      const targetSlotId = resolvedActiveSelection.slotId
      const targetWheelIndex =
        resolvedActiveSelection.kind === 'wheel' ? resolvedActiveSelection.wheelIndex : undefined
      const resolvedWheelIndex = targetWheelIndex ?? getFirstEmptyWheelIndex(targetSlotId)

      if (!wheelId) {
        if (resolvedWheelIndex === null || resolvedWheelIndex === undefined) {
          return
        }
        const result = assignWheelToSlot(teamSlots, targetSlotId, resolvedWheelIndex, null)
        setActiveTeamSlots(result.nextSlots)
        return
      }

      if (resolvedWheelIndex === null || resolvedWheelIndex === undefined) {
        return
      }

      assignPickerWheelToTarget(wheelId, targetSlotId, resolvedWheelIndex, {
        setActiveOnAssign: shouldSetActiveWheelOnPickerAssign(resolvedActiveSelection),
      })
    },
    [
      assignPickerWheelToTarget,
      clearPendingDelete,
      clearTransfer,
      getFirstEmptyWheelIndex,
      resolvedActiveSelection,
      setActiveTeamSlots,
      showToast,
      teamSlots,
    ],
  )

  return {
    handleDropPickerWheel,
    handleDropTeamWheel,
    handleDropTeamWheelToPicker,
    handleDropTeamWheelToSlot,
    handlePickerWheelClick,
  }
}
