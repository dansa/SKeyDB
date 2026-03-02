import { getAwakenerIdentityKey } from '../../domain/awakener-identity'
import { DEFAULT_TEAM_RULES_CONFIG, exceedsRealmLimitForTeam } from '../../domain/team-rules'
import { awakenerByName } from './constants'
import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  assignWheelToSlot,
  clearSlotAssignment,
  type TeamStateViolationCode,
  swapSlotAssignments,
} from './team-state'
import { validateBuilderTeams } from './team-validation'
import type { Team } from './types'
import type { PendingTransfer } from './useTransferConfirm'

function asRealmMembers(slots: Team['slots']) {
  return slots
    .filter((slot) => slot.awakenerName && slot.realm)
    .map((slot) => ({ realm: slot.realm! }))
}

function violatesRealmCap(slots: Team['slots']) {
  return exceedsRealmLimitForTeam(asRealmMembers(slots), DEFAULT_TEAM_RULES_CONFIG.maxRealmsPerTeam)
}

function withSupportSlot(slots: Team['slots'], supportSlotId: string): Team['slots'] {
  return slots.map((slot) => ({
    ...slot,
    isSupport: slot.slotId === supportSlotId ? true : undefined,
  }))
}

function findAssignedAwakenerSlotId(
  previousSlots: Team['slots'],
  nextSlots: Team['slots'],
  awakenerName: string,
): string | null {
  const previousById = new Map(previousSlots.map((slot) => [slot.slotId, slot]))
  for (const slot of nextSlots) {
    if (slot.awakenerName !== awakenerName) {
      continue
    }
    const previousSlot = previousById.get(slot.slotId)
    if (previousSlot?.awakenerName !== awakenerName) {
      return slot.slotId
    }
  }
  return nextSlots.find((slot) => slot.awakenerName === awakenerName)?.slotId ?? null
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

export function applySupportTransfer(teams: Team[], pendingTransfer: PendingTransfer): Team[] {
  if (pendingTransfer.kind !== 'awakener') {
    return teams
  }

  const toTeam = teams.find((team) => team.id === pendingTransfer.toTeamId)
  if (!toTeam) {
    return teams
  }

  const assignResult = pendingTransfer.targetSlotId
    ? assignAwakenerToSlot(
        toTeam.slots,
        pendingTransfer.awakenerName,
        pendingTransfer.targetSlotId,
        awakenerByName,
        { allowDuplicateIdentity: true },
      )
    : assignAwakenerToFirstEmptySlot(toTeam.slots, pendingTransfer.awakenerName, awakenerByName, {
        allowDuplicateIdentity: true,
      })
  if (assignResult.violation || assignResult.nextSlots === toTeam.slots) {
    return teams
  }

  const supportSlotId =
    pendingTransfer.targetSlotId ??
    findAssignedAwakenerSlotId(toTeam.slots, assignResult.nextSlots, pendingTransfer.awakenerName)
  if (!supportSlotId) {
    return teams
  }

  const nextSupportSlots = withSupportSlot(assignResult.nextSlots, supportSlotId).map((slot) =>
    slot.slotId === supportSlotId ? { ...slot, level: 90 } : slot,
  )

  if (violatesRealmCap(nextSupportSlots)) {
    return teams
  }

  return teams.map((team) =>
    team.id === toTeam.id
      ? {
          ...team,
          slots: nextSupportSlots,
        }
      : team,
  )
}

export function swapTeamSlotTransfer(
  teams: Team[],
  sourceTeamId: string,
  sourceSlotId: string,
  targetTeamId: string,
  targetSlotId: string,
  options?: { allowDupes?: boolean },
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
          realm: targetSlot.realm,
          level: targetSlot.level,
          isSupport: targetSlot.isSupport,
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
          realm: sourceSlot.realm,
          level: sourceSlot.level,
          isSupport: sourceSlot.isSupport,
          wheels: [...sourceSlot.wheels] as [string | null, string | null],
          covenantId: sourceSlot.covenantId,
        }
      : slot,
  )

  if (violatesRealmCap(nextSourceSlots) || violatesRealmCap(nextTargetSlots)) {
    return {
      nextTeams: teams,
      violation: 'TOO_MANY_REALMS_IN_TEAM',
    }
  }

  const nextTeams = teams.map((team) => {
      if (team.id === sourceTeamId) {
        return { ...team, slots: nextSourceSlots }
      }
      if (team.id === targetTeamId) {
        return { ...team, slots: nextTargetSlots }
      }
      return team
    })

  if (!options?.allowDupes) {
    const validation = validateBuilderTeams(nextTeams, { allowDupes: false })
    if (!validation.isValid) {
      return {
        nextTeams: teams,
        violation: 'INVALID_BUILD_RULES',
      }
    }
  }

  return {
    nextTeams,
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
