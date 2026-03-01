import { useCallback } from 'react'
import type { Awakener } from '../../domain/awakeners'
import { getAwakenerIdentityKey } from '../../domain/awakener-identity'
import { assignAwakenerToFirstEmptySlot, assignAwakenerToSlot, type TeamStateViolationCode } from './team-state'
import type { ActiveSelection, TeamSlot } from './types'

type AwakenerTransferRequest = {
  awakenerName: string
  canUseSupport?: boolean
  fromTeamId: string
  toTeamId: string
  targetSlotId?: string
}

type UseBuilderAwakenerActionsOptions = {
  teamSlots: TeamSlot[]
  awakenerByName: Map<string, Awakener>
  effectiveActiveTeamId: string
  usedAwakenerByIdentityKey: Map<string, string>
  resolvedActiveSelection: ActiveSelection
  setActiveTeamSlots: (nextSlots: TeamSlot[]) => void
  setActiveSelection: (nextSelection: ActiveSelection) => void
  requestAwakenerTransfer: (request: AwakenerTransferRequest) => void
  clearPendingDelete: () => void
  clearTransfer: () => void
  notifyViolation: (violation: TeamStateViolationCode | undefined) => void
  allowDupes: boolean
  hasSupportAwakener: boolean
  onPickerAssignSuccess?: (nextSlots: TeamSlot[]) => void
}

export function useBuilderAwakenerActions({
  teamSlots,
  awakenerByName,
  effectiveActiveTeamId,
  usedAwakenerByIdentityKey,
  resolvedActiveSelection,
  setActiveTeamSlots,
  setActiveSelection,
  requestAwakenerTransfer,
  clearPendingDelete,
  clearTransfer,
  notifyViolation,
  allowDupes,
  hasSupportAwakener,
  onPickerAssignSuccess,
}: UseBuilderAwakenerActionsOptions) {
  const handleDropPickerAwakener = useCallback(
    (awakenerName: string, targetSlotId: string) => {
      const result = assignAwakenerToSlot(teamSlots, awakenerName, targetSlotId, awakenerByName, {
        allowDuplicateIdentity: allowDupes,
      })
      notifyViolation(result.violation)
      if (result.nextSlots === teamSlots) {
        return
      }

      const identityKey = getAwakenerIdentityKey(awakenerName)
      const owningTeamId = allowDupes ? undefined : usedAwakenerByIdentityKey.get(identityKey)
      const targetSlot = teamSlots.find((slot) => slot.slotId === targetSlotId)
      if (owningTeamId && owningTeamId !== effectiveActiveTeamId && !targetSlot?.isSupport) {
        clearPendingDelete()
        requestAwakenerTransfer({
          awakenerName,
          canUseSupport: !hasSupportAwakener,
          fromTeamId: owningTeamId,
          toTeamId: effectiveActiveTeamId,
          targetSlotId,
        })
        return
      }

      clearTransfer()
      setActiveTeamSlots(result.nextSlots)
      setActiveSelection({ kind: 'awakener', slotId: targetSlotId })
      onPickerAssignSuccess?.(result.nextSlots)
    },
    [
      awakenerByName,
      allowDupes,
      clearPendingDelete,
      clearTransfer,
      effectiveActiveTeamId,
      notifyViolation,
      requestAwakenerTransfer,
      setActiveSelection,
      setActiveTeamSlots,
      teamSlots,
      usedAwakenerByIdentityKey,
      hasSupportAwakener,
      onPickerAssignSuccess,
    ],
  )

  const handlePickerAwakenerClick = useCallback(
    (awakenerName: string) => {
      clearPendingDelete()
      clearTransfer()

      const targetSlotId = resolvedActiveSelection?.kind === 'awakener' ? resolvedActiveSelection.slotId : undefined
      const result = targetSlotId
        ? assignAwakenerToSlot(teamSlots, awakenerName, targetSlotId, awakenerByName, {
            allowDuplicateIdentity: allowDupes,
          })
        : assignAwakenerToFirstEmptySlot(teamSlots, awakenerName, awakenerByName, {
            allowDuplicateIdentity: allowDupes,
          })

      notifyViolation(result.violation)
      if (result.nextSlots === teamSlots) {
        return
      }

      const identityKey = getAwakenerIdentityKey(awakenerName)
      const owningTeamId = allowDupes ? undefined : usedAwakenerByIdentityKey.get(identityKey)
      const targetSlot = targetSlotId ? teamSlots.find((slot) => slot.slotId === targetSlotId) : undefined
      if (owningTeamId && owningTeamId !== effectiveActiveTeamId && !targetSlot?.isSupport) {
        requestAwakenerTransfer({
          awakenerName,
          canUseSupport: !hasSupportAwakener,
          fromTeamId: owningTeamId,
          toTeamId: effectiveActiveTeamId,
          targetSlotId,
        })
        return
      }

      setActiveTeamSlots(result.nextSlots)
      clearTransfer()
      onPickerAssignSuccess?.(result.nextSlots)
    },
    [
      awakenerByName,
      allowDupes,
      clearPendingDelete,
      clearTransfer,
      effectiveActiveTeamId,
      notifyViolation,
      requestAwakenerTransfer,
      resolvedActiveSelection,
      setActiveTeamSlots,
      teamSlots,
      usedAwakenerByIdentityKey,
      hasSupportAwakener,
      onPickerAssignSuccess,
    ],
  )

  return {
    handleDropPickerAwakener,
    handlePickerAwakenerClick,
  }
}

