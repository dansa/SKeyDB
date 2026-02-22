import type { Awakener } from '../../domain/awakeners'
import { getAwakenerIdentityKey } from '../../domain/awakener-identity'
import { DEFAULT_TEAM_RULES_CONFIG, exceedsFactionLimitForTeam } from '../../domain/team-rules'
import type { TeamSlot } from './types'

export type TeamStateViolationCode = 'TOO_MANY_FACTIONS_IN_TEAM'

export type TeamStateUpdateResult = {
  nextSlots: TeamSlot[]
  violation?: TeamStateViolationCode
}

function asFactionMembers(slots: TeamSlot[]) {
  return slots
    .filter((slot) => slot.awakenerName && slot.faction)
    .map((slot) => ({ faction: slot.faction! }))
}

export function getTeamFactionSet(slots: TeamSlot[]): Set<string> {
  return new Set(asFactionMembers(slots).map((member) => member.faction.trim().toUpperCase()))
}

export function assignAwakenerToSlot(
  currentSlots: TeamSlot[],
  awakenerName: string,
  slotId: string,
  awakenerByName: Map<string, Awakener>,
): TeamStateUpdateResult {
  const awakener = awakenerByName.get(awakenerName)
  if (!awakener) {
    return { nextSlots: currentSlots }
  }

  const hasTargetSlot = currentSlots.some((slot) => slot.slotId === slotId)
  if (!hasTargetSlot) {
    return { nextSlots: currentSlots }
  }

  const sourceIdentityKey = getAwakenerIdentityKey(awakenerName)
  const sourceSlotId = currentSlots.find(
    (slot) => slot.awakenerName && getAwakenerIdentityKey(slot.awakenerName) === sourceIdentityKey,
  )?.slotId
  const targetSlot = currentSlots.find((slot) => slot.slotId === slotId)
  if (sourceSlotId === slotId && targetSlot?.awakenerName === awakenerName) {
    return { nextSlots: currentSlots }
  }

  const nextSlots = currentSlots.map((slot) => {
    if (slot.slotId === slotId) {
      return {
        ...slot,
        awakenerName,
        faction: awakener.faction,
        level: slot.level ?? 60,
        wheels: [null, null] as [null, null],
        covenantId: undefined,
      }
    }

    if (slot.slotId === sourceSlotId && sourceSlotId !== slotId) {
      return {
        ...slot,
        awakenerName: undefined,
        faction: undefined,
        level: undefined,
        wheels: [null, null] as [null, null],
        covenantId: undefined,
      }
    }

    return slot
  })

  if (
    exceedsFactionLimitForTeam(asFactionMembers(nextSlots), DEFAULT_TEAM_RULES_CONFIG.maxFactionsPerTeam)
  ) {
    return {
      nextSlots: currentSlots,
      violation: 'TOO_MANY_FACTIONS_IN_TEAM',
    }
  }

  return { nextSlots }
}

export function assignAwakenerToFirstEmptySlot(
  currentSlots: TeamSlot[],
  awakenerName: string,
  awakenerByName: Map<string, Awakener>,
): TeamStateUpdateResult {
  const identityKey = getAwakenerIdentityKey(awakenerName)
  const alreadyAssigned = currentSlots.some(
    (slot) => slot.awakenerName && getAwakenerIdentityKey(slot.awakenerName) === identityKey,
  )
  if (alreadyAssigned) {
    return { nextSlots: currentSlots }
  }

  const firstEmptySlotId = currentSlots.find((slot) => !slot.awakenerName)?.slotId
  if (!firstEmptySlotId) {
    return { nextSlots: currentSlots }
  }

  return assignAwakenerToSlot(currentSlots, awakenerName, firstEmptySlotId, awakenerByName)
}

export function swapSlotAssignments(
  currentSlots: TeamSlot[],
  sourceSlotId: string,
  targetSlotId: string,
): TeamStateUpdateResult {
  if (sourceSlotId === targetSlotId) {
    return { nextSlots: currentSlots }
  }

  const sourceSlot = currentSlots.find((slot) => slot.slotId === sourceSlotId)
  const targetSlot = currentSlots.find((slot) => slot.slotId === targetSlotId)
  if (!sourceSlot || !targetSlot) {
    return { nextSlots: currentSlots }
  }

  const nextSlots = currentSlots.map((slot) => {
    if (slot.slotId === sourceSlotId) {
      return {
        ...slot,
        awakenerName: targetSlot.awakenerName,
        faction: targetSlot.faction,
        level: targetSlot.level,
        wheels: [...targetSlot.wheels] as [string | null, string | null],
        covenantId: targetSlot.covenantId,
      }
    }

    if (slot.slotId === targetSlotId) {
      return {
        ...slot,
        awakenerName: sourceSlot.awakenerName,
        faction: sourceSlot.faction,
        level: sourceSlot.level,
        wheels: [...sourceSlot.wheels] as [string | null, string | null],
        covenantId: sourceSlot.covenantId,
      }
    }

    return slot
  })

  return { nextSlots }
}

export function swapWheelAssignments(
  currentSlots: TeamSlot[],
  sourceSlotId: string,
  sourceWheelIndex: number,
  targetSlotId: string,
  targetWheelIndex: number,
): TeamStateUpdateResult {
  if (sourceWheelIndex < 0 || sourceWheelIndex > 1 || targetWheelIndex < 0 || targetWheelIndex > 1) {
    return { nextSlots: currentSlots }
  }

  const sourceSlot = currentSlots.find((slot) => slot.slotId === sourceSlotId)
  const targetSlot = currentSlots.find((slot) => slot.slotId === targetSlotId)
  if (!sourceSlot || !targetSlot || !targetSlot.awakenerName) {
    return { nextSlots: currentSlots }
  }

  const sourceWheelId = sourceSlot.wheels[sourceWheelIndex] ?? null
  if (!sourceWheelId) {
    return { nextSlots: currentSlots }
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
      return { ...slot, wheels: nextWheels }
    })
    return { nextSlots }
  }

  const targetWheelId = targetSlot.wheels[targetWheelIndex] ?? null
  const nextSlots = currentSlots.map((slot) => {
    if (slot.slotId === sourceSlotId) {
      const nextWheels = [...slot.wheels] as [string | null, string | null]
      nextWheels[sourceWheelIndex] = targetWheelId
      return { ...slot, wheels: nextWheels }
    }
    if (slot.slotId === targetSlotId) {
      const nextWheels = [...slot.wheels] as [string | null, string | null]
      nextWheels[targetWheelIndex] = sourceWheelId
      return { ...slot, wheels: nextWheels }
    }
    return slot
  })

  return { nextSlots }
}

export function clearSlotAssignment(currentSlots: TeamSlot[], slotId: string): TeamStateUpdateResult {
  const hasTargetSlot = currentSlots.some((slot) => slot.slotId === slotId)
  if (!hasTargetSlot) {
    return { nextSlots: currentSlots }
  }

  const nextSlots = currentSlots.map((slot) => {
    if (slot.slotId !== slotId) {
      return slot
    }

    if (
      !slot.awakenerName &&
      !slot.faction &&
      !slot.level &&
      !slot.covenantId &&
      slot.wheels[0] === null &&
      slot.wheels[1] === null
    ) {
      return slot
    }

    return {
      ...slot,
      awakenerName: undefined,
      faction: undefined,
      level: undefined,
      wheels: [null, null] as [null, null],
      covenantId: undefined,
    }
  })

  return { nextSlots }
}

export function assignWheelToSlot(
  currentSlots: TeamSlot[],
  slotId: string,
  wheelIndex: number,
  wheelId: string | null,
): TeamStateUpdateResult {
  if (wheelIndex < 0 || wheelIndex > 1) {
    return { nextSlots: currentSlots }
  }

  const hasTargetSlot = currentSlots.some((slot) => slot.slotId === slotId)
  if (!hasTargetSlot) {
    return { nextSlots: currentSlots }
  }

  const targetSlot = currentSlots.find((slot) => slot.slotId === slotId)
  if (!targetSlot) {
    return { nextSlots: currentSlots }
  }
  if (wheelId && !targetSlot.awakenerName) {
    return { nextSlots: currentSlots }
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

  return { nextSlots }
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
    return { nextSlots: currentSlots }
  }

  const targetSlot = currentSlots.find((slot) => slot.slotId === slotId)
  if (!targetSlot || (covenantId && !targetSlot.awakenerName)) {
    return { nextSlots: currentSlots }
  }

  const nextSlots = currentSlots.map((slot) =>
    slot.slotId === slotId
      ? {
          ...slot,
          covenantId,
        }
      : slot,
  )

  return { nextSlots }
}

export function clearCovenantAssignment(currentSlots: TeamSlot[], slotId: string): TeamStateUpdateResult {
  return assignCovenantToSlot(currentSlots, slotId, undefined)
}

export function swapCovenantAssignments(
  currentSlots: TeamSlot[],
  sourceSlotId: string,
  targetSlotId: string,
): TeamStateUpdateResult {
  if (sourceSlotId === targetSlotId) {
    return { nextSlots: currentSlots }
  }

  const sourceSlot = currentSlots.find((slot) => slot.slotId === sourceSlotId)
  const targetSlot = currentSlots.find((slot) => slot.slotId === targetSlotId)
  if (!sourceSlot || !targetSlot || !targetSlot.awakenerName) {
    return { nextSlots: currentSlots }
  }

  const sourceCovenantId = sourceSlot.covenantId
  if (!sourceCovenantId) {
    return { nextSlots: currentSlots }
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

  return { nextSlots }
}
