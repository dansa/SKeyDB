import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'

import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  type TeamStateViolationCode,
} from './team-state'
import type {ActiveSelection, TeamSlot} from './types'

interface AwakenerTransferRequest {
  awakenerName: string
  awakenerId: string
  canUseSupport?: boolean
  fromTeamId: string
  toTeamId: string
  targetSlotId?: string
}

interface BuilderAwakenerActionsOptions {
  teamSlots: TeamSlot[]
  awakenerById: Map<string, Awakener>
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

export function createBuilderAwakenerActions(options: BuilderAwakenerActionsOptions) {
  const {
    teamSlots,
    awakenerById,
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
  } = options
  function maybeRequestTransfer(awakenerId: string, targetSlotId: string | undefined): boolean {
    const awakener = awakenerById.get(awakenerId)
    const identityKey = getAwakenerIdentityKeyById(awakenerId)
    const owningTeamId = allowDupes ? undefined : usedAwakenerByIdentityKey.get(identityKey)
    const targetSlot = targetSlotId
      ? teamSlots.find((slot) => slot.slotId === targetSlotId)
      : undefined

    if (
      !awakener ||
      !owningTeamId ||
      owningTeamId === effectiveActiveTeamId ||
      targetSlot?.isSupport
    ) {
      return false
    }

    requestAwakenerTransfer({
      awakenerName: awakener.name,
      awakenerId,
      canUseSupport: !hasSupportAwakener,
      fromTeamId: owningTeamId,
      toTeamId: effectiveActiveTeamId,
      targetSlotId,
    })
    return true
  }

  function handleDropPickerAwakener(awakenerId: string, targetSlotId: string) {
    if (!awakenerById.has(awakenerId)) {
      return
    }
    const result = assignAwakenerToSlot(teamSlots, awakenerId, targetSlotId, awakenerById, {
      allowDuplicateIdentity: allowDupes,
    })
    notifyViolation(result.violation)
    if (result.nextSlots === teamSlots) {
      return
    }

    if (maybeRequestTransfer(awakenerId, targetSlotId)) {
      clearPendingDelete()
      return
    }

    clearTransfer()
    setActiveTeamSlots(result.nextSlots)
    setActiveSelection({kind: 'awakener', slotId: targetSlotId})
    onPickerAssignSuccess?.(result.nextSlots)
  }

  function handlePickerAwakenerClick(awakenerId: string) {
    clearPendingDelete()
    clearTransfer()
    if (!awakenerById.has(awakenerId)) {
      return
    }

    const targetSlotId =
      resolvedActiveSelection?.kind === 'awakener' ? resolvedActiveSelection.slotId : undefined
    const result = targetSlotId
      ? assignAwakenerToSlot(teamSlots, awakenerId, targetSlotId, awakenerById, {
          allowDuplicateIdentity: allowDupes,
        })
      : assignAwakenerToFirstEmptySlot(teamSlots, awakenerId, awakenerById, {
          allowDuplicateIdentity: allowDupes,
        })

    notifyViolation(result.violation)
    if (result.nextSlots === teamSlots) {
      return
    }

    if (maybeRequestTransfer(awakenerId, targetSlotId)) {
      return
    }

    setActiveTeamSlots(result.nextSlots)
    clearTransfer()
    onPickerAssignSuccess?.(result.nextSlots)
  }

  return {
    handleDropPickerAwakener,
    handlePickerAwakenerClick,
  }
}
