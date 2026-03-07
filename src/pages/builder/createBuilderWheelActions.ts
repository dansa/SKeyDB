import {nextSelectionAfterWheelSwap, shouldSetActiveWheelOnPickerAssign} from './selection-state'
import {assignWheelToSlot, swapWheelAssignments} from './team-state'
import type {ActiveSelection, TeamSlot, WheelUsageLocation} from './types'

interface WheelTransferRequest {
  wheelId: string
  fromTeamId: string
  fromSlotId: string
  fromWheelIndex: number
  toTeamId: string
  targetSlotId: string
  targetWheelIndex: number
}

interface BuilderWheelActionsOptions {
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
  allowDupes: boolean
  onPickerAssignSuccess?: (nextSlots: TeamSlot[]) => void
}

export function createBuilderWheelActions({
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
  allowDupes,
  onPickerAssignSuccess,
}: BuilderWheelActionsOptions) {
  function getFirstEmptyWheelIndex(slotId: string): number | null {
    const slot = teamSlots.find((entry) => entry.slotId === slotId)
    if (!slot?.awakenerName) {
      return null
    }
    const firstEmptyIndex = slot.wheels.findIndex((wheel) => !wheel)
    return firstEmptyIndex === -1 ? null : firstEmptyIndex
  }

  function assignPickerWheelToTarget(
    wheelId: string,
    targetSlotId: string,
    targetWheelIndex?: number,
    options?: {setActiveOnAssign?: boolean},
  ) {
    const setActiveOnAssign = options?.setActiveOnAssign ?? true
    const resolvedWheelIndex = targetWheelIndex ?? getFirstEmptyWheelIndex(targetSlotId)
    if (resolvedWheelIndex === null) {
      return
    }

    const targetSlot = teamSlots.find((entry) => entry.slotId === targetSlotId)
    const wheelOwner = allowDupes ? undefined : usedWheelByTeamOrder.get(wheelId)
    if (
      wheelOwner?.teamId === effectiveActiveTeamId &&
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
        setActiveSelection({kind: 'wheel', slotId: targetSlotId, wheelIndex: resolvedWheelIndex})
      }
      onPickerAssignSuccess?.(result.nextSlots)
      return
    }

    if (wheelOwner && wheelOwner.teamId !== effectiveActiveTeamId && !targetSlot?.isSupport) {
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
      setActiveSelection({kind: 'wheel', slotId: targetSlotId, wheelIndex: resolvedWheelIndex})
    }
    onPickerAssignSuccess?.(result.nextSlots)
  }

  function handleDropPickerWheel(wheelId: string, targetSlotId: string, targetWheelIndex?: number) {
    clearPendingDelete()
    clearTransfer()
    assignPickerWheelToTarget(wheelId, targetSlotId, targetWheelIndex, {setActiveOnAssign: true})
  }

  function handleDropTeamWheel(
    sourceSlotId: string,
    sourceWheelIndex: number,
    targetSlotId: string,
    targetWheelIndex: number,
  ) {
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
      setActiveSelection({kind: 'wheel', slotId: targetSlotId, wheelIndex: targetWheelIndex})
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
  }

  function handleDropTeamWheelToSlot(
    sourceSlotId: string,
    sourceWheelIndex: number,
    targetSlotId: string,
  ) {
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
    setActiveSelection({kind: 'wheel', slotId: targetSlotId, wheelIndex: targetWheelIndex})
  }

  function handlePickerWheelClick(wheelId?: string) {
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
      if (resolvedWheelIndex === null) {
        return
      }
      const result = assignWheelToSlot(teamSlots, targetSlotId, resolvedWheelIndex, null)
      setActiveTeamSlots(result.nextSlots)
      return
    }

    if (resolvedWheelIndex === null) {
      return
    }

    assignPickerWheelToTarget(wheelId, targetSlotId, resolvedWheelIndex, {
      setActiveOnAssign: shouldSetActiveWheelOnPickerAssign(resolvedActiveSelection),
    })
  }

  return {
    handleDropPickerWheel,
    handleDropTeamWheel,
    handleDropTeamWheelToSlot,
    handlePickerWheelClick,
  }
}
