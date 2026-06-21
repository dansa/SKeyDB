import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'
import type {Posse} from '@/domain/posses'

import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  assignCovenantToSlot,
  assignWheelToSlot,
  clearCovenantAssignment,
  clearWheelAssignment,
  swapCovenantAssignments,
  swapSlotAssignments,
  swapWheelAssignments,
  type TeamStateViolationCode,
} from '../builder/team-state'
import type {
  ActiveSelection,
  Team,
  TeamSlot,
  WheelSlotIndex,
  WheelUsageLocation,
} from '../builder/types'
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

type AssignAwakenerToTargetCommandOptions = Omit<
  AssignAwakenerCommandOptions,
  'activeSelection'
> & {
  targetSlotId: string
}

interface AssignWheelCommandOptions {
  activeSelection: ActiveSelection
  activeTeamId: string
  activeTeamSlots: TeamSlot[]
  allowDuplicateAwakenerIdentities: boolean
  usedWheelByTeamOrder: Map<string, WheelUsageLocation>
  wheelId: string
}

type AssignWheelToTargetCommandOptions = Omit<AssignWheelCommandOptions, 'activeSelection'> & {
  targetSlotId: string
  targetWheelIndex?: WheelSlotIndex
}

interface AssignCovenantCommandOptions {
  activeSelection: ActiveSelection
  activeTeamSlots: TeamSlot[]
  covenantId: string
}

type AssignCovenantToTargetCommandOptions = Omit<
  AssignCovenantCommandOptions,
  'activeSelection'
> & {
  targetSlotId: string
}

interface AssignPosseCommandOptions {
  activeTeamId: string
  allowDuplicateAwakenerIdentities: boolean
  posseById: Map<string, Posse>
  posseId: string
  teams: Team[]
  usedPosseByTeamOrder: Map<string, number>
}

interface RemoveWheelCommandOptions {
  activeTeamSlots: TeamSlot[]
  slotId: string
  wheelIndex: WheelSlotIndex
}

interface MoveAwakenerCommandOptions {
  activeTeamSlots: TeamSlot[]
  fromSlotId: string
  toSlotId: string
}

interface MoveWheelCommandOptions {
  activeTeamSlots: TeamSlot[]
  fromSlotId: string
  fromWheelIndex: WheelSlotIndex
  toSlotId: string
  toWheelIndex: WheelSlotIndex
}

interface MoveWheelToSlotCommandOptions {
  activeTeamSlots: TeamSlot[]
  fromSlotId: string
  fromWheelIndex: WheelSlotIndex
  toSlotId: string
}

interface RemoveCovenantCommandOptions {
  activeTeamSlots: TeamSlot[]
  slotId: string
}

interface MoveCovenantCommandOptions {
  activeTeamSlots: TeamSlot[]
  fromSlotId: string
  toSlotId: string
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
  fromWheelIndex: WheelSlotIndex
  toTeamId: string
  targetSlotId: string
  targetWheelIndex: WheelSlotIndex
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

  if (!result.changed) {
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
    changed: result.changed,
    clearTransfer: true,
    activeSelection: selectedSlotId ? {kind: 'awakener', slotId: selectedSlotId} : null,
    activeTeamTarget: null,
  }
}

export function resolveAssignAwakenerToTargetCommand({
  targetSlotId,
  ...options
}: AssignAwakenerToTargetCommandOptions): BuilderV2ResolvedLoadoutCommand {
  return resolveAssignAwakenerCommand({
    ...options,
    activeSelection: {kind: 'awakener', slotId: targetSlotId},
  })
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
    const result = swapWheelAssignments(
      activeTeamSlots,
      wheelOwner.slotId,
      wheelOwner.wheelIndex,
      target.slotId,
      target.wheelIndex,
    )
    if (result.violation) {
      return {
        kind: 'violation',
        message: getViolationMessage(result.violation),
        pickerTab: 'wheels',
      }
    }

    return {
      kind: 'slots',
      nextSlots: result.nextSlots,
      changed: result.changed,
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
  if (result.violation) {
    return {
      kind: 'violation',
      message: getViolationMessage(result.violation),
      pickerTab: 'wheels',
    }
  }

  return {
    kind: 'slots',
    nextSlots: result.nextSlots,
    changed: result.changed,
    clearTransfer: result.changed,
    activeSelection: targetSelection,
    activeTeamTarget: null,
    pickerTab: result.changed ? undefined : 'wheels',
  }
}

export function resolveAssignWheelToTargetCommand({
  targetSlotId,
  targetWheelIndex,
  ...options
}: AssignWheelToTargetCommandOptions): BuilderV2ResolvedLoadoutCommand {
  return resolveAssignWheelCommand({
    ...options,
    activeSelection:
      targetWheelIndex === undefined
        ? {kind: 'awakener', slotId: targetSlotId}
        : {kind: 'wheel', slotId: targetSlotId, wheelIndex: targetWheelIndex},
  })
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

  const result = assignCovenantToSlot(activeTeamSlots, targetSlotId, covenantId)
  return {
    kind: 'slots',
    nextSlots: result.nextSlots,
    changed: result.changed,
    clearTransfer: false,
    activeSelection:
      activeSelection?.kind === 'covenant'
        ? {kind: 'covenant', slotId: targetSlotId}
        : activeSelection,
    activeTeamTarget: null,
    pickerTab: result.changed ? undefined : 'covenants',
  }
}

export function resolveAssignCovenantToTargetCommand({
  targetSlotId,
  ...options
}: AssignCovenantToTargetCommandOptions): BuilderV2ResolvedLoadoutCommand {
  return resolveAssignCovenantCommand({
    ...options,
    activeSelection: {kind: 'covenant', slotId: targetSlotId},
  })
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

export function resolveRemoveWheelCommand({
  activeTeamSlots,
  slotId,
  wheelIndex,
}: RemoveWheelCommandOptions): BuilderV2ResolvedLoadoutCommand {
  const result = clearWheelAssignment(activeTeamSlots, slotId, wheelIndex)
  return {
    kind: 'slots',
    nextSlots: result.nextSlots,
    changed: result.changed,
    clearTransfer: true,
    activeSelection: {kind: 'wheel', slotId, wheelIndex},
    activeTeamTarget: null,
    pickerTab: 'wheels',
  }
}

export function resolveMoveAwakenerCommand({
  activeTeamSlots,
  fromSlotId,
  toSlotId,
}: MoveAwakenerCommandOptions): BuilderV2ResolvedLoadoutCommand {
  const result = swapSlotAssignments(activeTeamSlots, fromSlotId, toSlotId)
  return {
    kind: 'slots',
    nextSlots: result.nextSlots,
    changed: result.changed,
    clearTransfer: false,
    activeSelection: {kind: 'awakener', slotId: toSlotId},
    activeTeamTarget: null,
    pickerTab: 'awakeners',
  }
}

export function resolveMoveWheelCommand({
  activeTeamSlots,
  fromSlotId,
  fromWheelIndex,
  toSlotId,
  toWheelIndex,
}: MoveWheelCommandOptions): BuilderV2ResolvedLoadoutCommand {
  const result = swapWheelAssignments(
    activeTeamSlots,
    fromSlotId,
    fromWheelIndex,
    toSlotId,
    toWheelIndex,
  )
  if (result.violation) {
    return {
      kind: 'violation',
      message: getViolationMessage(result.violation),
      pickerTab: 'wheels',
    }
  }

  return {
    kind: 'slots',
    nextSlots: result.nextSlots,
    changed: result.changed,
    clearTransfer: false,
    activeSelection: {kind: 'wheel', slotId: toSlotId, wheelIndex: toWheelIndex},
    activeTeamTarget: null,
    pickerTab: 'wheels',
  }
}

export function resolveMoveWheelToSlotCommand({
  activeTeamSlots,
  fromSlotId,
  fromWheelIndex,
  toSlotId,
}: MoveWheelToSlotCommandOptions): BuilderV2ResolvedLoadoutCommand {
  const targetSlot = activeTeamSlots.find((slot) => slot.slotId === toSlotId)
  const toWheelIndex = getFirstEmptyWheelIndex(targetSlot)
  if (toWheelIndex === null) {
    return {
      kind: 'slots',
      nextSlots: activeTeamSlots,
      changed: false,
      clearTransfer: false,
      activeSelection: {kind: 'wheel', slotId: toSlotId, wheelIndex: 0},
      activeTeamTarget: null,
      pickerTab: 'wheels',
    }
  }

  return resolveMoveWheelCommand({
    activeTeamSlots,
    fromSlotId,
    fromWheelIndex,
    toSlotId,
    toWheelIndex,
  })
}

export function resolveRemoveCovenantCommand({
  activeTeamSlots,
  slotId,
}: RemoveCovenantCommandOptions): BuilderV2ResolvedLoadoutCommand {
  const result = clearCovenantAssignment(activeTeamSlots, slotId)
  return {
    kind: 'slots',
    nextSlots: result.nextSlots,
    changed: result.changed,
    clearTransfer: true,
    activeSelection: {kind: 'covenant', slotId},
    activeTeamTarget: null,
    pickerTab: 'covenants',
  }
}

export function resolveMoveCovenantCommand({
  activeTeamSlots,
  fromSlotId,
  toSlotId,
}: MoveCovenantCommandOptions): BuilderV2ResolvedLoadoutCommand {
  const result = swapCovenantAssignments(activeTeamSlots, fromSlotId, toSlotId)
  return {
    kind: 'slots',
    nextSlots: result.nextSlots,
    changed: result.changed,
    clearTransfer: false,
    activeSelection: {kind: 'covenant', slotId: toSlotId},
    activeTeamTarget: null,
    pickerTab: 'covenants',
  }
}

function getFirstEmptyWheelIndex(slot: TeamSlot | undefined): WheelSlotIndex | null {
  if (!slot?.awakenerId) {
    return null
  }

  const firstEmptyIndex = slot.wheels.findIndex((wheelId) => !wheelId)
  return firstEmptyIndex === 0 || firstEmptyIndex === 1 ? firstEmptyIndex : null
}

function getWheelAssignmentTarget(
  activeSelection: ActiveSelection,
  slots: TeamSlot[],
): {slotId: string; wheelIndex: WheelSlotIndex} | null {
  if (activeSelection?.kind === 'wheel') {
    return {
      slotId: activeSelection.slotId,
      wheelIndex: activeSelection.wheelIndex,
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
