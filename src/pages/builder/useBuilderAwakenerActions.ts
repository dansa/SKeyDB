import { useCallback } from 'react'
import type { Awakener } from '../../domain/awakeners'
import { getAwakenerIdentityKey } from '../../domain/awakener-identity'
import { assignAwakenerToFirstEmptySlot, assignAwakenerToSlot, type TeamStateViolationCode } from './team-state'
import type { ActiveSelection, TeamSlot } from './types'

type AwakenerTransferRequest = {
  awakenerName: string
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
      if (owningTeamId && owningTeamId !== effectiveActiveTeamId) {
        clearPendingDelete()
        requestAwakenerTransfer({
          awakenerName,
          fromTeamId: owningTeamId,
          toTeamId: effectiveActiveTeamId,
          targetSlotId,
        })
        return
      }

      clearTransfer()
      setActiveTeamSlots(result.nextSlots)
      setActiveSelection({ kind: 'awakener', slotId: targetSlotId })
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
      if (owningTeamId && owningTeamId !== effectiveActiveTeamId) {
        requestAwakenerTransfer({
          awakenerName,
          fromTeamId: owningTeamId,
          toTeamId: effectiveActiveTeamId,
          targetSlotId,
        })
        return
      }

      setActiveTeamSlots(result.nextSlots)
      clearTransfer()
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
    ],
  )

  return {
    handleDropPickerAwakener,
    handlePickerAwakenerClick,
  }
}

