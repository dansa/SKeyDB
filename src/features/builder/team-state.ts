import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'
import {
  DEFAULT_TEAM_RULES_CONFIG,
  exceedsRealmLimitForTeam,
  loadoutHasWheelInOtherSocket,
} from '@/domain/team-rules'

import type {TeamSlot} from './types'

export type TeamStateViolationCode = 'TOO_MANY_REALMS_IN_TEAM' | 'INVALID_BUILD_RULES'

export interface TeamStateUpdateResult {
  nextSlots: TeamSlot[]
  changed: boolean
  violation?: TeamStateViolationCode
}

function asRealmMembers(slots: TeamSlot[]) {
  return slots.flatMap((slot) => {
    if (!slot.awakenerId || !slot.realm) {
      return []
    }

    return [{realm: slot.realm}]
  })
}

export function getTeamRealmSet(slots: TeamSlot[]): Set<string> {
  return new Set(asRealmMembers(slots).map((member) => member.realm.trim().toUpperCase()))
}

export function assignAwakenerToSlot(
  currentSlots: TeamSlot[],
  awakenerId: string,
  slotId: string,
  awakenerById: Map<string, Awakener>,
  options?: {allowDuplicateIdentity?: boolean},
): TeamStateUpdateResult {
  const awakener = awakenerById.get(awakenerId)
  if (!awakener) {
    return unchangedTeamState(currentSlots)
  }

  const hasTargetSlot = currentSlots.some((slot) => slot.slotId === slotId)
  if (!hasTargetSlot) {
    return unchangedTeamState(currentSlots)
  }

  const sourceIdentityKey = getAwakenerIdentityKeyById(awakenerId)
  const sourceSlotId = options?.allowDuplicateIdentity
    ? undefined
    : currentSlots.find(
        (slot) =>
          slot.awakenerId && getAwakenerIdentityKeyById(slot.awakenerId) === sourceIdentityKey,
      )?.slotId
  const targetSlot = currentSlots.find((slot) => slot.slotId === slotId)
  if (sourceSlotId === slotId && targetSlot?.awakenerId === awakenerId) {
    return unchangedTeamState(currentSlots)
  }

  const nextSlots = currentSlots.map((slot) => {
    if (slot.slotId === slotId) {
      return {
        ...slot,
        awakenerId,
        realm: awakener.realm,
        level: slot.level ?? 60,
        isSupport: slot.isSupport,
      }
    }

    if (slot.slotId === sourceSlotId && sourceSlotId !== slotId) {
      return {
        ...slot,
        awakenerId: undefined,
        realm: undefined,
        level: undefined,
        isSupport: undefined,
        wheels: [null, null] as [null, null],
        covenantId: undefined,
      }
    }

    return slot
  })

  if (
    exceedsRealmLimitForTeam(asRealmMembers(nextSlots), DEFAULT_TEAM_RULES_CONFIG.maxRealmsPerTeam)
  ) {
    return {
      nextSlots: currentSlots,
      changed: false,
      violation: 'TOO_MANY_REALMS_IN_TEAM',
    }
  }

  return changedTeamState(nextSlots)
}

export function assignAwakenerToFirstEmptySlot(
  currentSlots: TeamSlot[],
  awakenerId: string,
  awakenerById: Map<string, Awakener>,
  options?: {allowDuplicateIdentity?: boolean},
): TeamStateUpdateResult {
  const identityKey = getAwakenerIdentityKeyById(awakenerId)
  const alreadyAssigned = currentSlots.some(
    (slot) => slot.awakenerId && getAwakenerIdentityKeyById(slot.awakenerId) === identityKey,
  )
  if (alreadyAssigned && !options?.allowDuplicateIdentity) {
    return unchangedTeamState(currentSlots)
  }

  const firstEmptySlotId = currentSlots.find((slot) => !slot.awakenerId)?.slotId
  if (!firstEmptySlotId) {
    return unchangedTeamState(currentSlots)
  }

  return assignAwakenerToSlot(currentSlots, awakenerId, firstEmptySlotId, awakenerById, options)
}

export function swapSlotAssignments(
  currentSlots: TeamSlot[],
  sourceSlotId: string,
  targetSlotId: string,
): TeamStateUpdateResult {
  if (sourceSlotId === targetSlotId) {
    return unchangedTeamState(currentSlots)
  }

  const sourceSlot = currentSlots.find((slot) => slot.slotId === sourceSlotId)
  const targetSlot = currentSlots.find((slot) => slot.slotId === targetSlotId)
  if (!sourceSlot || !targetSlot) {
    return unchangedTeamState(currentSlots)
  }

  const nextSlots = currentSlots.map((slot) => {
    if (slot.slotId === sourceSlotId) {
      return {
        ...slot,
        awakenerId: targetSlot.awakenerId,
        realm: targetSlot.realm,
        level: targetSlot.level,
        isSupport: targetSlot.isSupport,
        wheels: [...targetSlot.wheels] as [string | null, string | null],
        covenantId: targetSlot.covenantId,
      }
    }

    if (slot.slotId === targetSlotId) {
      return {
        ...slot,
        awakenerId: sourceSlot.awakenerId,
        realm: sourceSlot.realm,
        level: sourceSlot.level,
        isSupport: sourceSlot.isSupport,
        wheels: [...sourceSlot.wheels] as [string | null, string | null],
        covenantId: sourceSlot.covenantId,
      }
    }

    return slot
  })

  return changedTeamState(nextSlots)
}

export function swapWheelAssignments(
  currentSlots: TeamSlot[],
  sourceSlotId: string,
  sourceWheelIndex: number,
  targetSlotId: string,
  targetWheelIndex: number,
): TeamStateUpdateResult {
  if (
    sourceWheelIndex < 0 ||
    sourceWheelIndex > 1 ||
    targetWheelIndex < 0 ||
    targetWheelIndex > 1
  ) {
    return unchangedTeamState(currentSlots)
  }

  const sourceSlot = currentSlots.find((slot) => slot.slotId === sourceSlotId)
  const targetSlot = currentSlots.find((slot) => slot.slotId === targetSlotId)
  if (!sourceSlot || !targetSlot?.awakenerId) {
    return unchangedTeamState(currentSlots)
  }

  const sourceWheelId = sourceSlot.wheels[sourceWheelIndex] ?? null
  if (!sourceWheelId) {
    return unchangedTeamState(currentSlots)
  }

  if (sourceSlotId === targetSlotId && sourceWheelIndex === targetWheelIndex) {
    return unchangedTeamState(currentSlots)
  }

  if (
    sourceSlotId !== targetSlotId &&
    loadoutHasWheelInOtherSocket(targetSlot.wheels, sourceWheelId, targetWheelIndex)
  ) {
    return unchangedTeamState(currentSlots, 'INVALID_BUILD_RULES')
  }

  if (sourceSlotId === targetSlotId) {
    const nextSlots = currentSlots.map((slot) => {
      if (slot.slotId !== sourceSlotId) {
        return slot
      }
      const nextWheels = [...slot.wheels] as [string | null, string | null]
      const targetWheelId = nextWheels[targetWheelIndex]
      nextWheels[sourceWheelIndex] = targetWheelId
      nextWheels[targetWheelIndex] = sourceWheelId
      return {...slot, wheels: nextWheels}
    })
    return changedTeamState(nextSlots)
  }

  const targetWheelId = targetSlot.wheels[targetWheelIndex] ?? null
  const nextSlots = currentSlots.map((slot) => {
    if (slot.slotId === sourceSlotId) {
      const nextWheels = [...slot.wheels] as [string | null, string | null]
      nextWheels[sourceWheelIndex] = targetWheelId
      return {...slot, wheels: nextWheels}
    }
    if (slot.slotId === targetSlotId) {
      const nextWheels = [...slot.wheels] as [string | null, string | null]
      nextWheels[targetWheelIndex] = sourceWheelId
      return {...slot, wheels: nextWheels}
    }
    return slot
  })

  return changedTeamState(nextSlots)
}

export function clearSlotAssignment(
  currentSlots: TeamSlot[],
  slotId: string,
): TeamStateUpdateResult {
  const hasTargetSlot = currentSlots.some((slot) => slot.slotId === slotId)
  if (!hasTargetSlot) {
    return unchangedTeamState(currentSlots)
  }

  let changed = false

  const nextSlots = currentSlots.map((slot) => {
    if (slot.slotId !== slotId) {
      return slot
    }

    if (
      !slot.awakenerId &&
      !slot.realm &&
      !slot.level &&
      !slot.covenantId &&
      slot.wheels[0] === null &&
      slot.wheels[1] === null
    ) {
      return slot
    }

    changed = true
    return {
      ...slot,
      awakenerId: undefined,
      realm: undefined,
      level: undefined,
      isSupport: undefined,
      wheels: [null, null] as [null, null],
      covenantId: undefined,
    }
  })

  return {nextSlots, changed}
}

export function assignWheelToSlot(
  currentSlots: TeamSlot[],
  slotId: string,
  wheelIndex: number,
  wheelId: string | null,
): TeamStateUpdateResult {
  if (wheelIndex < 0 || wheelIndex > 1) {
    return unchangedTeamState(currentSlots)
  }

  const hasTargetSlot = currentSlots.some((slot) => slot.slotId === slotId)
  if (!hasTargetSlot) {
    return unchangedTeamState(currentSlots)
  }

  const targetSlot = currentSlots.find((slot) => slot.slotId === slotId)
  if (!targetSlot) {
    return unchangedTeamState(currentSlots)
  }
  if (wheelId && !targetSlot.awakenerId) {
    return unchangedTeamState(currentSlots)
  }
  if (targetSlot.wheels[wheelIndex] === wheelId) {
    return unchangedTeamState(currentSlots)
  }
  if (loadoutHasWheelInOtherSocket(targetSlot.wheels, wheelId, wheelIndex)) {
    return unchangedTeamState(currentSlots, 'INVALID_BUILD_RULES')
  }

  const nextSlots = currentSlots.map((slot) => {
    if (slot.slotId !== slotId) {
      return slot
    }

    const nextWheels = [...slot.wheels] as [string | null, string | null]
    nextWheels[wheelIndex] = wheelId

    return {
      ...slot,
      wheels: nextWheels,
    }
  })

  return changedTeamState(nextSlots)
}

export function clearWheelAssignment(
  currentSlots: TeamSlot[],
  slotId: string,
  wheelIndex: number,
): TeamStateUpdateResult {
  return assignWheelToSlot(currentSlots, slotId, wheelIndex, null)
}

export function assignCovenantToSlot(
  currentSlots: TeamSlot[],
  slotId: string,
  covenantId: string | undefined,
): TeamStateUpdateResult {
  const hasTargetSlot = currentSlots.some((slot) => slot.slotId === slotId)
  if (!hasTargetSlot) {
    return unchangedTeamState(currentSlots)
  }

  const targetSlot = currentSlots.find((slot) => slot.slotId === slotId)
  if (!targetSlot || (covenantId && !targetSlot.awakenerId)) {
    return unchangedTeamState(currentSlots)
  }
  if (targetSlot.covenantId === covenantId) {
    return unchangedTeamState(currentSlots)
  }

  const nextSlots = currentSlots.map((slot) =>
    slot.slotId === slotId
      ? {
          ...slot,
          covenantId,
        }
      : slot,
  )

  return changedTeamState(nextSlots)
}

export function clearCovenantAssignment(
  currentSlots: TeamSlot[],
  slotId: string,
): TeamStateUpdateResult {
  return assignCovenantToSlot(currentSlots, slotId, undefined)
}

export function swapCovenantAssignments(
  currentSlots: TeamSlot[],
  sourceSlotId: string,
  targetSlotId: string,
): TeamStateUpdateResult {
  if (sourceSlotId === targetSlotId) {
    return unchangedTeamState(currentSlots)
  }

  const sourceSlot = currentSlots.find((slot) => slot.slotId === sourceSlotId)
  const targetSlot = currentSlots.find((slot) => slot.slotId === targetSlotId)
  if (!sourceSlot || !targetSlot?.awakenerId) {
    return unchangedTeamState(currentSlots)
  }

  const sourceCovenantId = sourceSlot.covenantId
  if (!sourceCovenantId) {
    return unchangedTeamState(currentSlots)
  }

  const targetCovenantId = targetSlot.covenantId
  const nextSlots = currentSlots.map((slot) => {
    if (slot.slotId === sourceSlotId) {
      return {
        ...slot,
        covenantId: targetCovenantId,
      }
    }
    if (slot.slotId === targetSlotId) {
      return {
        ...slot,
        covenantId: sourceCovenantId,
      }
    }
    return slot
  })

  return changedTeamState(nextSlots)
}

function unchangedTeamState(
  nextSlots: TeamSlot[],
  violation?: TeamStateViolationCode,
): TeamStateUpdateResult {
  return {nextSlots, changed: false, violation}
}

function changedTeamState(nextSlots: TeamSlot[]): TeamStateUpdateResult {
  return {nextSlots, changed: true}
}
