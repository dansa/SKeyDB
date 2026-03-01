import { getAwakenerIdentityKey } from '../../domain/awakener-identity'
import { DEFAULT_TEAM_RULES_CONFIG, exceedsFactionLimitForTeam } from '../../domain/team-rules'
import { awakenerByName } from './constants'
import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  assignWheelToSlot,
  clearSlotAssignment,
  type TeamStateViolationCode,
  swapSlotAssignments,
} from './team-state'
import type { Team } from './types'
import type { PendingTransfer } from './useTransferConfirm'

function asFactionMembers(slots: Team['slots']) {
  return slots
    .filter((slot) => slot.awakenerName && slot.faction)
    .map((slot) => ({ faction: slot.faction! }))
}

function violatesFactionCap(slots: Team['slots']) {
  return exceedsFactionLimitForTeam(asFactionMembers(slots), DEFAULT_TEAM_RULES_CONFIG.maxFactionsPerTeam)
}

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
    const fromTeam = teams.find((team) => team.id === pendingTransfer.fromTeamId)
    const toTeam = teams.find((team) => team.id === pendingTransfer.toTeamId)
    if (!fromTeam || !toTeam) {
      return teams
    }
    if (fromTeam.id === toTeam.id) {
      return teams
    }

    const targetResult = assignWheelToSlot(
      toTeam.slots,
      pendingTransfer.targetSlotId,
      pendingTransfer.targetWheelIndex,
      pendingTransfer.wheelId,
    )
    if (targetResult.nextSlots === toTeam.slots) {
      return teams
    }

    const sourceResult = assignWheelToSlot(
      fromTeam.slots,
      pendingTransfer.fromSlotId,
      pendingTransfer.fromWheelIndex,
      null,
    )

    return teams.map((team) => {
      if (team.id === fromTeam.id) {
        return {
          ...team,
          slots: sourceResult.nextSlots,
        }
      }
      if (team.id === toTeam.id) {
        return {
          ...team,
          slots: targetResult.nextSlots,
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

export function swapTeamSlotTransfer(
  teams: Team[],
  sourceTeamId: string,
  sourceSlotId: string,
  targetTeamId: string,
  targetSlotId: string,
): { nextTeams: Team[]; violation?: TeamStateViolationCode } {
  const sourceTeam = teams.find((team) => team.id === sourceTeamId)
  const targetTeam = teams.find((team) => team.id === targetTeamId)
  if (!sourceTeam || !targetTeam) {
    return { nextTeams: teams }
  }

  if (sourceTeamId === targetTeamId) {
    const result = swapSlotAssignments(sourceTeam.slots, sourceSlotId, targetSlotId)
    return {
      nextTeams: teams.map((team) => (team.id === sourceTeamId ? { ...team, slots: result.nextSlots } : team)),
      violation: result.violation,
    }
  }

  const sourceSlot = sourceTeam.slots.find((slot) => slot.slotId === sourceSlotId)
  const targetSlot = targetTeam.slots.find((slot) => slot.slotId === targetSlotId)
  if (!sourceSlot || !targetSlot) {
    return { nextTeams: teams }
  }

  const nextSourceSlots = sourceTeam.slots.map((slot) =>
    slot.slotId === sourceSlotId
      ? {
          ...slot,
          awakenerName: targetSlot.awakenerName,
          faction: targetSlot.faction,
          level: targetSlot.level,
          wheels: [...targetSlot.wheels] as [string | null, string | null],
          covenantId: targetSlot.covenantId,
        }
      : slot,
  )
  const nextTargetSlots = targetTeam.slots.map((slot) =>
    slot.slotId === targetSlotId
      ? {
          ...slot,
          awakenerName: sourceSlot.awakenerName,
          faction: sourceSlot.faction,
          level: sourceSlot.level,
          wheels: [...sourceSlot.wheels] as [string | null, string | null],
          covenantId: sourceSlot.covenantId,
        }
      : slot,
  )

  if (violatesFactionCap(nextSourceSlots) || violatesFactionCap(nextTargetSlots)) {
    return {
      nextTeams: teams,
      violation: 'TOO_MANY_FACTIONS_IN_TEAM',
    }
  }

  return {
    nextTeams: teams.map((team) => {
      if (team.id === sourceTeamId) {
        return { ...team, slots: nextSourceSlots }
      }
      if (team.id === targetTeamId) {
        return { ...team, slots: nextTargetSlots }
      }
      return team
    }),
  }
}

export function clearTeamSlotTransfer(teams: Team[], teamId: string, slotId: string): Team[] {
  return teams.map((team) => {
    if (team.id !== teamId) {
      return team
    }
    return {
      ...team,
      slots: clearSlotAssignment(team.slots, slotId).nextSlots,
    }
  })
}
