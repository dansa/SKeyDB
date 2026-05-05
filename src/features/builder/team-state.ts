import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'
import {DEFAULT_TEAM_RULES_CONFIG, exceedsRealmLimitForTeam} from '@/domain/team-rules'

import type {TeamSlot} from './types'

export type TeamStateViolationCode = 'TOO_MANY_REALMS_IN_TEAM' | 'INVALID_BUILD_RULES'

export interface TeamStateUpdateResult {
  nextSlots: TeamSlot[]
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
    return {nextSlots: currentSlots}
  }

  const hasTargetSlot = currentSlots.some((slot) => slot.slotId === slotId)
  if (!hasTargetSlot) {
    return {nextSlots: currentSlots}
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
    return {nextSlots: currentSlots}
  }

  const nextSlots = currentSlots.map((slot) => {
    if (slot.slotId === slotId) {
      return {
        ...slot,
        awakenerId,
        realm: awakener.realm,
        level: slot.level ?? 60,
        isSupport: slot.isSupport,
        wheels: [null, null] as [null, null],
        covenantId: undefined,
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
      violation: 'TOO_MANY_REALMS_IN_TEAM',
    }
  }

  return {nextSlots}
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
    return {nextSlots: currentSlots}
  }

  const firstEmptySlotId = currentSlots.find((slot) => !slot.awakenerId)?.slotId
  if (!firstEmptySlotId) {
    return {nextSlots: currentSlots}
  }

  return assignAwakenerToSlot(currentSlots, awakenerId, firstEmptySlotId, awakenerById, options)
}

export function swapSlotAssignments(
  currentSlots: TeamSlot[],
  sourceSlotId: string,
  targetSlotId: string,
): TeamStateUpdateResult {
  if (sourceSlotId === targetSlotId) {
    return {nextSlots: currentSlots}
  }

  const sourceSlot = currentSlots.find((slot) => slot.slotId === sourceSlotId)
  const targetSlot = currentSlots.find((slot) => slot.slotId === targetSlotId)
  if (!sourceSlot || !targetSlot) {
    return {nextSlots: currentSlots}
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

  return {nextSlots}
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
    return {nextSlots: currentSlots}
  }

  const sourceSlot = currentSlots.find((slot) => slot.slotId === sourceSlotId)
  const targetSlot = currentSlots.find((slot) => slot.slotId === targetSlotId)
  if (!sourceSlot || !targetSlot?.awakenerId) {
    return {nextSlots: currentSlots}
  }

  const sourceWheelId = sourceSlot.wheels[sourceWheelIndex] ?? null
  if (!sourceWheelId) {
    return {nextSlots: currentSlots}
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
    return {nextSlots}
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

  return {nextSlots}
}

export function clearSlotAssignment(
  currentSlots: TeamSlot[],
  slotId: string,
): TeamStateUpdateResult {
  const hasTargetSlot = currentSlots.some((slot) => slot.slotId === slotId)
  if (!hasTargetSlot) {
    return {nextSlots: currentSlots}
  }

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

  return {nextSlots}
}

export function assignWheelToSlot(
  currentSlots: TeamSlot[],
  slotId: string,
  wheelIndex: number,
  wheelId: string | null,
): TeamStateUpdateResult {
  if (wheelIndex < 0 || wheelIndex > 1) {
    return {nextSlots: currentSlots}
  }

  const hasTargetSlot = currentSlots.some((slot) => slot.slotId === slotId)
  if (!hasTargetSlot) {
    return {nextSlots: currentSlots}
  }

  const targetSlot = currentSlots.find((slot) => slot.slotId === slotId)
  if (!targetSlot) {
    return {nextSlots: currentSlots}
  }
  if (wheelId && !targetSlot.awakenerId) {
    return {nextSlots: currentSlots}
  }
  if (targetSlot.wheels[wheelIndex] === wheelId) {
    return {nextSlots: currentSlots}
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

  return {nextSlots}
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
    return {nextSlots: currentSlots}
  }

  const targetSlot = currentSlots.find((slot) => slot.slotId === slotId)
  if (!targetSlot || (covenantId && !targetSlot.awakenerId)) {
    return {nextSlots: currentSlots}
  }
  if (targetSlot.covenantId === covenantId) {
    return {nextSlots: currentSlots}
  }

  const nextSlots = currentSlots.map((slot) =>
    slot.slotId === slotId
      ? {
          ...slot,
          covenantId,
        }
      : slot,
  )

  return {nextSlots}
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
    return {nextSlots: currentSlots}
  }

  const sourceSlot = currentSlots.find((slot) => slot.slotId === sourceSlotId)
  const targetSlot = currentSlots.find((slot) => slot.slotId === targetSlotId)
  if (!sourceSlot || !targetSlot?.awakenerId) {
    return {nextSlots: currentSlots}
  }

  const sourceCovenantId = sourceSlot.covenantId
  if (!sourceCovenantId) {
    return {nextSlots: currentSlots}
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

  return {nextSlots}
}
