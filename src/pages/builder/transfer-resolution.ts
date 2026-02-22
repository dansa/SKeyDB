import { getAwakenerIdentityKey } from '../../domain/awakener-identity'
import { awakenerByName } from './constants'
import { assignAwakenerToFirstEmptySlot, assignAwakenerToSlot, clearSlotAssignment } from './team-state'
import type { Team } from './types'
import type { PendingTransfer } from './useTransferConfirm'

export function applyPendingTransfer(teams: Team[], pendingTransfer: PendingTransfer): Team[] {
  if (pendingTransfer.kind === 'posse') {
    return teams.map((team) => {
      if (team.id === pendingTransfer.fromTeamId) {
        return { ...team, posseId: undefined }
      }
      if (team.id === pendingTransfer.toTeamId) {
        return { ...team, posseId: pendingTransfer.posseId }
      }
      return team
    })
  }

  if (pendingTransfer.kind === 'wheel') {
    return teams.map((team) => {
      if (team.id === pendingTransfer.fromTeamId) {
        return {
          ...team,
          slots: team.slots.map((slot) => {
            if (slot.slotId !== pendingTransfer.fromSlotId) {
              return slot
            }
            const nextWheels = [...slot.wheels]
            nextWheels[pendingTransfer.fromWheelIndex] = null
            return { ...slot, wheels: nextWheels as [string | null, string | null] }
          }),
        }
      }
      if (team.id === pendingTransfer.toTeamId) {
        return {
          ...team,
          slots: team.slots.map((slot) => {
            if (slot.slotId !== pendingTransfer.targetSlotId) {
              return slot
            }
            const nextWheels = [...slot.wheels]
            nextWheels[pendingTransfer.targetWheelIndex] = pendingTransfer.wheelId
            return { ...slot, wheels: nextWheels as [string | null, string | null] }
          }),
        }
      }
      return team
    })
  }

  const fromTeam = teams.find((team) => team.id === pendingTransfer.fromTeamId)
  const toTeam = teams.find((team) => team.id === pendingTransfer.toTeamId)
  if (!fromTeam || !toTeam) {
    return teams
  }

  const moveResult = pendingTransfer.targetSlotId
    ? assignAwakenerToSlot(toTeam.slots, pendingTransfer.awakenerName, pendingTransfer.targetSlotId, awakenerByName)
    : assignAwakenerToFirstEmptySlot(toTeam.slots, pendingTransfer.awakenerName, awakenerByName)
  if (moveResult.violation || moveResult.nextSlots === toTeam.slots) {
    return teams
  }

  const identityKey = getAwakenerIdentityKey(pendingTransfer.awakenerName)
  const sourceSlot = fromTeam.slots.find(
    (slot) => slot.awakenerName && getAwakenerIdentityKey(slot.awakenerName) === identityKey,
  )
  const clearedFromSlots = sourceSlot ? clearSlotAssignment(fromTeam.slots, sourceSlot.slotId).nextSlots : fromTeam.slots

  return teams.map((team) => {
    if (team.id === fromTeam.id) {
      return {
        ...team,
        slots: clearedFromSlots,
      }
    }
    if (team.id === toTeam.id) {
      return {
        ...team,
        slots: moveResult.nextSlots,
      }
    }
    return team
  })
}
