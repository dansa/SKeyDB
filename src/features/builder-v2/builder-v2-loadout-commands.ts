import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'
import type {Posse} from '@/domain/posses'

import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  assignCovenantToSlot,
  assignWheelToSlot,
  swapCovenantAssignments,
  swapWheelAssignments,
  type TeamStateViolationCode,
} from '../builder/team-state'
import type {ActiveSelection, Team, TeamSlot, WheelUsageLocation} from '../builder/types'
import type {BuilderV2AwakenerUsage} from './builder-v2-usage-index'
import type {BuilderV2PickerTab, BuilderV2TeamTarget} from './BuilderV2ModelTypes'

interface AssignAwakenerCommandOptions {
  activeSelection: ActiveSelection
  activeTeamId: string
  activeTeamSlots: TeamSlot[]
  allowDuplicateAwakenerIdentities: boolean
  awakenerById: Map<string, Awakener>
  awakenerId: string
  usedAwakenerByIdentityKey: Map<string, BuilderV2AwakenerUsage>
}

interface AssignWheelCommandOptions {
  activeSelection: ActiveSelection
  activeTeamId: string
  activeTeamSlots: TeamSlot[]
  allowDuplicateAwakenerIdentities: boolean
  usedWheelByTeamOrder: Map<string, WheelUsageLocation>
  wheelId: string
}

interface AssignCovenantCommandOptions {
  activeSelection: ActiveSelection
  activeTeamSlots: TeamSlot[]
  covenantId: string
}

interface AssignPosseCommandOptions {
  activeTeamId: string
  allowDuplicateAwakenerIdentities: boolean
  posseById: Map<string, Posse>
  posseId: string
  teams: Team[]
  usedPosseByTeamOrder: Map<string, number>
}

export type BuilderV2ResolvedLoadoutCommand =
  | BuilderV2LoadoutViolationCommand
  | BuilderV2LoadoutSlotsCommand
  | BuilderV2LoadoutAwakenerTransferCommand
  | BuilderV2LoadoutWheelTransferCommand
  | BuilderV2LoadoutPosseTransferCommand
  | BuilderV2LoadoutPosseAssignCommand

interface BuilderV2LoadoutViolationCommand {
  kind: 'violation'
  message: string
  pickerTab?: BuilderV2PickerTab
}

interface BuilderV2LoadoutSlotsCommand {
  kind: 'slots'
  nextSlots: TeamSlot[]
  changed: boolean
  clearTransfer: boolean
  activeSelection: ActiveSelection
  activeTeamTarget: BuilderV2TeamTarget
  pickerTab?: BuilderV2PickerTab
}

interface BuilderV2LoadoutAwakenerTransferCommand {
  kind: 'awakener-transfer'
  awakenerId: string
  awakenerName: string
  canUseSupport: boolean
  fromTeamId: string
  toTeamId: string
  targetSlotId: string | undefined
  pickerTab: 'awakeners'
}

interface BuilderV2LoadoutWheelTransferCommand {
  kind: 'wheel-transfer'
  wheelId: string
  fromTeamId: string
  fromSlotId: string
  fromWheelIndex: number
  toTeamId: string
  targetSlotId: string
  targetWheelIndex: 0 | 1
  pickerTab: 'wheels'
}

interface BuilderV2LoadoutPosseTransferCommand {
  kind: 'posse-transfer'
  posseId: string
  posseName: string
  fromTeamId: string
  toTeamId: string
  pickerTab: 'posses'
}

interface BuilderV2LoadoutPosseAssignCommand {
  kind: 'posse-assign'
  posseId: string
  clearTransfer: true
  activeSelection: null
  activeTeamTarget: {kind: 'posse'}
  pickerTab: 'posses'
}

export function resolveAssignAwakenerCommand({
  activeSelection,
  activeTeamId,
  activeTeamSlots,
  allowDuplicateAwakenerIdentities,
  awakenerById,
  awakenerId,
  usedAwakenerByIdentityKey,
}: AssignAwakenerCommandOptions): BuilderV2ResolvedLoadoutCommand {
  const targetSlotId = activeSelection?.kind === 'awakener' ? activeSelection.slotId : undefined
  const firstEmptySlotId = activeTeamSlots.find((slot) => !slot.awakenerId)?.slotId
  const result = targetSlotId
    ? assignAwakenerToSlot(activeTeamSlots, awakenerId, targetSlotId, awakenerById, {
        allowDuplicateIdentity: allowDuplicateAwakenerIdentities,
      })
    : assignAwakenerToFirstEmptySlot(activeTeamSlots, awakenerId, awakenerById, {
        allowDuplicateIdentity: allowDuplicateAwakenerIdentities,
      })

  if (result.violation) {
    return {
      kind: 'violation',
      message: getViolationMessage(result.violation),
    }
  }

  if (result.nextSlots === activeTeamSlots) {
    return {
      kind: 'violation',
      message: 'No available slot can accept that awakener.',
    }
  }

  const owningTeamId = getCrossTeamAwakenerOwner({
    activeTeamId,
    allowDuplicateAwakenerIdentities,
    awakenerId,
    slots: activeTeamSlots,
    targetSlotId,
    usedAwakenerByIdentityKey,
  })
  if (owningTeamId) {
    return {
      kind: 'awakener-transfer',
      awakenerId,
      awakenerName: awakenerById.get(awakenerId)?.name ?? 'Awakener',
      canUseSupport: !activeTeamSlots.some((slot) => slot.isSupport),
      fromTeamId: owningTeamId,
      toTeamId: activeTeamId,
      targetSlotId: targetSlotId ?? firstEmptySlotId,
      pickerTab: 'awakeners',
    }
  }

  const selectedSlotId = targetSlotId ?? firstEmptySlotId
  return {
    kind: 'slots',
    nextSlots: result.nextSlots,
    changed: true,
    clearTransfer: true,
    activeSelection: selectedSlotId ? {kind: 'awakener', slotId: selectedSlotId} : null,
    activeTeamTarget: null,
  }
}

export function resolveAssignWheelCommand({
  activeSelection,
  activeTeamId,
  activeTeamSlots,
  allowDuplicateAwakenerIdentities,
  usedWheelByTeamOrder,
  wheelId,
}: AssignWheelCommandOptions): BuilderV2ResolvedLoadoutCommand {
  const target = getWheelAssignmentTarget(activeSelection, activeTeamSlots)
  if (!target) {
    return {
      kind: 'violation',
      message: 'Select a wheel slot or an awakened slot before assigning a wheel.',
      pickerTab: 'wheels',
    }
  }

  const targetSlot = activeTeamSlots.find((slot) => slot.slotId === target.slotId)
  if (!targetSlot?.awakenerId) {
    return {
      kind: 'violation',
      message: 'Wheels require an awakener in that slot.',
      pickerTab: 'wheels',
    }
  }

  const wheelOwner = allowDuplicateAwakenerIdentities
    ? undefined
    : usedWheelByTeamOrder.get(wheelId)
  const targetSelection =
    activeSelection?.kind === 'wheel'
      ? {kind: 'wheel' as const, slotId: target.slotId, wheelIndex: target.wheelIndex}
      : activeSelection

  if (
    wheelOwner?.teamId === activeTeamId &&
    (wheelOwner.slotId !== target.slotId || wheelOwner.wheelIndex !== target.wheelIndex)
  ) {
    return {
      kind: 'slots',
      nextSlots: swapWheelAssignments(
        activeTeamSlots,
        wheelOwner.slotId,
        wheelOwner.wheelIndex,
        target.slotId,
        target.wheelIndex,
      ).nextSlots,
      changed: true,
      clearTransfer: false,
      activeSelection: targetSelection,
      activeTeamTarget: null,
    }
  }

  if (wheelOwner && wheelOwner.teamId !== activeTeamId && !targetSlot.isSupport) {
    return {
      kind: 'wheel-transfer',
      wheelId,
      fromTeamId: wheelOwner.teamId,
      fromSlotId: wheelOwner.slotId,
      fromWheelIndex: wheelOwner.wheelIndex,
      toTeamId: activeTeamId,
      targetSlotId: target.slotId,
      targetWheelIndex: target.wheelIndex,
      pickerTab: 'wheels',
    }
  }

  const result = assignWheelToSlot(activeTeamSlots, target.slotId, target.wheelIndex, wheelId)
  return {
    kind: 'slots',
    nextSlots: result.nextSlots,
    changed: result.nextSlots !== activeTeamSlots,
    clearTransfer: result.nextSlots !== activeTeamSlots,
    activeSelection: targetSelection,
    activeTeamTarget: null,
    pickerTab: result.nextSlots === activeTeamSlots ? 'wheels' : undefined,
  }
}

export function resolveAssignCovenantCommand({
  activeSelection,
  activeTeamSlots,
  covenantId,
}: AssignCovenantCommandOptions): BuilderV2ResolvedLoadoutCommand {
  const targetSlotId = getSlotTargetFromSelection(activeSelection)
  if (!targetSlotId) {
    return {
      kind: 'violation',
      message: 'Select a covenant slot or awakened slot before assigning a covenant.',
      pickerTab: 'covenants',
    }
  }

  const targetSlot = activeTeamSlots.find((slot) => slot.slotId === targetSlotId)
  if (!targetSlot?.awakenerId) {
    return {
      kind: 'violation',
      message: 'Covenants require an awakener in that slot.',
      pickerTab: 'covenants',
    }
  }

  const sourceSlot = activeTeamSlots.find(
    (slot) => slot.slotId !== targetSlotId && slot.covenantId === covenantId,
  )
  const result = sourceSlot
    ? swapCovenantAssignments(activeTeamSlots, sourceSlot.slotId, targetSlotId)
    : assignCovenantToSlot(activeTeamSlots, targetSlotId, covenantId)
  return {
    kind: 'slots',
    nextSlots: result.nextSlots,
    changed: result.nextSlots !== activeTeamSlots,
    clearTransfer: false,
    activeSelection:
      activeSelection?.kind === 'covenant'
        ? {kind: 'covenant', slotId: targetSlotId}
        : activeSelection,
    activeTeamTarget: null,
    pickerTab: result.nextSlots === activeTeamSlots ? 'covenants' : undefined,
  }
}

export function resolveAssignPosseCommand({
  activeTeamId,
  allowDuplicateAwakenerIdentities,
  posseById,
  posseId,
  teams,
  usedPosseByTeamOrder,
}: AssignPosseCommandOptions): BuilderV2ResolvedLoadoutCommand {
  const owningTeamOrder = allowDuplicateAwakenerIdentities
    ? undefined
    : usedPosseByTeamOrder.get(posseId)
  const owningTeam = owningTeamOrder === undefined ? undefined : teams.at(owningTeamOrder)

  if (owningTeam && owningTeam.id !== activeTeamId) {
    return {
      kind: 'posse-transfer',
      posseId,
      posseName: posseById.get(posseId)?.name ?? 'Posse',
      fromTeamId: owningTeam.id,
      toTeamId: activeTeamId,
      pickerTab: 'posses',
    }
  }

  return {
    kind: 'posse-assign',
    posseId,
    clearTransfer: true,
    activeSelection: null,
    activeTeamTarget: {kind: 'posse'},
    pickerTab: 'posses',
  }
}

function getFirstEmptyWheelIndex(slot: TeamSlot | undefined): 0 | 1 | null {
  if (!slot?.awakenerId) {
    return null
  }

  const firstEmptyIndex = slot.wheels.findIndex((wheelId) => !wheelId)
  return firstEmptyIndex === 0 || firstEmptyIndex === 1 ? firstEmptyIndex : null
}

function getWheelAssignmentTarget(
  activeSelection: ActiveSelection,
  slots: TeamSlot[],
): {slotId: string; wheelIndex: 0 | 1} | null {
  if (activeSelection?.kind === 'wheel') {
    return {
      slotId: activeSelection.slotId,
      wheelIndex: activeSelection.wheelIndex === 0 ? 0 : 1,
    }
  }

  if (activeSelection?.kind !== 'awakener') {
    return null
  }

  const slot = slots.find((entry) => entry.slotId === activeSelection.slotId)
  const wheelIndex = getFirstEmptyWheelIndex(slot)
  return wheelIndex === null ? null : {slotId: activeSelection.slotId, wheelIndex}
}

function getSlotTargetFromSelection(activeSelection: ActiveSelection): string | null {
  if (activeSelection?.kind === 'awakener' || activeSelection?.kind === 'covenant') {
    return activeSelection.slotId
  }

  return null
}

interface CrossTeamAwakenerOwnerOptions {
  activeTeamId: string
  allowDuplicateAwakenerIdentities: boolean
  awakenerId: string
  slots: TeamSlot[]
  targetSlotId: string | undefined
  usedAwakenerByIdentityKey: Map<string, BuilderV2AwakenerUsage>
}

function getCrossTeamAwakenerOwner({
  activeTeamId,
  allowDuplicateAwakenerIdentities,
  awakenerId,
  slots,
  targetSlotId,
  usedAwakenerByIdentityKey,
}: CrossTeamAwakenerOwnerOptions): string | null {
  if (allowDuplicateAwakenerIdentities) {
    return null
  }

  const targetSlot = targetSlotId ? slots.find((slot) => slot.slotId === targetSlotId) : undefined
  if (targetSlot?.isSupport) {
    return null
  }

  const owningTeamId = usedAwakenerByIdentityKey.get(getAwakenerIdentityKeyById(awakenerId))?.teamId
  if (!owningTeamId || owningTeamId === activeTeamId) {
    return null
  }

  return owningTeamId
}

function getViolationMessage(violation: TeamStateViolationCode): string {
  if (violation === 'TOO_MANY_REALMS_IN_TEAM') {
    return 'A team can only contain up to 2 realms.'
  }

  return 'That assignment would break current builder rules.'
}
